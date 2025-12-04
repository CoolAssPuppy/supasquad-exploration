/**
 * Shared types for social activity synchronization.
 *
 * These types define the contract between provider-specific fetchers
 * and the core sync orchestrator.
 */

/**
 * Activity types that can be automatically detected from social platforms.
 * Maps to the activity_type enum in the database.
 */
export type SyncableActivityType =
  | 'blog_post'
  | 'oss_contribution'
  | 'community_answers'
  | 'video_tutorial'

/**
 * Supported OAuth providers for activity sync.
 */
export type SyncProvider = 'github' | 'twitter' | 'linkedin'

/**
 * Raw activity data fetched from a provider before processing.
 */
export interface RawProviderActivity {
  /** Unique identifier from the provider (commit SHA, tweet ID, etc.) */
  providerActivityId: string

  /** When the activity occurred */
  timestamp: Date

  /** Activity title or summary */
  title: string

  /** Optional description or content */
  description?: string

  /** URL to the activity on the provider's platform */
  url?: string

  /** Provider-specific metadata for point calculation */
  metadata: Record<string, unknown>
}

/**
 * Processed activity ready for insertion into pending_activities.
 */
export interface ProcessedActivity {
  provider: SyncProvider
  providerActivityId: string
  activityType: SyncableActivityType
  title: string
  description: string | null
  url: string | null
  suggestedPoints: number
  eventDate: Date | null
}

/**
 * Result of fetching activities from a provider.
 */
export interface FetchResult {
  success: boolean
  activities: RawProviderActivity[]
  error?: string
  /** Indicates if the token was refreshed during the fetch */
  tokenRefreshed?: boolean
  /** New tokens if refreshed */
  newTokens?: {
    accessToken: string
    refreshToken: string | null
    expiresAt: Date | null
  }
}

/**
 * Configuration for an activity fetcher.
 */
export interface FetcherConfig {
  /** Maximum number of activities to fetch per sync */
  maxResults: number
  /** How far back to look for activities (in hours) */
  lookbackHours: number
}

/**
 * Interface that all provider activity fetchers must implement.
 */
export interface ActivityFetcher {
  /**
   * Fetches recent activities from the provider.
   *
   * @param accessToken - Valid OAuth access token
   * @param providerUserId - User's ID on the provider platform
   * @param config - Fetch configuration
   * @returns FetchResult with activities or error
   */
  fetchActivities(
    accessToken: string,
    providerUserId: string,
    config: FetcherConfig
  ): Promise<FetchResult>

  /**
   * Maps raw provider activity to a processed activity.
   *
   * @param raw - Raw activity from the provider
   * @returns Processed activity ready for database insertion
   */
  mapToProcessedActivity(raw: RawProviderActivity): ProcessedActivity
}

/**
 * Default configuration for activity fetching.
 */
export const DEFAULT_FETCHER_CONFIG: FetcherConfig = {
  maxResults: 50,
  lookbackHours: 24,
}

/**
 * Point values for different activity types.
 * These are suggestions; actual points may be adjusted during review.
 */
export const ACTIVITY_POINTS: Record<SyncableActivityType, number> = {
  blog_post: 100,
  oss_contribution: 50,
  community_answers: 25,
  video_tutorial: 150,
}
