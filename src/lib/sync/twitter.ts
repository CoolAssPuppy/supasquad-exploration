/**
 * Twitter Activity Fetcher
 *
 * Fetches user tweets from the Twitter API v2 and maps them to
 * standardized activity records for the SupaSquad platform.
 *
 * Filters out:
 * - Retweets (not original content)
 * - Replies (unless they have high engagement)
 *
 * Includes:
 * - Original tweets
 * - Quote tweets (valuable commentary)
 *
 * Twitter API Reference: https://developer.twitter.com/en/docs/twitter-api
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
 * Twitter API v2 tweet structure.
 */
interface Tweet {
  id: string
  text: string
  created_at: string
  author_id?: string
  public_metrics?: TweetMetrics
  referenced_tweets?: ReferencedTweet[]
}

interface TweetMetrics {
  like_count: number
  retweet_count: number
  reply_count: number
  quote_count: number
}

interface ReferencedTweet {
  type: 'retweeted' | 'quoted' | 'replied_to'
  id: string
}

interface TwitterApiResponse {
  data?: Tweet[]
  meta?: {
    result_count: number
    next_token?: string
  }
  errors?: Array<{ message: string }>
}

/**
 * Maximum length for activity titles.
 */
const MAX_TITLE_LENGTH = 280

/**
 * Base URL for Twitter API v2.
 */
const TWITTER_API_BASE = 'https://api.twitter.com/2'

/**
 * Tweet fields to request from the API.
 */
const TWEET_FIELDS = [
  'created_at',
  'public_metrics',
  'referenced_tweets',
  'author_id',
].join(',')

/**
 * Engagement thresholds for point calculation.
 */
const ENGAGEMENT_THRESHOLDS = {
  LOW: 10,
  MEDIUM: 50,
  HIGH: 200,
}

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
 * Calculates total engagement from tweet metrics.
 */
function calculateTotalEngagement(metrics: TweetMetrics): number {
  return (
    metrics.like_count +
    metrics.retweet_count +
    metrics.reply_count +
    metrics.quote_count
  )
}

/**
 * Determines if a tweet is a retweet.
 */
function isRetweet(tweet: Tweet): boolean {
  return tweet.referenced_tweets?.some((ref) => ref.type === 'retweeted') ?? false
}

/**
 * Determines if a tweet is a reply.
 */
function isReply(tweet: Tweet): boolean {
  return tweet.referenced_tweets?.some((ref) => ref.type === 'replied_to') ?? false
}

/**
 * Determines if a tweet is a quote tweet.
 */
function isQuoteTweet(tweet: Tweet): boolean {
  return tweet.referenced_tweets?.some((ref) => ref.type === 'quoted') ?? false
}

/**
 * Detects if a tweet mentions video content.
 */
function isVideoContent(text: string): boolean {
  const videoKeywords = [
    'video',
    'youtube',
    'tutorial',
    'watch',
    'streaming',
    'twitch',
    'loom',
  ]
  const lowerText = text.toLowerCase()
  return videoKeywords.some((keyword) => lowerText.includes(keyword))
}

/**
 * Maps a single tweet to a raw provider activity.
 * Returns null for tweets that should be filtered out.
 *
 * @param tweet - Tweet from the API
 * @param username - Twitter username for URL construction
 * @returns Raw activity or null
 */
export function mapTweetToActivity(
  tweet: Tweet,
  username: string
): RawProviderActivity | null {
  // Filter out retweets
  if (isRetweet(tweet)) {
    return null
  }

  // Filter out replies (we only want original content)
  if (isReply(tweet)) {
    return null
  }

  const metrics = tweet.public_metrics || {
    like_count: 0,
    retweet_count: 0,
    reply_count: 0,
    quote_count: 0,
  }

  const totalEngagement = calculateTotalEngagement(metrics)

  return {
    providerActivityId: tweet.id,
    timestamp: new Date(tweet.created_at),
    title: truncate(tweet.text, MAX_TITLE_LENGTH),
    url: `https://twitter.com/${username}/status/${tweet.id}`,
    metadata: {
      likeCount: metrics.like_count,
      retweetCount: metrics.retweet_count,
      replyCount: metrics.reply_count,
      quoteCount: metrics.quote_count,
      totalEngagement,
      isQuoteTweet: isQuoteTweet(tweet),
    },
  }
}

/**
 * Twitter activity fetcher implementation.
 *
 * Fetches user tweets from the Twitter API v2 and transforms them
 * into standardized activity records.
 */
export class TwitterActivityFetcher implements ActivityFetcher {
  /**
   * Fetches recent tweets from Twitter for a user.
   *
   * @param accessToken - Twitter OAuth 2.0 access token
   * @param providerUserId - Twitter user ID (not username)
   * @param config - Fetch configuration
   * @returns FetchResult with activities or error
   */
  async fetchActivities(
    accessToken: string,
    providerUserId: string,
    config: FetcherConfig
  ): Promise<FetchResult> {
    const startTime = new Date(
      Date.now() - config.lookbackHours * 60 * 60 * 1000
    ).toISOString()

    const params = new URLSearchParams({
      'tweet.fields': TWEET_FIELDS,
      max_results: String(Math.min(config.maxResults, 100)), // Twitter max is 100
      start_time: startTime,
    })

    const url = `${TWITTER_API_BASE}/users/${providerUserId}/tweets?${params}`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        return this.handleErrorResponse(response)
      }

      const data: TwitterApiResponse = await response.json()

      // Handle empty response
      if (!data.data || data.meta?.result_count === 0) {
        return {
          success: true,
          activities: [],
        }
      }

      const cutoffTime = new Date(
        Date.now() - config.lookbackHours * 60 * 60 * 1000
      )

      // We need the username for URL construction
      // For now, we'll use a placeholder since we have the user ID
      // In production, this would be fetched or passed in
      const username = providerUserId

      const activities: RawProviderActivity[] = []

      for (const tweet of data.data) {
        const tweetTime = new Date(tweet.created_at)

        // Skip tweets outside the lookback window
        if (tweetTime < cutoffTime) {
          continue
        }

        const activity = mapTweetToActivity(tweet, username)

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
            : 'Unknown error fetching Twitter activities',
      }
    }
  }

  /**
   * Maps a raw Twitter activity to a processed activity record.
   *
   * @param raw - Raw activity from Twitter
   * @returns Processed activity ready for database insertion
   */
  mapToProcessedActivity(raw: RawProviderActivity): ProcessedActivity {
    const totalEngagement = (raw.metadata.totalEngagement as number) || 0

    // Determine activity type based on content
    let activityType: SyncableActivityType = 'blog_post'

    if (isVideoContent(raw.title)) {
      activityType = 'video_tutorial'
    }

    // Base points from activity type
    const basePoints: Record<SyncableActivityType, number> = {
      blog_post: 100,
      video_tutorial: 150,
      oss_contribution: 50,
      community_answers: 25,
    }

    let suggestedPoints = basePoints[activityType]

    // Adjust points based on engagement
    if (totalEngagement >= ENGAGEMENT_THRESHOLDS.HIGH) {
      suggestedPoints = Math.round(suggestedPoints * 1.5)
    } else if (totalEngagement >= ENGAGEMENT_THRESHOLDS.MEDIUM) {
      suggestedPoints = Math.round(suggestedPoints * 1.25)
    } else if (totalEngagement < ENGAGEMENT_THRESHOLDS.LOW) {
      suggestedPoints = Math.round(suggestedPoints * 0.75)
    }

    return {
      provider: 'twitter',
      providerActivityId: raw.providerActivityId,
      activityType,
      title: raw.title,
      description: null,
      url: raw.url || null,
      suggestedPoints,
      eventDate: raw.timestamp,
    }
  }

  /**
   * Handles non-OK responses from the Twitter API.
   */
  private async handleErrorResponse(response: Response): Promise<FetchResult> {
    const status = response.status

    if (status === 401) {
      return {
        success: false,
        activities: [],
        error: 'Twitter token is unauthorized or expired',
      }
    }

    if (status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset')
      const resetDate = resetTime
        ? new Date(parseInt(resetTime, 10) * 1000).toISOString()
        : 'unknown'

      return {
        success: false,
        activities: [],
        error: `Twitter API rate limit exceeded. Resets at ${resetDate}`,
      }
    }

    if (status === 403) {
      return {
        success: false,
        activities: [],
        error: 'Twitter API access forbidden. Check app permissions.',
      }
    }

    try {
      const errorData = await response.json()
      const message = errorData.errors?.[0]?.message || `HTTP ${status}`
      return {
        success: false,
        activities: [],
        error: `Twitter API error: ${message}`,
      }
    } catch {
      return {
        success: false,
        activities: [],
        error: `Twitter API error: HTTP ${status}`,
      }
    }
  }
}
