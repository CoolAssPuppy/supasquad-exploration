/**
 * Activity Sync API Route
 *
 * This endpoint triggers synchronization of activities from all connected
 * social platforms. It should be called periodically by a cron job.
 *
 * Security:
 * - Requires an API key in the Authorization header
 * - Uses service role to access encrypted tokens
 *
 * Usage:
 * - POST /api/sync/activities
 * - Header: Authorization: Bearer <SYNC_API_KEY>
 *
 * Recommended cron schedule: Every 15 minutes
 * See docs/CRON-SETUP.md for configuration details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  SyncOrchestrator,
  GitHubActivityFetcher,
  TwitterActivityFetcher,
  LinkedInActivityFetcher,
  DEFAULT_FETCHER_CONFIG,
} from '@/lib/sync'
import type { SyncConnection, ProcessedActivity } from '@/lib/sync'
import { refreshIfNeeded } from '@/lib/oauth/refresh'
import { decryptTokenSafe, encryptTokenSafe } from '@/lib/crypto/tokens'

/**
 * Validates the sync API key from the request.
 */
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  const apiKey = authHeader.slice(7)
  const expectedKey = process.env.SYNC_API_KEY

  if (!expectedKey) {
    console.error('SYNC_API_KEY environment variable is not set')
    return false
  }

  // Timing-safe comparison
  if (apiKey.length !== expectedKey.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i)
  }

  return result === 0
}

/**
 * Creates a Supabase client with service role access.
 * Required to read encrypted tokens from the database.
 */
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Fetches all social connections that need syncing.
 */
async function getConnectionsToSync(
  supabase: ReturnType<typeof createServiceClient>
): Promise<SyncConnection[]> {
  const { data, error } = await supabase
    .from('social_connections')
    .select('id, user_id, provider, provider_user_id, provider_username, access_token, refresh_token, token_expires_at')
    .in('provider', ['github', 'twitter', 'linkedin'])
    .not('access_token', 'is', null)

  if (error) {
    console.error('Failed to fetch connections:', error)
    throw new Error(`Database error: ${error.message}`)
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    providerUsername: row.provider_username,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
  }))
}

/**
 * Updates connection tokens in the database after refresh.
 */
async function updateConnectionTokens(
  supabase: ReturnType<typeof createServiceClient>,
  connectionId: string,
  newTokens: {
    accessToken: string
    refreshToken: string | null
    expiresAt: Date | null
  }
): Promise<void> {
  const { error } = await supabase
    .from('social_connections')
    .update({
      access_token: encryptTokenSafe(newTokens.accessToken),
      refresh_token: newTokens.refreshToken
        ? encryptTokenSafe(newTokens.refreshToken)
        : null,
      token_expires_at: newTokens.expiresAt?.toISOString() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)

  if (error) {
    console.error(`Failed to update tokens for connection ${connectionId}:`, error)
  }
}

/**
 * Inserts new activities into pending_activities table.
 * Skips duplicates based on provider_activity_id.
 */
async function insertPendingActivities(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  activities: ProcessedActivity[]
): Promise<{ inserted: number; skipped: number }> {
  if (activities.length === 0) {
    return { inserted: 0, skipped: 0 }
  }

  // Check for existing activities to avoid duplicates
  const providerActivityIds = activities.map((a) => a.providerActivityId)
  const { data: existing } = await supabase
    .from('pending_activities')
    .select('provider_activity_id')
    .eq('user_id', userId)
    .in('provider_activity_id', providerActivityIds)

  const existingIds = new Set(existing?.map((e) => e.provider_activity_id) || [])

  // Filter out duplicates
  const newActivities = activities.filter(
    (a) => !existingIds.has(a.providerActivityId)
  )

  if (newActivities.length === 0) {
    return { inserted: 0, skipped: activities.length }
  }

  // Insert new activities
  const rows = newActivities.map((activity) => ({
    user_id: userId,
    provider: activity.provider,
    provider_activity_id: activity.providerActivityId,
    activity_type: activity.activityType,
    title: activity.title,
    description: activity.description,
    url: activity.url,
    event_date: activity.eventDate?.toISOString().split('T')[0] || null,
    suggested_points: activity.suggestedPoints,
    status: 'pending',
  }))

  const { error } = await supabase.from('pending_activities').insert(rows)

  if (error) {
    console.error('Failed to insert pending activities:', error)
    return { inserted: 0, skipped: activities.length }
  }

  return {
    inserted: newActivities.length,
    skipped: activities.length - newActivities.length,
  }
}

/**
 * POST handler for activity sync.
 */
export async function POST(request: NextRequest) {
  // Validate API key
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()

  try {
    const supabase = createServiceClient()

    // Fetch all connections to sync
    const connections = await getConnectionsToSync(supabase)

    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connections to sync',
        duration: Date.now() - startTime,
      })
    }

    // Create orchestrator with dependencies
    const orchestrator = new SyncOrchestrator({
      fetchers: {
        github: new GitHubActivityFetcher(),
        twitter: new TwitterActivityFetcher(),
        linkedin: new LinkedInActivityFetcher(),
      },
      refreshTokenFn: refreshIfNeeded,
      decryptTokenFn: decryptTokenSafe,
      fetcherConfig: DEFAULT_FETCHER_CONFIG,
    })

    // Sync all connections
    const results = await orchestrator.syncAllConnections(connections)

    // Process results
    const summary = {
      total: results.length,
      successful: 0,
      failed: 0,
      activitiesFound: 0,
      activitiesInserted: 0,
      activitiesSkipped: 0,
      tokensRefreshed: 0,
    }

    for (const result of results) {
      if (result.success) {
        summary.successful++
        summary.activitiesFound += result.activities.length

        // Insert activities into pending_activities
        const { inserted, skipped } = await insertPendingActivities(
          supabase,
          result.userId,
          result.activities
        )
        summary.activitiesInserted += inserted
        summary.activitiesSkipped += skipped
      } else {
        summary.failed++
        console.error(
          `Sync failed for connection ${result.connectionId}:`,
          result.error
        )
      }

      // Update tokens if they were refreshed
      if (result.tokenRefreshed && result.newTokens) {
        summary.tokensRefreshed++
        await updateConnectionTokens(
          supabase,
          result.connectionId,
          result.newTokens
        )
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Activity sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for health check / status.
 */
export async function GET(request: NextRequest) {
  // Validate API key
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = createServiceClient()

    // Get connection counts by provider
    const { data: connections, error } = await supabase
      .from('social_connections')
      .select('provider')
      .in('provider', ['github', 'twitter', 'linkedin'])
      .not('access_token', 'is', null)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    const providerCounts = (connections || []).reduce(
      (acc, { provider }) => {
        acc[provider] = (acc[provider] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      status: 'healthy',
      providers: {
        github: providerCounts.github || 0,
        twitter: providerCounts.twitter || 0,
        linkedin: providerCounts.linkedin || 0,
      },
      totalConnections: connections?.length || 0,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
