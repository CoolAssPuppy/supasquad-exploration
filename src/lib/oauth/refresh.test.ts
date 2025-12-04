import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isTokenExpired,
  supportsRefresh,
  refreshToken,
  refreshIfNeeded,
  type TokenPair,
} from './refresh'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('Token refresh utilities', () => {
  beforeEach(() => {
    vi.stubEnv('TWITTER_CLIENT_ID', 'twitter-client-id')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'twitter-client-secret')
    vi.stubEnv('LINKEDIN_CLIENT_ID', 'linkedin-client-id')
    vi.stubEnv('LINKEDIN_CLIENT_SECRET', 'linkedin-client-secret')
    vi.stubEnv('DISCORD_CLIENT_ID', 'discord-client-id')
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'discord-client-secret')
    vi.stubEnv('GITHUB_CLIENT_ID', 'github-client-id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'github-client-secret')
    mockFetch.mockReset()
  })

  describe('isTokenExpired', () => {
    it('should return false when expiresAt is null', () => {
      expect(isTokenExpired(null)).toBe(false)
    })

    it('should return false when token is not expired', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      expect(isTokenExpired(futureDate)).toBe(false)
    })

    it('should return true when token is expired', () => {
      const pastDate = new Date(Date.now() - 60 * 1000) // 1 minute ago
      expect(isTokenExpired(pastDate)).toBe(true)
    })

    it('should return true when token expires within buffer period', () => {
      const almostExpired = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes from now
      expect(isTokenExpired(almostExpired, 5)).toBe(true) // 5 minute buffer
    })

    it('should handle string dates', () => {
      const futureIso = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      expect(isTokenExpired(futureIso)).toBe(false)

      const pastIso = new Date(Date.now() - 60 * 1000).toISOString()
      expect(isTokenExpired(pastIso)).toBe(true)
    })

    it('should use custom buffer period', () => {
      const soonExpiring = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      expect(isTokenExpired(soonExpiring, 5)).toBe(false) // 5 minute buffer - not expired
      expect(isTokenExpired(soonExpiring, 15)).toBe(true) // 15 minute buffer - expired
    })
  })

  describe('supportsRefresh', () => {
    it('should return false for GitHub', () => {
      expect(supportsRefresh('github')).toBe(false)
    })

    it('should return true for Twitter', () => {
      expect(supportsRefresh('twitter')).toBe(true)
    })

    it('should return true for LinkedIn', () => {
      expect(supportsRefresh('linkedin')).toBe(true)
    })

    it('should return true for Discord', () => {
      expect(supportsRefresh('discord')).toBe(true)
    })
  })

  describe('refreshToken', () => {
    describe('when provider does not support refresh', () => {
      it('should return error for GitHub', async () => {
        const result = await refreshToken('github', 'refresh-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('does not support token refresh')
      })
    })

    describe('when credentials are missing', () => {
      it('should return error when client ID is missing', async () => {
        vi.stubEnv('TWITTER_CLIENT_ID', '')

        const result = await refreshToken('twitter', 'refresh-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Missing OAuth credentials')
      })

      it('should return error when client secret is missing', async () => {
        vi.stubEnv('LINKEDIN_CLIENT_SECRET', '')

        const result = await refreshToken('linkedin', 'refresh-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Missing OAuth credentials')
      })
    })

    describe('when refresh succeeds for Twitter', () => {
      it('should return new tokens', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              expires_in: 7200,
              token_type: 'Bearer',
            }),
        })

        const result = await refreshToken('twitter', 'old-refresh-token')

        expect(result.success).toBe(true)
        expect(result.tokens?.accessToken).toBe('new-access-token')
        expect(result.tokens?.refreshToken).toBe('new-refresh-token')
        expect(result.tokens?.expiresAt).toBeInstanceOf(Date)
      })

      it('should send correct request format', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'new-token',
              expires_in: 7200,
            }),
        })

        await refreshToken('twitter', 'the-refresh-token')

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.twitter.com/2/oauth2/token',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: expect.stringMatching(/^Basic /),
            }),
          })
        )

        const callBody = mockFetch.mock.calls[0][1].body
        expect(callBody).toContain('grant_type=refresh_token')
        expect(callBody).toContain('refresh_token=the-refresh-token')
        expect(callBody).toContain('client_id=twitter-client-id')
      })
    })

    describe('when refresh succeeds for LinkedIn', () => {
      it('should return new tokens', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'linkedin-new-token',
              refresh_token: 'linkedin-new-refresh',
              expires_in: 5184000, // 60 days
            }),
        })

        const result = await refreshToken('linkedin', 'linkedin-refresh-token')

        expect(result.success).toBe(true)
        expect(result.tokens?.accessToken).toBe('linkedin-new-token')
      })

      it('should send correct request format', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token' }),
        })

        await refreshToken('linkedin', 'refresh-token')

        const callBody = mockFetch.mock.calls[0][1].body
        expect(callBody).toContain('client_id=linkedin-client-id')
        expect(callBody).toContain('client_secret=linkedin-client-secret')
      })
    })

    describe('when refresh fails', () => {
      it('should return error on HTTP 400', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve('invalid_grant'),
        })

        const result = await refreshToken('twitter', 'invalid-refresh-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('invalid or expired')
      })

      it('should return error on HTTP 401', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve('unauthorized'),
        })

        const result = await refreshToken('linkedin', 'bad-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('invalid or expired')
      })

      it('should return error on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const result = await refreshToken('discord', 'refresh-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('Network error')
      })

      it('should return error when response has no access token', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

        const result = await refreshToken('twitter', 'refresh-token')

        expect(result.success).toBe(false)
        expect(result.error).toContain('No access token')
      })
    })
  })

  describe('refreshIfNeeded', () => {
    const validTokens: TokenPair = {
      accessToken: 'valid-access-token',
      refreshToken: 'valid-refresh-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    }

    const expiredTokens: TokenPair = {
      accessToken: 'expired-access-token',
      refreshToken: 'valid-refresh-token',
      expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute ago
    }

    it('should return original tokens if not expired', async () => {
      const result = await refreshIfNeeded('twitter', validTokens)

      expect(result.success).toBe(true)
      expect(result.tokens).toEqual(validTokens)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return original tokens for GitHub even if "expired"', async () => {
      const githubTokens: TokenPair = {
        accessToken: 'github-token',
        refreshToken: null,
        expiresAt: null,
      }

      const result = await refreshIfNeeded('github', githubTokens)

      expect(result.success).toBe(true)
      expect(result.tokens).toEqual(githubTokens)
    })

    it('should attempt refresh when token is expired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            expires_in: 7200,
          }),
      })

      const result = await refreshIfNeeded('twitter', expiredTokens)

      expect(result.success).toBe(true)
      expect(result.tokens?.accessToken).toBe('new-token')
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should return error when expired and no refresh token', async () => {
      const noRefreshTokens: TokenPair = {
        accessToken: 'token',
        refreshToken: null,
        expiresAt: new Date(Date.now() - 60 * 1000),
      }

      const result = await refreshIfNeeded('twitter', noRefreshTokens)

      expect(result.success).toBe(false)
      expect(result.error).toContain('no refresh token available')
    })

    it('should propagate refresh errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('invalid_grant'),
      })

      const result = await refreshIfNeeded('linkedin', expiredTokens)

      expect(result.success).toBe(false)
      expect(result.error).toContain('invalid or expired')
    })
  })
})
