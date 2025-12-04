/**
 * LinkedIn Activity Fetcher
 *
 * Fetches user posts from the LinkedIn API (UGC Posts) and maps them to
 * standardized activity records for the SupaSquad platform.
 *
 * Supported content types:
 * - Text posts (share commentary)
 * - Article shares (with external links)
 * - Video posts
 *
 * LinkedIn API Reference: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 */

import type {
  ActivityFetcher,
  FetcherConfig,
  FetchResult,
  RawProviderActivity,
  ProcessedActivity,
  SyncableActivityType,
} from './types'

/**
 * LinkedIn UGC Post structure.
 */
interface LinkedInPost {
  id: string
  author: string
  created: {
    time: number
  }
  specificContent: {
    'com.linkedin.ugc.ShareContent'?: ShareContent
  }
  lifecycleState: 'PUBLISHED' | 'DRAFT' | 'PROCESSING' | 'DELETED'
}

interface ShareContent {
  shareCommentary?: {
    text: string
  }
  shareMediaCategory?: 'NONE' | 'ARTICLE' | 'IMAGE' | 'VIDEO' | 'RICH'
  media?: LinkedInMedia[]
}

interface LinkedInMedia {
  status: string
  originalUrl?: string
  title?: { text: string }
  description?: { text: string }
}

interface LinkedInApiResponse {
  elements: LinkedInPost[]
  paging?: {
    count: number
    start: number
    total: number
  }
}

/**
 * Maximum length for activity titles.
 */
const MAX_TITLE_LENGTH = 200

/**
 * Base URL for LinkedIn API.
 */
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

/**
 * Bonus points for article content (more effort than regular posts).
 */
const ARTICLE_BONUS_POINTS = 25

/**
 * Truncates text to max length with ellipsis.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Extracts the share content from a LinkedIn post.
 */
function getShareContent(post: LinkedInPost): ShareContent | null {
  return post.specificContent['com.linkedin.ugc.ShareContent'] || null
}

/**
 * Determines the media type from a LinkedIn post.
 */
function getMediaType(content: ShareContent): string | null {
  if (!content.shareMediaCategory || content.shareMediaCategory === 'NONE') {
    return null
  }
  return content.shareMediaCategory
}

/**
 * Constructs a LinkedIn post URL from its URN.
 */
function constructPostUrl(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}`
}

/**
 * Maps a single LinkedIn post to a raw provider activity.
 * Returns null for posts that should be filtered out.
 *
 * @param post - LinkedIn post from the API
 * @returns Raw activity or null
 */
export function mapLinkedInPostToActivity(
  post: LinkedInPost
): RawProviderActivity | null {
  // Skip non-published posts
  if (post.lifecycleState !== 'PUBLISHED') {
    return null
  }

  const content = getShareContent(post)
  if (!content) {
    return null
  }

  const mediaType = getMediaType(content)
  const isArticle = mediaType === 'ARTICLE'

  // Extract title: prefer article title, fall back to commentary
  let title = ''
  let articleUrl: string | undefined

  if (isArticle && content.media?.[0]) {
    const media = content.media[0]
    title = media.title?.text || content.shareCommentary?.text || ''
    articleUrl = media.originalUrl
  } else {
    title = content.shareCommentary?.text || ''
  }

  if (!title) {
    return null
  }

  return {
    providerActivityId: post.id,
    timestamp: new Date(post.created.time),
    title: truncate(title, MAX_TITLE_LENGTH),
    description: content.shareCommentary?.text || undefined,
    url: articleUrl || constructPostUrl(post.id),
    metadata: {
      hasArticle: isArticle,
      hasMedia: !!mediaType,
      mediaType: mediaType || undefined,
      articleUrl,
    },
  }
}

/**
 * LinkedIn activity fetcher implementation.
 *
 * Fetches user posts from the LinkedIn UGC Posts API and transforms them
 * into standardized activity records.
 */
export class LinkedInActivityFetcher implements ActivityFetcher {
  /**
   * Fetches recent posts from LinkedIn for a user.
   *
   * @param accessToken - LinkedIn OAuth access token
   * @param providerUserId - LinkedIn person URN (e.g., "urn:li:person:ABC123")
   * @param config - Fetch configuration
   * @returns FetchResult with activities or error
   */
  async fetchActivities(
    accessToken: string,
    providerUserId: string,
    config: FetcherConfig
  ): Promise<FetchResult> {
    const params = new URLSearchParams({
      q: 'authors',
      authors: providerUserId,
      count: String(Math.min(config.maxResults, 100)),
    })

    const url = `${LINKEDIN_API_BASE}/ugcPosts?${params}`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      })

      if (!response.ok) {
        return this.handleErrorResponse(response)
      }

      const data: LinkedInApiResponse = await response.json()

      if (!data.elements || data.elements.length === 0) {
        return {
          success: true,
          activities: [],
        }
      }

      const cutoffTime = Date.now() - config.lookbackHours * 60 * 60 * 1000
      const activities: RawProviderActivity[] = []

      for (const post of data.elements) {
        // Skip posts outside the lookback window
        if (post.created.time < cutoffTime) {
          continue
        }

        const activity = mapLinkedInPostToActivity(post)

        if (activity) {
          activities.push(activity)
        }

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
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error fetching LinkedIn activities',
      }
    }
  }

  /**
   * Maps a raw LinkedIn activity to a processed activity record.
   *
   * @param raw - Raw activity from LinkedIn
   * @returns Processed activity ready for database insertion
   */
  mapToProcessedActivity(raw: RawProviderActivity): ProcessedActivity {
    const hasArticle = raw.metadata.hasArticle as boolean
    const mediaType = raw.metadata.mediaType as string | undefined

    // Determine activity type
    let activityType: SyncableActivityType = 'blog_post'

    if (mediaType === 'VIDEO' || raw.title.toLowerCase().includes('video')) {
      activityType = 'video_tutorial'
    }

    // Base points
    const basePoints: Record<SyncableActivityType, number> = {
      blog_post: 100,
      video_tutorial: 150,
      oss_contribution: 50,
      community_answers: 25,
    }

    let suggestedPoints = basePoints[activityType]

    // Bonus for article content (requires more effort)
    if (hasArticle) {
      suggestedPoints += ARTICLE_BONUS_POINTS
    }

    return {
      provider: 'linkedin',
      providerActivityId: raw.providerActivityId,
      activityType,
      title: raw.title,
      description: raw.description || null,
      url: raw.url || null,
      suggestedPoints,
      eventDate: raw.timestamp,
    }
  }

  /**
   * Handles non-OK responses from the LinkedIn API.
   */
  private async handleErrorResponse(response: Response): Promise<FetchResult> {
    const status = response.status

    if (status === 401) {
      return {
        success: false,
        activities: [],
        error: 'LinkedIn token is unauthorized or expired',
      }
    }

    if (status === 429) {
      return {
        success: false,
        activities: [],
        error: 'LinkedIn API rate limit exceeded',
      }
    }

    if (status === 403) {
      return {
        success: false,
        activities: [],
        error: 'LinkedIn API access forbidden. Check app permissions.',
      }
    }

    try {
      const errorData = await response.json()
      const message = errorData.message || `HTTP ${status}`
      return {
        success: false,
        activities: [],
        error: `LinkedIn API error: ${message}`,
      }
    } catch {
      return {
        success: false,
        activities: [],
        error: `LinkedIn API error: HTTP ${status}`,
      }
    }
  }
}
