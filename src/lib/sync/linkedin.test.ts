import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LinkedInActivityFetcher, mapLinkedInPostToActivity } from './linkedin'
import type { FetcherConfig } from './types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('LinkedInActivityFetcher', () => {
  const fetcher = new LinkedInActivityFetcher()
  const defaultConfig: FetcherConfig = {
    maxResults: 50,
    lookbackHours: 24,
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('fetchActivities', () => {
    it('should fetch posts from LinkedIn API with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [] }),
      })

      await fetcher.fetchActivities('test-token', 'urn:li:person:ABC123', defaultConfig)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.linkedin.com/v2/ugcPosts'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'X-Restli-Protocol-Version': '2.0.0',
          }),
        })
      )
    })

    it('should include author filter in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [] }),
      })

      await fetcher.fetchActivities('token', 'urn:li:person:ABC123', defaultConfig)

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('q=authors')
      expect(url).toContain('authors=urn%3Ali%3Aperson%3AABC123')
    })

    it('should return empty activities when no posts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [] }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toEqual([])
    })

    it('should map text posts to activities', async () => {
      const post = {
        id: 'urn:li:share:123456789',
        author: 'urn:li:person:ABC',
        created: { time: Date.now() },
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: 'Excited to share my latest blog post about Supabase!',
            },
          },
        },
        lifecycleState: 'PUBLISHED',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [post] }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('urn:li:share:123456789')
    })

    it('should handle article posts', async () => {
      const articlePost = {
        id: 'urn:li:ugcPost:987654321',
        author: 'urn:li:person:ABC',
        created: { time: Date.now() },
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: 'New article published!',
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: 'https://example.com/my-article',
                title: { text: 'My Amazing Article' },
                description: { text: 'A deep dive into Supabase' },
              },
            ],
          },
        },
        lifecycleState: 'PUBLISHED',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [articlePost] }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('My Amazing Article')
      expect(result.activities[0].url).toBe('https://example.com/my-article')
    })

    it('should filter posts by lookback period', async () => {
      const now = Date.now()
      const recentPost = {
        id: 'urn:li:share:1',
        author: 'urn:li:person:ABC',
        created: { time: now - 1 * 60 * 60 * 1000 }, // 1 hour ago
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: 'Recent post' },
          },
        },
        lifecycleState: 'PUBLISHED',
      }

      const oldPost = {
        id: 'urn:li:share:2',
        author: 'urn:li:person:ABC',
        created: { time: now - 48 * 60 * 60 * 1000 }, // 48 hours ago
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: 'Old post' },
          },
        },
        lifecycleState: 'PUBLISHED',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [recentPost, oldPost] }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('urn:li:share:1')
    })

    it('should skip draft posts', async () => {
      const publishedPost = {
        id: 'urn:li:share:1',
        author: 'urn:li:person:ABC',
        created: { time: Date.now() },
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: 'Published post' },
          },
        },
        lifecycleState: 'PUBLISHED',
      }

      const draftPost = {
        id: 'urn:li:share:2',
        author: 'urn:li:person:ABC',
        created: { time: Date.now() },
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: 'Draft post' },
          },
        },
        lifecycleState: 'DRAFT',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [publishedPost, draftPost] }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
    })

    it('should handle HTTP 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })

      const result = await fetcher.fetchActivities('bad-token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('unauthorized')
    })

    it('should handle HTTP 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('rate limit')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should respect maxResults limit', async () => {
      const posts = Array.from({ length: 20 }, (_, i) => ({
        id: `urn:li:share:${i}`,
        author: 'urn:li:person:ABC',
        created: { time: Date.now() },
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: `Post ${i}` },
          },
        },
        lifecycleState: 'PUBLISHED',
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: posts }),
      })

      const result = await fetcher.fetchActivities('token', 'urn:li:person:ABC', {
        maxResults: 5,
        lookbackHours: 24,
      })

      expect(result.success).toBe(true)
      expect(result.activities.length).toBeLessThanOrEqual(5)
    })
  })

  describe('mapToProcessedActivity', () => {
    it('should map raw post to processed activity', () => {
      const raw = {
        providerActivityId: 'urn:li:share:123',
        timestamp: new Date('2024-01-15T12:00:00Z'),
        title: 'Check out my new article on building with Supabase!',
        url: 'https://www.linkedin.com/feed/update/urn:li:share:123',
        metadata: {
          hasArticle: false,
          hasMedia: false,
        },
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.provider).toBe('linkedin')
      expect(processed.activityType).toBe('blog_post')
      expect(processed.suggestedPoints).toBe(100)
    })

    it('should detect article posts with higher points', () => {
      const raw = {
        providerActivityId: 'urn:li:ugcPost:456',
        timestamp: new Date(),
        title: 'My Technical Article',
        metadata: {
          hasArticle: true,
          articleUrl: 'https://example.com/article',
        },
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.activityType).toBe('blog_post')
      // Articles get bonus points
      expect(processed.suggestedPoints).toBe(125)
    })

    it('should detect video posts', () => {
      const raw = {
        providerActivityId: 'urn:li:share:789',
        timestamp: new Date(),
        title: 'Check out my new video tutorial!',
        metadata: {
          hasMedia: true,
          mediaType: 'VIDEO',
        },
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.activityType).toBe('video_tutorial')
      expect(processed.suggestedPoints).toBe(150)
    })
  })
})

describe('mapLinkedInPostToActivity', () => {
  it('should extract text from share commentary', () => {
    const post = {
      id: 'urn:li:share:123',
      author: 'urn:li:person:ABC',
      created: { time: Date.now() },
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: 'Hello LinkedIn!' },
        },
      },
      lifecycleState: 'PUBLISHED',
    }

    const result = mapLinkedInPostToActivity(post)

    expect(result?.title).toBe('Hello LinkedIn!')
  })

  it('should use article title when available', () => {
    const post = {
      id: 'urn:li:ugcPost:456',
      author: 'urn:li:person:ABC',
      created: { time: Date.now() },
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: 'Check this out!' },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              title: { text: 'My Article Title' },
              originalUrl: 'https://example.com/article',
            },
          ],
        },
      },
      lifecycleState: 'PUBLISHED',
    }

    const result = mapLinkedInPostToActivity(post)

    expect(result?.title).toBe('My Article Title')
    expect(result?.url).toBe('https://example.com/article')
  })

  it('should return null for draft posts', () => {
    const post = {
      id: 'urn:li:share:123',
      author: 'urn:li:person:ABC',
      created: { time: Date.now() },
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: 'Draft' },
        },
      },
      lifecycleState: 'DRAFT',
    }

    const result = mapLinkedInPostToActivity(post)

    expect(result).toBeNull()
  })

  it('should truncate long text', () => {
    const longText = 'A'.repeat(300)
    const post = {
      id: 'urn:li:share:123',
      author: 'urn:li:person:ABC',
      created: { time: Date.now() },
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: longText },
        },
      },
      lifecycleState: 'PUBLISHED',
    }

    const result = mapLinkedInPostToActivity(post)

    expect(result).not.toBeNull()
    expect(result!.title.length).toBeLessThanOrEqual(203)
  })

  it('should construct post URL from URN', () => {
    const post = {
      id: 'urn:li:share:7891234567890123456',
      author: 'urn:li:person:ABC',
      created: { time: Date.now() },
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: 'Post' },
        },
      },
      lifecycleState: 'PUBLISHED',
    }

    const result = mapLinkedInPostToActivity(post)

    expect(result?.url).toBe(
      'https://www.linkedin.com/feed/update/urn:li:share:7891234567890123456'
    )
  })
})
