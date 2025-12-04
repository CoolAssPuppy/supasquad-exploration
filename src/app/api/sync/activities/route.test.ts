import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

// Create mock orchestrator instance
const mockSyncAllConnections = vi.fn()

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/sync', async () => {
  const actual = await vi.importActual('@/lib/sync')
  return {
    ...actual,
    SyncOrchestrator: class MockSyncOrchestrator {
      syncAllConnections = mockSyncAllConnections
    },
    GitHubActivityFetcher: class {},
    TwitterActivityFetcher: class {},
    LinkedInActivityFetcher: class {},
  }
})

vi.mock('@/lib/oauth/refresh', () => ({
  refreshIfNeeded: vi.fn(),
}))

vi.mock('@/lib/crypto/tokens', () => ({
  decryptTokenSafe: vi.fn((token: string) => token),
  encryptTokenSafe: vi.fn((token: string) => `encrypted_${token}`),
}))

const mockSupabaseClient = {
  from: vi.fn(),
}

describe('Activity Sync API', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      SYNC_API_KEY: 'test-api-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      TOKEN_ENCRYPTION_KEY: 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('POST /api/sync/activities', () => {
    it('should return 401 without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'POST',
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 with invalid API key', async () => {
      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid-key',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return success when no connections exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('No connections to sync')
    })

    it('should sync connections and return summary', async () => {
      // Mock database queries
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'conn-1',
                      user_id: 'user-1',
                      provider: 'github',
                      provider_user_id: 'testuser',
                      provider_username: 'testuser',
                      access_token: 'encrypted_token',
                      refresh_token: null,
                      token_expires_at: null,
                    },
                  ],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'pending_activities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      mockSyncAllConnections.mockResolvedValue([
        {
          connectionId: 'conn-1',
          userId: 'user-1',
          provider: 'github',
          success: true,
          activities: [
            {
              provider: 'github',
              providerActivityId: 'commit-123',
              activityType: 'oss_contribution',
              title: 'Test commit',
              description: null,
              url: 'https://github.com/user/repo/commit/123',
              suggestedPoints: 50,
              eventDate: new Date(),
            },
          ],
        },
      ])

      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.summary.total).toBe(1)
      expect(data.summary.successful).toBe(1)
      expect(data.summary.activitiesFound).toBe(1)
    })

    it('should handle sync errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'conn-1',
                  user_id: 'user-1',
                  provider: 'github',
                  provider_user_id: 'testuser',
                  provider_username: 'testuser',
                  access_token: 'encrypted_token',
                  refresh_token: null,
                  token_expires_at: null,
                },
              ],
              error: null,
            }),
          }),
        }),
      })

      mockSyncAllConnections.mockResolvedValue([
        {
          connectionId: 'conn-1',
          userId: 'user-1',
          provider: 'github',
          success: false,
          activities: [],
          error: 'API rate limit exceeded',
        },
      ])

      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.summary.failed).toBe(1)
    })

    it('should update tokens when refreshed', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'conn-1',
                      user_id: 'user-1',
                      provider: 'twitter',
                      provider_user_id: '12345',
                      provider_username: 'testuser',
                      access_token: 'encrypted_token',
                      refresh_token: 'encrypted_refresh',
                      token_expires_at: new Date().toISOString(),
                    },
                  ],
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          }
        }
        if (table === 'pending_activities') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      mockSyncAllConnections.mockResolvedValue([
        {
          connectionId: 'conn-1',
          userId: 'user-1',
          provider: 'twitter',
          success: true,
          activities: [],
          tokenRefreshed: true,
          newTokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: new Date(Date.now() + 7200000),
          },
        },
      ])

      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary.tokensRefreshed).toBe(1)
      expect(updateMock).toHaveBeenCalled()
    })
  })

  describe('GET /api/sync/activities', () => {
    it('should return 401 without authorization', async () => {
      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'GET',
      })

      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return health status with connection counts', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: [
                { provider: 'github' },
                { provider: 'github' },
                { provider: 'twitter' },
              ],
              error: null,
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost/api/sync/activities', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-api-key',
        },
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('healthy')
      expect(data.providers.github).toBe(2)
      expect(data.providers.twitter).toBe(1)
      expect(data.totalConnections).toBe(3)
    })
  })
})
