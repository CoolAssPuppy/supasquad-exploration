/**
 * Social Activity Sync Module
 *
 * Exports all activity fetchers and shared types for syncing
 * user activities from connected social platforms.
 */

// Types
export type {
  SyncableActivityType,
  SyncProvider,
  RawProviderActivity,
  ProcessedActivity,
  FetchResult,
  FetcherConfig,
  ActivityFetcher,
} from './types'

export { DEFAULT_FETCHER_CONFIG, ACTIVITY_POINTS } from './types'

// Fetchers
export { GitHubActivityFetcher, mapGitHubEventToActivity } from './github'
export { TwitterActivityFetcher, mapTweetToActivity } from './twitter'
export { LinkedInActivityFetcher, mapLinkedInPostToActivity } from './linkedin'

// Orchestrator
export type { SyncConnection, SyncResult, OrchestratorConfig } from './orchestrator'
export { SyncOrchestrator } from './orchestrator'
