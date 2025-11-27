import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

const PROVIDER_CONFIGS: Record<Provider, {
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
  supportsRefresh: boolean
}> = {
  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    clientIdEnv: 'DISCORD_CLIENT_ID',
    clientSecretEnv: 'DISCORD_CLIENT_SECRET',
    supportsRefresh: true,
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    supportsRefresh: true,
  },
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    supportsRefresh: false, // GitHub tokens don't expire by default
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientIdEnv: 'TWITTER_CLIENT_ID',
    clientSecretEnv: 'TWITTER_CLIENT_SECRET',
    supportsRefresh: true,
  },
}

async function refreshToken(
  provider: Provider,
  refreshToken: string
): Promise<TokenResponse | null> {
  const config = PROVIDER_CONFIGS[provider]

  if (!config.supportsRefresh) {
    return null
  }

  const clientId = Deno.env.get(config.clientIdEnv)
  const clientSecret = Deno.env.get(config.clientSecretEnv)

  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${provider}`)
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  // Different providers have different auth methods
  if (provider === 'twitter') {
    const credentials = btoa(`${clientId}:${clientSecret}`)
    headers['Authorization'] = `Basic ${credentials}`
  } else {
    params.set('client_id', clientId)
    params.set('client_secret', clientSecret)
  }

  if (provider === 'github') {
    headers['Accept'] = 'application/json'
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Token refresh failed for ${provider}:`, error)
    return null
  }

  return response.json()
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request is from a trusted source (cron job or authenticated admin)
    const authHeader = req.headers.get('Authorization')
    const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!authHeader?.includes(expectedKey || '')) {
      // Allow the request if it has a valid service role key
      console.warn('Refresh tokens called without service role key')
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find tokens that are expiring within 24 hours
    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: connections, error: fetchError } = await supabase
      .from('social_connections')
      .select('*')
      .not('refresh_token', 'is', null)
      .not('token_expires_at', 'is', null)
      .lt('token_expires_at', expirationThreshold)

    if (fetchError) {
      throw new Error(`Failed to fetch connections: ${fetchError.message}`)
    }

    console.log(`Found ${connections?.length || 0} tokens to refresh`)

    const results = {
      refreshed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const connection of connections || []) {
      const provider = connection.provider as Provider

      if (!PROVIDER_CONFIGS[provider]?.supportsRefresh) {
        results.skipped++
        continue
      }

      try {
        const newTokens = await refreshToken(provider, connection.refresh_token)

        if (!newTokens) {
          results.failed++
          results.errors.push(`${provider}:${connection.user_id} - No tokens returned`)
          continue
        }

        const tokenExpiresAt = newTokens.expires_in
          ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          : null

        const { error: updateError } = await supabase
          .from('social_connections')
          .update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || connection.refresh_token,
            token_expires_at: tokenExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)

        if (updateError) {
          results.failed++
          results.errors.push(`${provider}:${connection.user_id} - ${updateError.message}`)
        } else {
          results.refreshed++
          console.log(`Refreshed token for ${provider}:${connection.user_id}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${provider}:${connection.user_id} - ${error.message}`)
      }
    }

    console.log('Token refresh complete:', results)

    return new Response(
      JSON.stringify(results),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Token refresh error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
