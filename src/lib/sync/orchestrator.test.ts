import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncOrchestrator, type SyncConnection } from './orchestrator'
import type { ProcessedActivity } from './types'

// Mock the fetchers
const mockGitHubFetcher = {
  fetchActivities: vi.fn(),
  mapToProcessedActivity: vi.fn(),
}

const mockTwitterFetcher = {
  fetchActivities: vi.fn(),
  mapToProcessedActivity: vi.fn(),
}

const mockLinkedInFetcher = {
  fetchActivities: vi.fn(),
  mapToProcessedActivity: vi.fn(),
}

// Mock token refresh
const mockRefreshIfNeeded = vi.fn()

// Mock token decryption
const mockDecryptToken = vi.fn()

describe('SyncOrchestrator', () => {
  let orchestrator: SyncOrchestrator

  beforeEach(() => {
    vi.clearAllMocks()

    orchestrator = new SyncOrchestrator({
      fetchers: {
        github: mockGitHubFetcher,
        twitter: mockTwitterFetcher,
        linkedin: mockLinkedInFetcher,
      },
      refreshTokenFn: mockRefreshIfNeeded,
      decryptTokenFn: mockDecryptToken,
    })

    // Default mock implementations
    mockDecryptToken.mockImplementation((token: string) => token.replace('encrypted_', ''))
    mockRefreshIfNeeded.mockResolvedValue({
      success: true,
      tokens: {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
      },
    })
  })

  describe('syncConnection', () => {
    const baseConnection: SyncConnection = {
      id: 'conn-1',
      userId: 'user-1',
      provider: 'github',
      providerUserId: 'testuser',
      providerUsername: 'testuser',
      accessToken: 'encrypted_access-token',
      refreshToken: 'encrypted_refresh-token',
      tokenExpiresAt: new Date(Date.now() + 3600000),
    }

    it('should decrypt tokens before use', async () => {
      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      await orchestrator.syncConnection(baseConnection)

      expect(mockDecryptToken).toHaveBeenCalledWith('encrypted_access-token')
    })

    it('should check if token refresh is needed', async () => {
      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      await orchestrator.syncConnection(baseConnection)

      expect(mockRefreshIfNeeded).toHaveBeenCalledWith(
        'github',
        expect.objectContaining({
          accessToken: 'access-token',
        })
      )
    })

    it('should use refreshed token for fetching', async () => {
      mockRefreshIfNeeded.mockResolvedValue({
        success: true,
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: new Date(Date.now() + 7200000),
        },
      })

      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      await orchestrator.syncConnection(baseConnection)

      expect(mockGitHubFetcher.fetchActivities).toHaveBeenCalledWith(
        'new-access-token',
        'testuser',
        expect.any(Object)
      )
    })

    it('should return token refresh info when tokens are updated', async () => {
      const newExpiry = new Date(Date.now() + 7200000)
      mockRefreshIfNeeded.mockResolvedValue({
        success: true,
        tokens: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresAt: newExpiry,
        },
      })

      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      const result = await orchestrator.syncConnection(baseConnection)

      expect(result.tokenRefreshed).toBe(true)
      expect(result.newTokens?.accessToken).toBe('new-token')
    })

    it('should return error when token refresh fails', async () => {
      mockRefreshIfNeeded.mockResolvedValue({
        success: false,
        error: 'Refresh token expired',
      })

      const result = await orchestrator.syncConnection(baseConnection)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Refresh token expired')
      expect(mockGitHubFetcher.fetchActivities).not.toHaveBeenCalled()
    })

    it('should fetch and process activities from GitHub', async () => {
      const rawActivity = {
        providerActivityId: 'commit-123',
        timestamp: new Date(),
        title: 'Test commit',
        metadata: { eventType: 'PushEvent' },
      }

      const processedActivity: ProcessedActivity = {
        provider: 'github',
        providerActivityId: 'commit-123',
        activityType: 'oss_contribution',
        title: 'Test commit',
        description: null,
        url: 'https://github.com/user/repo/commit/123',
        suggestedPoints: 50,
        eventDate: new Date(),
      }

      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [rawActivity],
      })

      mockGitHubFetcher.mapToProcessedActivity.mockReturnValue(processedActivity)

      const result = await orchestrator.syncConnection(baseConnection)

      expect(result.success).toBe(true)
      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].providerActivityId).toBe('commit-123')
    })

    it('should handle Twitter connections', async () => {
      const twitterConnection: SyncConnection = {
        ...baseConnection,
        provider: 'twitter',
        providerUserId: '12345',
      }

      mockTwitterFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      const result = await orchestrator.syncConnection(twitterConnection)

      expect(result.success).toBe(true)
      expect(mockTwitterFetcher.fetchActivities).toHaveBeenCalled()
    })

    it('should handle LinkedIn connections', async () => {
      const linkedInConnection: SyncConnection = {
        ...baseConnection,
        provider: 'linkedin',
        providerUserId: 'urn:li:person:ABC',
      }

      mockLinkedInFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      const result = await orchestrator.syncConnection(linkedInConnection)

      expect(result.success).toBe(true)
      expect(mockLinkedInFetcher.fetchActivities).toHaveBeenCalled()
    })

    it('should return error for unsupported provider', async () => {
      const unsupportedConnection: SyncConnection = {
        ...baseConnection,
        provider: 'discord' as 'github', // Cast to bypass type check
      }

      const result = await orchestrator.syncConnection(unsupportedConnection)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not supported')
    })

    it('should handle fetch errors gracefully', async () => {
      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: false,
        activities: [],
        error: 'API rate limit exceeded',
      })

      const result = await orchestrator.syncConnection(baseConnection)

      expect(result.success).toBe(false)
      expect(result.error).toContain('rate limit')
    })

    it('should handle null access token', async () => {
      const noTokenConnection: SyncConnection = {
        ...baseConnection,
        accessToken: null,
      }

      const result = await orchestrator.syncConnection(noTokenConnection)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No access token')
    })
  })

  describe('syncAllConnections', () => {
    it('should sync multiple connections and aggregate results', async () => {
      const connections: SyncConnection[] = [
        {
          id: 'conn-1',
          userId: 'user-1',
          provider: 'github',
          providerUserId: 'user1',
          providerUsername: 'user1',
          accessToken: 'encrypted_token1',
          refreshToken: null,
          tokenExpiresAt: null,
        },
        {
          id: 'conn-2',
          userId: 'user-1',
          provider: 'twitter',
          providerUserId: '12345',
          providerUsername: 'user1',
          accessToken: 'encrypted_token2',
          refreshToken: 'encrypted_refresh2',
          tokenExpiresAt: new Date(Date.now() + 3600000),
        },
      ]

      mockGitHubFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [{ providerActivityId: 'gh-1', timestamp: new Date(), title: 'Commit', metadata: {} }],
      })
      mockGitHubFetcher.mapToProcessedActivity.mockReturnValue({
        provider: 'github',
        providerActivityId: 'gh-1',
        activityType: 'oss_contribution',
        title: 'Commit',
        description: null,
        url: null,
        suggestedPoints: 50,
        eventDate: new Date(),
      })

      mockTwitterFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [{ providerActivityId: 'tw-1', timestamp: new Date(), title: 'Tweet', metadata: {} }],
      })
      mockTwitterFetcher.mapToProcessedActivity.mockReturnValue({
        provider: 'twitter',
        providerActivityId: 'tw-1',
        activityType: 'blog_post',
        title: 'Tweet',
        description: null,
        url: null,
        suggestedPoints: 100,
        eventDate: new Date(),
      })

      const results = await orchestrator.syncAllConnections(connections)

      expect(results).toHaveLength(2)
      expect(results[0].connectionId).toBe('conn-1')
      expect(results[1].connectionId).toBe('conn-2')
    })

    it('should continue syncing even if one connection fails', async () => {
      const connections: SyncConnection[] = [
        {
          id: 'conn-1',
          userId: 'user-1',
          provider: 'github',
          providerUserId: 'user1',
          providerUsername: 'user1',
          accessToken: 'encrypted_token1',
          refreshToken: null,
          tokenExpiresAt: null,
        },
        {
          id: 'conn-2',
          userId: 'user-1',
          provider: 'twitter',
          providerUserId: '12345',
          providerUsername: 'user1',
          accessToken: 'encrypted_token2',
          refreshToken: 'encrypted_refresh2',
          tokenExpiresAt: new Date(Date.now() + 3600000),
        },
      ]

      mockGitHubFetcher.fetchActivities.mockRejectedValue(new Error('Network error'))

      mockTwitterFetcher.fetchActivities.mockResolvedValue({
        success: true,
        activities: [],
      })

      const results = await orchestrator.syncAllConnections(connections)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(false)
      expect(results[1].success).toBe(true)
    })

    it('should return empty array for empty connections', async () => {
      const results = await orchestrator.syncAllConnections([])

      expect(results).toEqual([])
    })
  })
})
