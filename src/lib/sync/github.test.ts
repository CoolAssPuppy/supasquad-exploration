import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubActivityFetcher, mapGitHubEventToActivity } from './github'
import type { FetcherConfig } from './types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('GitHubActivityFetcher', () => {
  const fetcher = new GitHubActivityFetcher()
  const defaultConfig: FetcherConfig = {
    maxResults: 50,
    lookbackHours: 24,
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('fetchActivities', () => {
    it('should fetch events from GitHub API with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Headers(),
      })

      await fetcher.fetchActivities('test-token', 'testuser', defaultConfig)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/users/testuser/events?per_page=50',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            Accept: 'application/vnd.github+json',
            'User-Agent': 'SupaSquad',
            'X-GitHub-Api-Version': '2022-11-28',
          }),
        })
      )
    })

    it('should return empty activities for empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toEqual([])
    })

    it('should filter events by lookback period', async () => {
      const now = new Date()
      const recentEvent = {
        id: '1',
        type: 'PushEvent',
        created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        repo: { name: 'user/repo' },
        payload: { commits: [{ sha: 'abc123', message: 'Test commit' }] },
      }
      const oldEvent = {
        id: '2',
        type: 'PushEvent',
        created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
        repo: { name: 'user/repo' },
        payload: { commits: [{ sha: 'def456', message: 'Old commit' }] },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([recentEvent, oldEvent]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('1-abc123')
    })

    it('should handle PushEvent with multiple commits', async () => {
      const pushEvent = {
        id: '123',
        type: 'PushEvent',
        created_at: new Date().toISOString(),
        repo: { name: 'user/awesome-repo' },
        payload: {
          ref: 'refs/heads/main',
          commits: [
            { sha: 'abc123', message: 'First commit' },
            { sha: 'def456', message: 'Second commit' },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([pushEvent]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(2)
      expect(result.activities[0].title).toBe('First commit')
      expect(result.activities[1].title).toBe('Second commit')
    })

    it('should handle PullRequestEvent', async () => {
      const prEvent = {
        id: '456',
        type: 'PullRequestEvent',
        created_at: new Date().toISOString(),
        repo: { name: 'org/project' },
        payload: {
          action: 'opened',
          pull_request: {
            number: 42,
            title: 'Add new feature',
            body: 'This PR adds a cool feature',
            html_url: 'https://github.com/org/project/pull/42',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([prEvent]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('PR #42: Add new feature')
      expect(result.activities[0].url).toBe('https://github.com/org/project/pull/42')
    })

    it('should handle IssuesEvent', async () => {
      const issueEvent = {
        id: '789',
        type: 'IssuesEvent',
        created_at: new Date().toISOString(),
        repo: { name: 'org/project' },
        payload: {
          action: 'opened',
          issue: {
            number: 100,
            title: 'Bug report',
            body: 'Found a bug',
            html_url: 'https://github.com/org/project/issues/100',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([issueEvent]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('Issue #100: Bug report')
    })

    it('should handle IssueCommentEvent', async () => {
      const commentEvent = {
        id: '101',
        type: 'IssueCommentEvent',
        created_at: new Date().toISOString(),
        repo: { name: 'org/project' },
        payload: {
          action: 'created',
          issue: {
            number: 50,
            title: 'Help needed',
          },
          comment: {
            body: 'Here is the solution...',
            html_url: 'https://github.com/org/project/issues/50#issuecomment-123',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([commentEvent]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].title).toBe('Comment on #50: Help needed')
    })

    it('should skip unsupported event types', async () => {
      const watchEvent = {
        id: '999',
        type: 'WatchEvent',
        created_at: new Date().toISOString(),
        repo: { name: 'user/repo' },
        payload: { action: 'started' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([watchEvent]),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(true)
      expect(result.activities).toEqual([])
    })

    it('should handle HTTP 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Bad credentials'),
      })

      const result = await fetcher.fetchActivities('bad-token', 'user', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('unauthorized')
    })

    it('should handle HTTP 403 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('API rate limit exceeded'),
        headers: new Headers({
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
        }),
      })

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('rate limit')
    })

    it('should handle HTTP 404 user not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found'),
      })

      const result = await fetcher.fetchActivities('token', 'nonexistent', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetcher.fetchActivities('token', 'user', defaultConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should limit results to maxResults', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        type: 'PushEvent',
        created_at: new Date().toISOString(),
        repo: { name: 'user/repo' },
        payload: { commits: [{ sha: `sha${i}`, message: `Commit ${i}` }] },
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(events),
        headers: new Headers(),
      })

      const result = await fetcher.fetchActivities('token', 'user', {
        maxResults: 10,
        lookbackHours: 24,
      })

      expect(result.success).toBe(true)
      expect(result.activities.length).toBeLessThanOrEqual(10)
    })
  })

  describe('mapToProcessedActivity', () => {
    it('should map raw activity to processed activity', () => {
      const raw = {
        providerActivityId: '123-abc',
        timestamp: new Date('2024-01-15T12:00:00Z'),
        title: 'Test commit message',
        description: 'Commit to user/repo on main',
        url: 'https://github.com/user/repo/commit/abc',
        metadata: {
          eventType: 'PushEvent',
          repo: 'user/repo',
          branch: 'main',
        },
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.provider).toBe('github')
      expect(processed.providerActivityId).toBe('123-abc')
      expect(processed.activityType).toBe('oss_contribution')
      expect(processed.title).toBe('Test commit message')
      expect(processed.suggestedPoints).toBe(50)
    })

    it('should map issue comment to community_answers type', () => {
      const raw = {
        providerActivityId: '456',
        timestamp: new Date(),
        title: 'Comment on issue',
        metadata: { eventType: 'IssueCommentEvent' },
      }

      const processed = fetcher.mapToProcessedActivity(raw)

      expect(processed.activityType).toBe('community_answers')
      expect(processed.suggestedPoints).toBe(25)
    })
  })
})

describe('mapGitHubEventToActivity', () => {
  it('should return null for unsupported event types', () => {
    const event = {
      id: '1',
      type: 'ForkEvent',
      created_at: new Date().toISOString(),
      repo: { name: 'user/repo' },
      payload: {},
    }

    const result = mapGitHubEventToActivity(event)

    expect(result).toBeNull()
  })

  it('should return null for closed PR events', () => {
    const event = {
      id: '1',
      type: 'PullRequestEvent',
      created_at: new Date().toISOString(),
      repo: { name: 'user/repo' },
      payload: {
        action: 'closed',
        pull_request: { number: 1, title: 'Test' },
      },
    }

    const result = mapGitHubEventToActivity(event)

    expect(result).toBeNull()
  })

  it('should handle PushEvent with no commits', () => {
    const event = {
      id: '1',
      type: 'PushEvent',
      created_at: new Date().toISOString(),
      repo: { name: 'user/repo' },
      payload: { commits: [] },
    }

    const result = mapGitHubEventToActivity(event)

    expect(result).toEqual([])
  })

  it('should truncate long commit messages', () => {
    const longMessage = 'A'.repeat(200)
    const event = {
      id: '1',
      type: 'PushEvent',
      created_at: new Date().toISOString(),
      repo: { name: 'user/repo' },
      payload: {
        ref: 'refs/heads/main',
        commits: [{ sha: 'abc', message: longMessage }],
      },
    }

    const result = mapGitHubEventToActivity(event)

    expect(result).not.toBeNull()
    expect(Array.isArray(result) && result[0].title.length).toBeLessThanOrEqual(103)
  })

  it('should extract branch name from ref', () => {
    const event = {
      id: '1',
      type: 'PushEvent',
      created_at: new Date().toISOString(),
      repo: { name: 'user/repo' },
      payload: {
        ref: 'refs/heads/feature/new-feature',
        commits: [{ sha: 'abc', message: 'Test' }],
      },
    }

    const result = mapGitHubEventToActivity(event)

    expect(result).not.toBeNull()
    expect(Array.isArray(result) && result[0].metadata.branch).toBe('feature/new-feature')
  })
})
