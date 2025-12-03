import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { revokeToken, revokeAllTokens } from './revoke'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('OAuth token revocation', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_CLIENT_ID', 'discord-client-id')
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'discord-client-secret')
    vi.stubEnv('LINKEDIN_CLIENT_ID', 'linkedin-client-id')
    vi.stubEnv('LINKEDIN_CLIENT_SECRET', 'linkedin-client-secret')
    vi.stubEnv('GITHUB_CLIENT_ID', 'github-client-id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'github-client-secret')
    vi.stubEnv('TWITTER_CLIENT_ID', 'twitter-client-id')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'twitter-client-secret')

    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('when revoking Discord tokens', () => {
    it('should call Discord revocation endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

      await revokeToken('discord', 'access-token-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/oauth2/token/revoke',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      )

      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('token=access-token-123')
      expect(body).toContain('client_id=discord-client-id')
      expect(body).toContain('client_secret=discord-client-secret')
    })

    it('should return success when Discord returns 200', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

      const result = await revokeToken('discord', 'token')

      expect(result.success).toBe(true)
    })
  })

  describe('when revoking LinkedIn tokens', () => {
    it('should call LinkedIn revocation endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

      await revokeToken('linkedin', 'linkedin-access-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/revoke',
        expect.objectContaining({
          method: 'POST',
        })
      )

      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('token=linkedin-access-token')
    })
  })

  describe('when revoking GitHub tokens', () => {
    it('should call GitHub revocation endpoint with DELETE method', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

      await revokeToken('github', 'github-access-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/applications/github-client-id/grant',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
          }),
        })
      )
    })

    it('should use Basic auth header for GitHub', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

      await revokeToken('github', 'token')

      const headers = mockFetch.mock.calls[0][1].headers
      const expectedAuth = Buffer.from('github-client-id:github-client-secret').toString(
        'base64'
      )
      expect(headers.Authorization).toBe(`Basic ${expectedAuth}`)
    })

    it('should return success when GitHub returns 204', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

      const result = await revokeToken('github', 'token')

      expect(result.success).toBe(true)
    })
  })

  describe('when revoking Twitter tokens', () => {
    it('should call Twitter revocation endpoint with Basic auth', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

      await revokeToken('twitter', 'twitter-access-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.twitter.com/2/oauth2/revoke',
        expect.objectContaining({
          method: 'POST',
        })
      )

      const headers = mockFetch.mock.calls[0][1].headers
      expect(headers.Authorization).toContain('Basic ')
    })

    it('should include token_type_hint for Twitter', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

      await revokeToken('twitter', 'token')

      const body = mockFetch.mock.calls[0][1].body
      expect(body).toContain('token_type_hint=access_token')
    })
  })

  describe('when handling revocation errors', () => {
    it('should return success when provider returns 400 (token already invalid)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: () => 'invalid_token' })

      const result = await revokeToken('discord', 'invalid-token')

      expect(result.success).toBe(true)
    })

    it('should return success when provider returns 401 (unauthorized)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: () => 'unauthorized' })

      const result = await revokeToken('linkedin', 'expired-token')

      expect(result.success).toBe(true)
    })

    it('should return failure for server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })

      const result = await revokeToken('discord', 'token')

      expect(result.success).toBe(false)
      expect(result.error).toContain('500')
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await revokeToken('github', 'token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('when credentials are missing', () => {
    it('should return failure when client ID is missing', async () => {
      vi.stubEnv('DISCORD_CLIENT_ID', '')

      const result = await revokeToken('discord', 'token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing credentials')
    })

    it('should return failure when client secret is missing', async () => {
      vi.stubEnv('GITHUB_CLIENT_SECRET', '')

      const result = await revokeToken('github', 'token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing credentials')
    })
  })

  describe('when revoking all tokens', () => {
    it('should revoke access token when only access token is provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

      const result = await revokeAllTokens('discord', 'access-token', null)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should return success when no tokens are provided', async () => {
      const result = await revokeAllTokens('discord', null, null)

      expect(result.success).toBe(true)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should revoke both access and refresh tokens for Twitter', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: true, status: 200 })

      const result = await revokeAllTokens('twitter', 'access-token', 'refresh-token')

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should return success if at least one revocation succeeds', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // access token succeeds
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('error'),
        }) // refresh token fails

      const result = await revokeAllTokens('twitter', 'access-token', 'refresh-token')

      expect(result.success).toBe(true)
    })
  })
})
