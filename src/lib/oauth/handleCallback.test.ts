import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleOAuthCallback } from './handleCallback'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock the state module
const mockGetAndClearPkceVerifierCookie = vi.fn()
vi.mock('@/lib/oauth/state', () => ({
  parseOAuthState: vi.fn(),
  validateCsrf: vi.fn(),
  getAndClearPkceVerifierCookie: () => mockGetAndClearPkceVerifierCookie(),
}))

// Mock the crypto module
vi.mock('@/lib/crypto/tokens', () => ({
  encryptTokenSafe: vi.fn((token: string) => `encrypted:${token}`),
}))

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

import { parseOAuthState, validateCsrf } from '@/lib/oauth/state'

const mockedParseOAuthState = vi.mocked(parseOAuthState)
const mockedValidateCsrf = vi.mocked(validateCsrf)

function createValidStatePayload(overrides = {}) {
  return {
    userId: 'user-123',
    redirectUrl: '/profile',
    provider: 'discord' as const,
    createdAt: Date.now(),
    csrf: 'csrf-token',
    ...overrides,
  }
}

function createTokenResponse(overrides = {}) {
  return {
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-456',
    expires_in: 3600,
    token_type: 'Bearer',
    ...overrides,
  }
}

function createUserInfo(provider: string) {
  switch (provider) {
    case 'discord':
      return { id: 'discord-user-id', username: 'discorduser', email: 'user@example.com' }
    case 'github':
      return { id: 123456, login: 'githubuser', email: 'user@example.com' }
    case 'linkedin':
      return { sub: 'linkedin-user-id', name: 'LinkedIn User', email: 'user@example.com' }
    case 'twitter':
      return { data: { id: 'twitter-user-id', username: 'twitteruser' } }
    default:
      return { id: 'user-id', username: 'user' }
  }
}

describe('OAuth callback handler', () => {
  const origin = 'http://localhost:3000'

  beforeEach(() => {
    vi.stubEnv('DISCORD_CLIENT_ID', 'discord-client-id')
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'discord-client-secret')
    vi.stubEnv('GITHUB_CLIENT_ID', 'github-client-id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'github-client-secret')
    vi.stubEnv('LINKEDIN_CLIENT_ID', 'linkedin-client-id')
    vi.stubEnv('LINKEDIN_CLIENT_SECRET', 'linkedin-client-secret')
    vi.stubEnv('TWITTER_CLIENT_ID', 'twitter-client-id')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'twitter-client-secret')

    mockFetch.mockReset()
    mockSupabaseClient.from.mockReset()
    mockGetAndClearPkceVerifierCookie.mockReset()
    // Default to null for non-PKCE flows
    mockGetAndClearPkceVerifierCookie.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('when state validation fails', () => {
    it('should return error when state is invalid', async () => {
      mockedParseOAuthState.mockReturnValue(null)

      const result = await handleOAuthCallback('discord', 'code-123', 'invalid-state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('invalid_state')
      expect(result.redirectUrl).toContain('oauth=error')
    })

    it('should return error when provider in state does not match', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload({ provider: 'github' }))

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('provider_mismatch')
    })

    it('should return error when CSRF validation fails', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(false)

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('csrf_mismatch')
    })
  })

  describe('when token exchange fails', () => {
    it('should return error when OAuth provider returns error', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('invalid_grant'),
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('token_exchange_failed')
    })

    it('should return error when fetch throws', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })

  describe('when user info fetch fails', () => {
    it('should return error when user info endpoint fails', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Invalid token'),
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('user_info_failed')
    })
  })

  describe('when OAuth flow succeeds for Discord', () => {
    it('should insert new connection when none exists', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('discord')),
      })

      // No existing connection
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, insert: mockInsert }
        }
        return {}
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(true)
      expect(result.redirectUrl).toContain('oauth=success')
      expect(result.redirectUrl).toContain('provider=discord')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should update existing connection', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('discord')),
      })

      // Existing connection found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null }),
          }),
        }),
      })
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, update: mockUpdate }
        }
        return {}
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('when database operation fails', () => {
    it('should return error when insert fails', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('discord')),
      })

      // No existing connection
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Database error' },
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, insert: mockInsert }
        }
        return {}
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('database_error')
    })

    it('should return error when update fails', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('discord')),
      })

      // Existing connection found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null }),
          }),
        }),
      })
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, update: mockUpdate }
        }
        return {}
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('database_error')
    })
  })

  describe('when handling different providers', () => {
    it('should use Basic auth for Twitter token exchange', async () => {
      mockedParseOAuthState.mockReturnValue(
        createValidStatePayload({
          provider: 'twitter',
        })
      )
      mockedValidateCsrf.mockResolvedValue(true)
      // PKCE verifier comes from cookie now, not state
      mockGetAndClearPkceVerifierCookie.mockResolvedValue('pkce-verifier-123')

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('twitter')),
      })

      // No existing connection
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, insert: mockInsert }
        }
        return {}
      })

      await handleOAuthCallback('twitter', 'code-123', 'state', origin)

      // Verify token exchange used Basic auth
      const tokenCall = mockFetch.mock.calls[0]
      expect(tokenCall[0]).toBe('https://api.twitter.com/2/oauth2/token')
      expect(tokenCall[1].headers.Authorization).toMatch(/^Basic /)

      // Verify code_verifier was included (from cookie)
      expect(tokenCall[1].body).toContain('code_verifier=pkce-verifier-123')
    })

    it('should use client_id/secret in body for GitHub', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload({ provider: 'github' }))
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('github')),
      })

      // No existing connection
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, insert: mockInsert }
        }
        return {}
      })

      await handleOAuthCallback('github', 'code-123', 'state', origin)

      // Verify token exchange used correct URL and headers
      const tokenCall = mockFetch.mock.calls[0]
      expect(tokenCall[0]).toBe('https://github.com/login/oauth/access_token')
      expect(tokenCall[1].headers.Accept).toBe('application/json')
      expect(tokenCall[1].body).toContain('client_id=github-client-id')
      expect(tokenCall[1].body).toContain('client_secret=github-client-secret')
    })
  })

  describe('when handling tokens without expiration', () => {
    it('should handle tokens without expires_in', async () => {
      mockedParseOAuthState.mockReturnValue(createValidStatePayload())
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds without expires_in
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'access-token',
            token_type: 'Bearer',
          }),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('discord')),
      })

      // No existing connection
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, insert: mockInsert }
        }
        return {}
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.success).toBe(true)
    })
  })

  describe('redirect URL handling', () => {
    it('should use redirectUrl from state on success', async () => {
      mockedParseOAuthState.mockReturnValue(
        createValidStatePayload({ redirectUrl: '/dashboard' })
      )
      mockedValidateCsrf.mockResolvedValue(true)

      // Token exchange succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createTokenResponse()),
      })
      // User info succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createUserInfo('discord')),
      })

      // No existing connection
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'social_connections') {
          return { select: mockSelect, insert: mockInsert }
        }
        return {}
      })

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.redirectUrl).toContain('/dashboard')
    })

    it('should use redirectUrl from state on error', async () => {
      mockedParseOAuthState.mockReturnValue(
        createValidStatePayload({ redirectUrl: '/custom-page' })
      )
      mockedValidateCsrf.mockResolvedValue(false)

      const result = await handleOAuthCallback('discord', 'code-123', 'state', origin)

      expect(result.redirectUrl).toContain('/custom-page')
    })
  })
})
