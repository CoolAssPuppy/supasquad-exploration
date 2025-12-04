/**
 * Sync Orchestrator
 *
 * Coordinates the synchronization of activities from all connected
 * social platforms. Handles token refresh, activity fetching, and
 * error handling for each connection.
 *
 * This module is designed to be used by Edge Functions or background
 * jobs that run periodically to sync user activities.
 */

import type {
  ActivityFetcher,
  FetcherConfig,
  ProcessedActivity,
  SyncProvider,
} from './types'
import { DEFAULT_FETCHER_CONFIG } from './types'
import type { TokenPair, RefreshResult, Provider } from '../oauth/refresh'

/**
 * Represents a social connection from the database.
 */
export interface SyncConnection {
  id: string
  userId: string
  provider: SyncProvider | string
  providerUserId: string
  providerUsername: string | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: Date | null
}

/**
 * Result of syncing a single connection.
 */
export interface SyncResult {
  connectionId: string
  userId: string
  provider: string
  success: boolean
  activities: ProcessedActivity[]
  error?: string
  tokenRefreshed?: boolean
  newTokens?: {
    accessToken: string
    refreshToken: string | null
    expiresAt: Date | null
  }
}

/**
 * Configuration for the sync orchestrator.
 */
export interface OrchestratorConfig {
  /** Activity fetchers for each provider */
  fetchers: Partial<Record<SyncProvider, ActivityFetcher>>
  /** Function to refresh tokens if needed */
  refreshTokenFn: (provider: Provider, tokens: TokenPair) => Promise<RefreshResult>
  /** Function to decrypt stored tokens */
  decryptTokenFn: (encryptedToken: string) => string
  /** Fetch configuration (optional) */
  fetcherConfig?: FetcherConfig
}

/**
 * Supported providers for activity sync.
 */
const SUPPORTED_PROVIDERS: SyncProvider[] = ['github', 'twitter', 'linkedin']

/**
 * Sync Orchestrator Class
 *
 * Manages the synchronization of activities from social connections.
 * Designed to be dependency-injected with fetchers and utility functions
 * for testability.
 */
export class SyncOrchestrator {
  private readonly fetchers: Partial<Record<SyncProvider, ActivityFetcher>>
  private readonly refreshTokenFn: (
    provider: Provider,
    tokens: TokenPair
  ) => Promise<RefreshResult>
  private readonly decryptTokenFn: (encryptedToken: string) => string
  private readonly fetcherConfig: FetcherConfig

  constructor(config: OrchestratorConfig) {
    this.fetchers = config.fetchers
    this.refreshTokenFn = config.refreshTokenFn
    this.decryptTokenFn = config.decryptTokenFn
    this.fetcherConfig = config.fetcherConfig || DEFAULT_FETCHER_CONFIG
  }

  /**
   * Syncs activities for a single connection.
   *
   * @param connection - The social connection to sync
   * @returns SyncResult with activities or error
   */
  async syncConnection(connection: SyncConnection): Promise<SyncResult> {
    const { id, userId, provider, providerUserId, accessToken, refreshToken, tokenExpiresAt } =
      connection

    // Validate connection has an access token
    if (!accessToken) {
      return {
        connectionId: id,
        userId,
        provider,
        success: false,
        activities: [],
        error: 'No access token available for this connection',
      }
    }

    // Check if provider is supported
    if (!SUPPORTED_PROVIDERS.includes(provider as SyncProvider)) {
      return {
        connectionId: id,
        userId,
        provider,
        success: false,
        activities: [],
        error: `Provider ${provider} is not supported for activity sync`,
      }
    }

    const typedProvider = provider as SyncProvider

    // Get the appropriate fetcher
    const fetcher = this.fetchers[typedProvider]
    if (!fetcher) {
      return {
        connectionId: id,
        userId,
        provider,
        success: false,
        activities: [],
        error: `No fetcher configured for provider ${provider}`,
      }
    }

    try {
      // Decrypt tokens
      const decryptedAccessToken = this.decryptTokenFn(accessToken)
      const decryptedRefreshToken = refreshToken
        ? this.decryptTokenFn(refreshToken)
        : null

      // Check if token refresh is needed
      const tokenPair: TokenPair = {
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
        expiresAt: tokenExpiresAt,
      }

      const refreshResult = await this.refreshTokenFn(typedProvider as Provider, tokenPair)

      if (!refreshResult.success) {
        return {
          connectionId: id,
          userId,
          provider,
          success: false,
          activities: [],
          error: refreshResult.error || 'Token refresh failed',
        }
      }

      const currentTokens = refreshResult.tokens!
      const tokenWasRefreshed =
        currentTokens.accessToken !== decryptedAccessToken

      // Fetch activities using the (possibly refreshed) token
      const fetchResult = await fetcher.fetchActivities(
        currentTokens.accessToken,
        providerUserId,
        this.fetcherConfig
      )

      if (!fetchResult.success) {
        return {
          connectionId: id,
          userId,
          provider,
          success: false,
          activities: [],
          error: fetchResult.error || 'Failed to fetch activities',
          tokenRefreshed: tokenWasRefreshed,
          newTokens: tokenWasRefreshed
            ? {
                accessToken: currentTokens.accessToken,
                refreshToken: currentTokens.refreshToken,
                expiresAt: currentTokens.expiresAt,
              }
            : undefined,
        }
      }

      // Map raw activities to processed activities
      const processedActivities = fetchResult.activities.map((raw) =>
        fetcher.mapToProcessedActivity(raw)
      )

      return {
        connectionId: id,
        userId,
        provider,
        success: true,
        activities: processedActivities,
        tokenRefreshed: tokenWasRefreshed,
        newTokens: tokenWasRefreshed
          ? {
              accessToken: currentTokens.accessToken,
              refreshToken: currentTokens.refreshToken,
              expiresAt: currentTokens.expiresAt,
            }
          : undefined,
      }
    } catch (error) {
      return {
        connectionId: id,
        userId,
        provider,
        success: false,
        activities: [],
        error:
          error instanceof Error ? error.message : 'Unknown error during sync',
      }
    }
  }

  /**
   * Syncs activities for multiple connections.
   *
   * @param connections - Array of social connections to sync
   * @returns Array of SyncResults, one for each connection
   */
  async syncAllConnections(
    connections: SyncConnection[]
  ): Promise<SyncResult[]> {
    if (connections.length === 0) {
      return []
    }

    // Process connections sequentially to avoid rate limiting
    // In production, you might want to add concurrency limits or batching
    const results: SyncResult[] = []

    for (const connection of connections) {
      try {
        const result = await this.syncConnection(connection)
        results.push(result)
      } catch (error) {
        // Even if one connection throws, continue with others
        results.push({
          connectionId: connection.id,
          userId: connection.userId,
          provider: connection.provider,
          success: false,
          activities: [],
          error:
            error instanceof Error
              ? error.message
              : 'Unexpected error during sync',
        })
      }
    }

    return results
  }
}
