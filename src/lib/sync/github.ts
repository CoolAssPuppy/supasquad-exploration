/**
 * GitHub Activity Fetcher
 *
 * Fetches user events from the GitHub API and maps them to
 * standardized activity records for the SupaSquad platform.
 *
 * Supported event types:
 * - PushEvent: Individual commits to repositories
 * - PullRequestEvent: Pull request creation
 * - IssuesEvent: Issue creation
 * - IssueCommentEvent: Comments on issues (community answers)
 *
 * GitHub API Reference: https://docs.github.com/en/rest/activity/events
 */

import type {
  ActivityFetcher,
  FetcherConfig,
  FetchResult,
  RawProviderActivity,
  ProcessedActivity,
} from './types'

/**
 * GitHub API event structure.
 * Only includes fields we actually use to avoid over-typing.
 */
interface GitHubEvent {
  id: string
  type: string
  created_at: string
  repo: {
    name: string
  }
  payload: GitHubEventPayload
}

interface GitHubEventPayload {
  ref?: string
  action?: string
  commits?: GitHubCommit[]
  pull_request?: {
    number: number
    title: string
    body?: string
    html_url: string
  }
  issue?: {
    number: number
    title: string
    body?: string
    html_url: string
  }
  comment?: {
    body: string
    html_url: string
  }
}

interface GitHubCommit {
  sha: string
  message: string
}

/**
 * Maximum length for activity titles.
 * Longer titles are truncated with ellipsis.
 */
const MAX_TITLE_LENGTH = 100

/**
 * GitHub API version header value.
 * Using a fixed version ensures consistent behavior.
 */
const GITHUB_API_VERSION = '2022-11-28'

/**
 * Base URL for GitHub API.
 */
const GITHUB_API_BASE = 'https://api.github.com'

/**
 * Truncates a string to the specified length, adding ellipsis if needed.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Extracts branch name from a git ref string.
 * Example: "refs/heads/main" -> "main"
 */
function extractBranchName(ref: string): string {
  const prefix = 'refs/heads/'
  if (ref.startsWith(prefix)) {
    return ref.slice(prefix.length)
  }
  return ref
}

/**
 * Maps a single GitHub event to one or more raw provider activities.
 * Returns null for unsupported event types, empty array for events with no activities.
 *
 * @param event - GitHub event from the API
 * @returns Array of raw activities, null if unsupported, or empty array
 */
export function mapGitHubEventToActivity(
  event: GitHubEvent
): RawProviderActivity[] | null {
  const timestamp = new Date(event.created_at)
  const repo = event.repo.name

  switch (event.type) {
    case 'PushEvent': {
      const commits = event.payload.commits || []
      if (commits.length === 0) {
        return []
      }

      const branch = event.payload.ref
        ? extractBranchName(event.payload.ref)
        : 'unknown'

      return commits.map((commit) => ({
        providerActivityId: `${event.id}-${commit.sha}`,
        timestamp,
        title: truncate(commit.message.split('\n')[0], MAX_TITLE_LENGTH),
        description: `Commit to ${repo} on ${branch}`,
        url: `https://github.com/${repo}/commit/${commit.sha}`,
        metadata: {
          eventType: 'PushEvent',
          repo,
          branch,
          sha: commit.sha,
          fullMessage: commit.message,
        },
      }))
    }

    case 'PullRequestEvent': {
      const pr = event.payload.pull_request
      const action = event.payload.action

      // Only track opened and merged PRs
      if (action !== 'opened' && action !== 'reopened') {
        return null
      }

      if (!pr) {
        return null
      }

      return [
        {
          providerActivityId: `${event.id}`,
          timestamp,
          title: truncate(`PR #${pr.number}: ${pr.title}`, MAX_TITLE_LENGTH),
          description: pr.body || undefined,
          url: pr.html_url,
          metadata: {
            eventType: 'PullRequestEvent',
            repo,
            prNumber: pr.number,
            action,
          },
        },
      ]
    }

    case 'IssuesEvent': {
      const issue = event.payload.issue
      const action = event.payload.action

      // Only track opened issues
      if (action !== 'opened') {
        return null
      }

      if (!issue) {
        return null
      }

      return [
        {
          providerActivityId: `${event.id}`,
          timestamp,
          title: truncate(`Issue #${issue.number}: ${issue.title}`, MAX_TITLE_LENGTH),
          description: issue.body || undefined,
          url: issue.html_url,
          metadata: {
            eventType: 'IssuesEvent',
            repo,
            issueNumber: issue.number,
            action,
          },
        },
      ]
    }

    case 'IssueCommentEvent': {
      const issue = event.payload.issue
      const comment = event.payload.comment
      const action = event.payload.action

      // Only track created comments
      if (action !== 'created') {
        return null
      }

      if (!issue || !comment) {
        return null
      }

      return [
        {
          providerActivityId: `${event.id}`,
          timestamp,
          title: truncate(`Comment on #${issue.number}: ${issue.title}`, MAX_TITLE_LENGTH),
          description: truncate(comment.body, 500),
          url: comment.html_url,
          metadata: {
            eventType: 'IssueCommentEvent',
            repo,
            issueNumber: issue.number,
          },
        },
      ]
    }

    default:
      return null
  }
}

/**
 * GitHub activity fetcher implementation.
 *
 * Fetches user events from the GitHub Events API and transforms them
 * into standardized activity records.
 */
export class GitHubActivityFetcher implements ActivityFetcher {
  /**
   * Fetches recent activities from GitHub for a user.
   *
   * @param accessToken - GitHub OAuth access token
   * @param providerUserId - GitHub username
   * @param config - Fetch configuration (maxResults, lookbackHours)
   * @returns FetchResult with activities or error
   */
  async fetchActivities(
    accessToken: string,
    providerUserId: string,
    config: FetcherConfig
  ): Promise<FetchResult> {
    const url = `${GITHUB_API_BASE}/users/${providerUserId}/events?per_page=${config.maxResults}`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'SupaSquad',
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
      })

      if (!response.ok) {
        return this.handleErrorResponse(response)
      }

      const events: GitHubEvent[] = await response.json()
      const cutoffTime = new Date(Date.now() - config.lookbackHours * 60 * 60 * 1000)

      const activities: RawProviderActivity[] = []

      for (const event of events) {
        const eventTime = new Date(event.created_at)

        // Skip events outside the lookback window
        if (eventTime < cutoffTime) {
          continue
        }

        const mapped = mapGitHubEventToActivity(event)

        if (mapped === null) {
          continue
        }

        activities.push(...mapped)

        // Respect maxResults limit
        if (activities.length >= config.maxResults) {
          break
        }
      }

      return {
        success: true,
        activities: activities.slice(0, config.maxResults),
      }
    } catch (error) {
      return {
        success: false,
        activities: [],
        error: error instanceof Error ? error.message : 'Unknown error fetching GitHub activities',
      }
    }
  }

  /**
   * Maps a raw GitHub activity to a processed activity record.
   *
   * @param raw - Raw activity from GitHub
   * @returns Processed activity ready for database insertion
   */
  mapToProcessedActivity(raw: RawProviderActivity): ProcessedActivity {
    const eventType = raw.metadata.eventType as string

    // Issue comments map to community_answers, everything else is oss_contribution
    const activityType = eventType === 'IssueCommentEvent'
      ? 'community_answers'
      : 'oss_contribution'

    // Point values from types.ts
    const pointValues = {
      oss_contribution: 50,
      community_answers: 25,
    }

    return {
      provider: 'github',
      providerActivityId: raw.providerActivityId,
      activityType,
      title: raw.title,
      description: raw.description || null,
      url: raw.url || null,
      suggestedPoints: pointValues[activityType],
      eventDate: raw.timestamp,
    }
  }

  /**
   * Handles non-OK responses from the GitHub API.
   */
  private async handleErrorResponse(response: Response): Promise<FetchResult> {
    const status = response.status

    if (status === 401) {
      return {
        success: false,
        activities: [],
        error: 'GitHub token is unauthorized or expired',
      }
    }

    if (status === 403) {
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')

      if (rateLimitRemaining === '0') {
        const resetTime = response.headers.get('X-RateLimit-Reset')
        const resetDate = resetTime
          ? new Date(parseInt(resetTime, 10) * 1000).toISOString()
          : 'unknown'

        return {
          success: false,
          activities: [],
          error: `GitHub API rate limit exceeded. Resets at ${resetDate}`,
        }
      }

      return {
        success: false,
        activities: [],
        error: 'GitHub API access forbidden',
      }
    }

    if (status === 404) {
      return {
        success: false,
        activities: [],
        error: 'GitHub user not found',
      }
    }

    const errorText = await response.text()
    return {
      success: false,
      activities: [],
      error: `GitHub API error: HTTP ${status} - ${errorText}`,
    }
  }
}
