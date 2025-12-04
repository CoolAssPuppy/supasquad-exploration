import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwitterActivityFetcher, mapTweetToActivity } from './twitter'
import type { FetcherConfig } from './types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('TwitterActivityFetcher', () => {
  const fetcher = new TwitterActivityFetcher()
  const defaultConfig: FetcherConfig = {
    maxResults: 50,
    lookbackHours: 24,
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('fetchActivities', () => {
    it('should fetch tweets from Twitter API with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { result_count: 0 } }),
      })

      await fetcher.fetchActivities('test-token', 'user123', defaultConfig)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.twitter.com/2/users/user123/tweets'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('should include required tweet fields in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { result_count: 0 } }),
      })

      await fetcher.fetchActivities('token', 'user123', defaultConfig)

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('tweet.fields=')
      expect(url).toContain('created_at')
      expect(url).toContain('public_metrics')
      expect(url).toContain('referenced_tweets')
    })

    it('should return empty activities when no tweets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ meta: { result_count: 0 } }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toEqual([])
    })

    it('should map tweets to activities', async () => {
      const tweet = {
        id: '123456789',
        text: 'Just published a new blog post about Supabase!',
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 10,
          reply_count: 5,
          like_count: 50,
          quote_count: 2,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [tweet], meta: { result_count: 1 } }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('123456789')
      expect(result.activities[0].title).toBe('Just published a new blog post about Supabase!')
    })

    it('should filter out replies by default', async () => {
      const originalTweet = {
        id: '1',
        text: 'My original tweet',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 10, retweet_count: 0, reply_count: 0, quote_count: 0 },
      }

      const replyTweet = {
        id: '2',
        text: '@someone Here is my reply',
        created_at: new Date().toISOString(),
        referenced_tweets: [{ type: 'replied_to', id: '999' }],
        public_metrics: { like_count: 5, retweet_count: 0, reply_count: 0, quote_count: 0 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [originalTweet, replyTweet],
          meta: { result_count: 2 },
        }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('1')
    })

    it('should filter out retweets', async () => {
      const originalTweet = {
        id: '1',
        text: 'My original tweet',
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 10, retweet_count: 0, reply_count: 0, quote_count: 0 },
      }

      const retweet = {
        id: '2',
        text: 'RT @someone: Their original tweet',
        created_at: new Date().toISOString(),
        referenced_tweets: [{ type: 'retweeted', id: '888' }],
        public_metrics: { like_count: 0, retweet_count: 1, reply_count: 0, quote_count: 0 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [originalTweet, retweet],
          meta: { result_count: 2 },
        }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
    })

    it('should include quote tweets', async () => {
      const quoteTweet = {
        id: '1',
        text: 'Great thread! https://t.co/xyz',
        created_at: new Date().toISOString(),
        referenced_tweets: [{ type: 'quoted', id: '777' }],
        public_metrics: { like_count: 20, retweet_count: 5, reply_count: 3, quote_count: 1 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [quoteTweet],
          meta: { result_count: 1 },
        }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
    })

    it('should filter tweets by lookback period', async () => {
      const now = new Date()
      const recentTweet = {
        id: '1',
        text: 'Recent tweet',
        created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        public_metrics: { like_count: 10, retweet_count: 0, reply_count: 0, quote_count: 0 },
      }

      const oldTweet = {
        id: '2',
        text: 'Old tweet',
        created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        public_metrics: { like_count: 5, retweet_count: 0, reply_count: 0, quote_count: 0 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [recentTweet, oldTweet],
          meta: { result_count: 2 },
        }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('1')
    })

    it('should include engagement metrics in metadata', async () => {
      const tweet = {
        id: '1',
        text: 'Popular tweet',
        created_at: new Date().toISOString(),
        public_metrics: {
          like_count: 100,
          retweet_count: 25,
          reply_count: 10,
          quote_count: 5,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [tweet], meta: { result_count: 1 } }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.activities[0].metadata).toEqual(
        expect.objectContaining({
          likeCount: 100,
          retweetCount: 25,
          replyCount: 10,
          quoteCount: 5,
          totalEngagement: 140,
        })
      )
    })

    it('should handle HTTP 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Unauthorized' }),
      })

      const result = await fetcher.fetchActivities('bad-token', 'user123', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('unauthorized')
    })

    it('should handle HTTP 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ detail: 'Too Many Requests' }),
        headers: new Headers({
          'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900),
        }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('rate limit')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetcher.fetchActivities('token', 'user123', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should respect maxResults limit', async () => {
      const tweets = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        text: `Tweet ${i}`,
        created_at: new Date().toISOString(),
        public_metrics: { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 },
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: tweets, meta: { result_count: 20 } }),
      })

      const result = await fetcher.fetchActivities('token', 'user123', {
        maxResults: 5,
        lookbackHours: 24,
      })

      expect(result.success).toBe(true)
      expect(result.activities.length).toBeLessThanOrEqual(5)
    })

    it('should include start_time parameter for lookback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { result_count: 0 } }),
      })

      await fetcher.fetchActivities('token', 'user123', {
        maxResults: 10,
        lookbackHours: 48,
      })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('start_time=')
    })
  })

  describe('mapToProcessedActivity', () => {
    it('should map raw tweet to processed activity', () => {
      const raw = {
        providerActivityId: '123456789',
        timestamp: new Date('2024-01-15T12:00:00Z'),
        title: 'Check out my new Supabase blog post!',
        url: 'https://twitter.com/user/status/123456789',
        metadata: {
          likeCount: 50,
          retweetCount: 10,
          replyCount: 5,
          quoteCount: 2,
          totalEngagement: 67, // Medium engagement: 1.25x multiplier
        },
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.provider).toBe('twitter')
      expect(processed.activityType).toBe('blog_post')
      // Base 100 * 1.25 (medium engagement) = 125
      expect(processed.suggestedPoints).toBe(125)
    })

    it('should detect video tutorial tweets', () => {
      const raw = {
        providerActivityId: '1',
        timestamp: new Date(),
        title: 'New video on YouTube: Building with Supabase',
        metadata: { totalEngagement: 100 }, // Medium engagement: 1.25x
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.activityType).toBe('video_tutorial')
      // Base 150 * 1.25 (medium engagement) = 188 (rounded)
      expect(processed.suggestedPoints).toBe(188)
    })

    it('should adjust points based on engagement', () => {
      const lowEngagement = {
        providerActivityId: '1',
        timestamp: new Date(),
        title: 'A tweet',
        metadata: { totalEngagement: 5 },
      }

      const highEngagement = {
        providerActivityId: '2',
        timestamp: new Date(),
        title: 'A viral tweet',
        metadata: { totalEngagement: 500 },
      }

      const lowResult = fetcher.mapToProcessedActivity(lowEngagement)
      const highResult = fetcher.mapToProcessedActivity(highEngagement)

      // High engagement should get more points
      expect(highResult.suggestedPoints).toBeGreaterThan(lowResult.suggestedPoints)
    })
  })
})

describe('mapTweetToActivity', () => {
  it('should construct tweet URL correctly', () => {
    const tweet = {
      id: '123',
      text: 'Hello world',
      created_at: new Date().toISOString(),
      author_id: 'user456',
      public_metrics: { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 },
    }

    const result = mapTweetToActivity(tweet, 'testuser')

    expect(result?.url).toBe('https://twitter.com/testuser/status/123')
  })

  it('should return null for retweets', () => {
    const retweet = {
      id: '1',
      text: 'RT @someone: Original tweet',
      created_at: new Date().toISOString(),
      referenced_tweets: [{ type: 'retweeted', id: '999' }],
      public_metrics: { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 },
    }

    const result = mapTweetToActivity(retweet, 'user')

    expect(result).toBeNull()
  })

  it('should return null for replies', () => {
    const reply = {
      id: '1',
      text: '@someone Here is my reply',
      created_at: new Date().toISOString(),
      referenced_tweets: [{ type: 'replied_to', id: '888' }],
      public_metrics: { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 },
    }

    const result = mapTweetToActivity(reply, 'user')

    expect(result).toBeNull()
  })

  it('should truncate long tweet text', () => {
    const longText = 'A'.repeat(300)
    const tweet = {
      id: '1',
      text: longText,
      created_at: new Date().toISOString(),
      public_metrics: { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 },
    }

    const result = mapTweetToActivity(tweet, 'user')

    expect(result).not.toBeNull()
    expect(result!.title.length).toBeLessThanOrEqual(283)
  })
})
