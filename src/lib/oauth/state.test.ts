import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createOAuthState,
  parseOAuthState,
  extractCsrfFromState,
  setStateCookie,
  getAndClearStateCookie,
  validateCsrf,
} from './state'

// Mock the cookies module
const mockCookieGet = vi.fn()
const mockCookieSet = vi.fn()
const mockCookieDelete = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: mockCookieGet,
      set: mockCookieSet,
      delete: mockCookieDelete,
    })
  ),
}))

describe('OAuth state management', () => {
  beforeEach(() => {
    vi.stubEnv('OAUTH_STATE_SECRET', 'test-oauth-state-secret-for-testing')
  })

  describe('when creating OAuth state', () => {
    it('should create a signed state string with all payload fields', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)

      // State should be in format: base64url(payload).signature
      expect(state).toContain('.')
      const [encodedPayload] = state.split('.')
      expect(encodedPayload).toBeDefined()
    })

    it('should automatically add CSRF token to state', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'discord' as const,
      }

      const state = createOAuthState(payload)
      const parsed = parseOAuthState(state)

      expect(parsed).not.toBeNull()
      expect(parsed?.csrf).toBeDefined()
      expect(parsed?.csrf.length).toBeGreaterThan(0)
    })

    it('should automatically add expiration timestamp', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'linkedin' as const,
      }

      const beforeCreate = Date.now()
      const state = createOAuthState(payload)
      const afterCreate = Date.now()

      const parsed = parseOAuthState(state)

      expect(parsed).not.toBeNull()
      expect(parsed?.exp).toBeDefined()
      // Expiration should be ~5 minutes in the future
      const fiveMinutes = 5 * 60 * 1000
      expect(parsed?.exp).toBeGreaterThanOrEqual(beforeCreate + fiveMinutes - 100)
      expect(parsed?.exp).toBeLessThanOrEqual(afterCreate + fiveMinutes + 100)
    })

    it('should include optional codeVerifier for PKCE', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'twitter' as const,
        codeVerifier: 'pkce-code-verifier-value',
      }

      const state = createOAuthState(payload)
      const parsed = parseOAuthState(state)

      expect(parsed?.codeVerifier).toBe('pkce-code-verifier-value')
    })

    it('should generate unique CSRF tokens for each state', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state1 = createOAuthState(payload)
      const state2 = createOAuthState(payload)

      const parsed1 = parseOAuthState(state1)
      const parsed2 = parseOAuthState(state2)

      expect(parsed1?.csrf).not.toBe(parsed2?.csrf)
    })
  })

  describe('when parsing OAuth state', () => {
    it('should successfully parse a valid state', () => {
      const payload = {
        userId: 'user-456',
        redirectUrl: '/dashboard',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      const parsed = parseOAuthState(state)

      expect(parsed).not.toBeNull()
      expect(parsed?.userId).toBe('user-456')
      expect(parsed?.redirectUrl).toBe('/dashboard')
      expect(parsed?.provider).toBe('github')
    })

    it('should return null for state with invalid signature', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      // Tamper with the signature
      const [encodedPayload] = state.split('.')
      const tamperedState = `${encodedPayload}.invalid-signature`

      const parsed = parseOAuthState(tamperedState)

      expect(parsed).toBeNull()
    })

    it('should return null for state with tampered payload', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      const [, signature] = state.split('.')

      // Create a different payload and use original signature
      const tamperedPayload = Buffer.from(
        JSON.stringify({ ...payload, userId: 'hacker-id' })
      ).toString('base64url')
      const tamperedState = `${tamperedPayload}.${signature}`

      const parsed = parseOAuthState(tamperedState)

      expect(parsed).toBeNull()
    })

    it('should return null for malformed state (no dot separator)', () => {
      const parsed = parseOAuthState('no-dot-separator')

      expect(parsed).toBeNull()
    })

    it('should return null for malformed state (invalid base64)', () => {
      const parsed = parseOAuthState('!!!invalid!!!.signature')

      expect(parsed).toBeNull()
    })

    it('should return null for expired state', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)

      // Mock time to be 6 minutes in the future
      vi.useFakeTimers()
      vi.advanceTimersByTime(6 * 60 * 1000)

      const parsed = parseOAuthState(state)

      expect(parsed).toBeNull()

      vi.useRealTimers()
    })

    it('should accept state that is not yet expired', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)

      // Mock time to be 4 minutes in the future (within 5 minute window)
      vi.useFakeTimers()
      vi.advanceTimersByTime(4 * 60 * 1000)

      const parsed = parseOAuthState(state)

      expect(parsed).not.toBeNull()
      expect(parsed?.userId).toBe('user-123')

      vi.useRealTimers()
    })
  })

  describe('when extracting CSRF from state', () => {
    it('should extract CSRF token without full validation', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      const csrf = extractCsrfFromState(state)

      expect(csrf).toBeDefined()
      expect(csrf?.length).toBeGreaterThan(0)
    })

    it('should return the same CSRF as in the full parsed state', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      const extractedCsrf = extractCsrfFromState(state)
      const parsed = parseOAuthState(state)

      expect(extractedCsrf).toBe(parsed?.csrf)
    })

    it('should return null for invalid state format', () => {
      const csrf = extractCsrfFromState('invalid-state')

      expect(csrf).toBeNull()
    })

    it('should return null for state with invalid JSON', () => {
      const invalidJson = Buffer.from('not-json').toString('base64url')
      const csrf = extractCsrfFromState(`${invalidJson}.signature`)

      expect(csrf).toBeNull()
    })
  })

  describe('when state signing key is missing', () => {
    beforeEach(() => {
      vi.stubEnv('OAUTH_STATE_SECRET', '')
    })

    it('should throw error when creating state without signing key', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      expect(() => createOAuthState(payload)).toThrow(
        'OAUTH_STATE_SECRET environment variable is required'
      )
    })
  })

  describe('security properties', () => {
    it('should use timing-safe signature comparison', () => {
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      const [encodedPayload] = state.split('.')

      // All these should fail regardless of how "close" the signature is
      expect(parseOAuthState(`${encodedPayload}.`)).toBeNull()
      expect(parseOAuthState(`${encodedPayload}.a`)).toBeNull()
      expect(parseOAuthState(`${encodedPayload}.abcdef`)).toBeNull()
      expect(
        parseOAuthState(`${encodedPayload}.${Buffer.from('wrong').toString('base64url')}`)
      ).toBeNull()
    })

    it('should not leak information about valid signatures through timing', () => {
      // This is a property test - we can't directly measure timing,
      // but we verify the code path is the same for all failures
      const payload = {
        userId: 'user-123',
        redirectUrl: '/profile',
        provider: 'github' as const,
      }

      const state = createOAuthState(payload)
      const [encodedPayload, signature] = state.split('.')

      // Create signatures of varying "closeness" to the real one
      const wrongSignatures = [
        '',
        'a',
        signature.substring(0, 1),
        signature.substring(0, signature.length - 1),
        signature + 'x',
        'x' + signature.substring(1),
      ]

      // All should return null (the timing-safe comparison should handle all equally)
      for (const wrongSig of wrongSignatures) {
        expect(parseOAuthState(`${encodedPayload}.${wrongSig}`)).toBeNull()
      }
    })
  })

  describe('when managing state cookies', () => {
    beforeEach(() => {
      mockCookieGet.mockReset()
      mockCookieSet.mockReset()
      mockCookieDelete.mockReset()
    })

    describe('setStateCookie', () => {
      it('should set cookie with correct options', async () => {
        await setStateCookie('test-csrf-token')

        expect(mockCookieSet).toHaveBeenCalledWith(
          'oauth_state',
          'test-csrf-token',
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 600,
            path: '/',
          })
        )
      })
    })

    describe('getAndClearStateCookie', () => {
      it('should return cookie value when cookie exists', async () => {
        mockCookieGet.mockReturnValue({ value: 'stored-csrf-token' })

        const result = await getAndClearStateCookie()

        expect(result).toBe('stored-csrf-token')
      })

      it('should delete cookie after reading', async () => {
        mockCookieGet.mockReturnValue({ value: 'stored-csrf-token' })

        await getAndClearStateCookie()

        expect(mockCookieDelete).toHaveBeenCalledWith('oauth_state')
      })

      it('should return null when cookie does not exist', async () => {
        mockCookieGet.mockReturnValue(undefined)

        const result = await getAndClearStateCookie()

        expect(result).toBeNull()
      })

      it('should not delete cookie when it does not exist', async () => {
        mockCookieGet.mockReturnValue(undefined)

        await getAndClearStateCookie()

        expect(mockCookieDelete).not.toHaveBeenCalled()
      })
    })

    describe('validateCsrf', () => {
      it('should return true when CSRF tokens match', async () => {
        const csrfToken = 'matching-csrf-token'
        mockCookieGet.mockReturnValue({ value: csrfToken })

        const statePayload = {
          userId: 'user-123',
          redirectUrl: '/profile',
          provider: 'github',
          csrf: csrfToken,
          exp: Date.now() + 300000,
        }

        const result = await validateCsrf(statePayload)

        expect(result).toBe(true)
      })

      it('should return false when cookie is missing', async () => {
        mockCookieGet.mockReturnValue(undefined)

        const statePayload = {
          userId: 'user-123',
          redirectUrl: '/profile',
          provider: 'github',
          csrf: 'csrf-token',
          exp: Date.now() + 300000,
        }

        const result = await validateCsrf(statePayload)

        expect(result).toBe(false)
      })

      it('should return false when CSRF tokens do not match', async () => {
        mockCookieGet.mockReturnValue({ value: 'cookie-csrf' })

        const statePayload = {
          userId: 'user-123',
          redirectUrl: '/profile',
          provider: 'github',
          csrf: 'different-csrf',
          exp: Date.now() + 300000,
        }

        const result = await validateCsrf(statePayload)

        expect(result).toBe(false)
      })

      it('should return false when CSRF token lengths differ', async () => {
        mockCookieGet.mockReturnValue({ value: 'short' })

        const statePayload = {
          userId: 'user-123',
          redirectUrl: '/profile',
          provider: 'github',
          csrf: 'much-longer-csrf-token',
          exp: Date.now() + 300000,
        }

        const result = await validateCsrf(statePayload)

        expect(result).toBe(false)
      })
    })
  })
})
