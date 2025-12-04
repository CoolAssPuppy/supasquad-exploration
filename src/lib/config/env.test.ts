import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateEnvironment,
  getEnvConfig,
  assertValidEnvironment,
  isProviderConfigured,
  getProviderCredentials,
} from './env'

describe('env configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnvironment', () => {
    it('returns errors when required Supabase vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('NEXT_PUBLIC_SUPABASE_URL is required')
      expect(result.errors).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    })

    it('returns errors in production when security keys are missing', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      delete process.env.TOKEN_ENCRYPTION_KEY
      delete process.env.OAUTH_STATE_SECRET
      delete process.env.NEXT_PUBLIC_APP_URL

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('TOKEN_ENCRYPTION_KEY is required in production')
      expect(result.errors).toContain('OAUTH_STATE_SECRET is required in production')
      expect(result.errors).toContain('NEXT_PUBLIC_APP_URL is required in production for OAuth callbacks')
    })

    it('returns warnings in development when security keys are missing', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      delete process.env.TOKEN_ENCRYPTION_KEY
      delete process.env.OAUTH_STATE_SECRET

      const result = validateEnvironment()

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain(
        'TOKEN_ENCRYPTION_KEY not set - tokens will be stored unencrypted (dev only)'
      )
      expect(result.warnings).toContain('OAUTH_STATE_SECRET not set - OAuth flows will fail')
    })

    it('validates TOKEN_ENCRYPTION_KEY format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.TOKEN_ENCRYPTION_KEY = 'not-base64-!!!'

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('TOKEN_ENCRYPTION_KEY'))).toBe(true)
    })

    it('validates TOKEN_ENCRYPTION_KEY length', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      // Base64 of 16 bytes instead of 32
      process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('1234567890123456').toString('base64')

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'TOKEN_ENCRYPTION_KEY must be exactly 32 bytes when base64-decoded'
      )
    })

    it('accepts valid TOKEN_ENCRYPTION_KEY', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      process.env.OAUTH_STATE_SECRET = 'test-secret'
      // 32 bytes in base64
      process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
        '12345678901234567890123456789012'
      ).toString('base64')

      const result = validateEnvironment()

      expect(result.errors.filter((e) => e.includes('TOKEN_ENCRYPTION_KEY'))).toHaveLength(0)
    })

    it('warns about missing OAuth providers', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      delete process.env.DISCORD_CLIENT_ID
      delete process.env.GITHUB_CLIENT_ID

      const result = validateEnvironment()

      expect(result.warnings.some((w) => w.includes('OAuth not configured'))).toBe(true)
    })
  })

  describe('getEnvConfig', () => {
    it('returns correct environment configuration', () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
      process.env.TOKEN_ENCRYPTION_KEY = 'test-encryption-key'
      process.env.OAUTH_STATE_SECRET = 'test-state-secret'

      const config = getEnvConfig()

      expect(config.isProduction).toBe(true)
      expect(config.isDevelopment).toBe(false)
      expect(config.supabaseUrl).toBe('https://test.supabase.co')
      expect(config.supabaseAnonKey).toBe('test-anon-key')
      expect(config.appUrl).toBe('https://app.example.com')
      expect(config.tokenEncryptionKey).toBe('test-encryption-key')
      expect(config.oauthStateSecret).toBe('test-state-secret')
    })

    it('returns provider configurations', () => {
      process.env.DISCORD_CLIENT_ID = 'discord-id'
      process.env.DISCORD_CLIENT_SECRET = 'discord-secret'
      process.env.GITHUB_CLIENT_ID = 'github-id'
      delete process.env.GITHUB_CLIENT_SECRET

      const config = getEnvConfig()

      expect(config.providers.discord.configured).toBe(true)
      expect(config.providers.discord.clientId).toBe('discord-id')
      expect(config.providers.github.configured).toBe(false)
    })
  })

  describe('assertValidEnvironment', () => {
    it('throws in production with invalid config', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      expect(() => assertValidEnvironment()).toThrow('Environment validation failed')
    })

    it('does not throw in development with invalid config', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => assertValidEnvironment()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('logs warnings for non-critical issues', () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      delete process.env.TOKEN_ENCRYPTION_KEY

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      assertValidEnvironment()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TOKEN_ENCRYPTION_KEY not set')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('isProviderConfigured', () => {
    it('returns true when both client ID and secret are set', () => {
      process.env.DISCORD_CLIENT_ID = 'id'
      process.env.DISCORD_CLIENT_SECRET = 'secret'

      expect(isProviderConfigured('discord')).toBe(true)
    })

    it('returns false when client ID is missing', () => {
      delete process.env.DISCORD_CLIENT_ID
      process.env.DISCORD_CLIENT_SECRET = 'secret'

      expect(isProviderConfigured('discord')).toBe(false)
    })

    it('returns false when client secret is missing', () => {
      process.env.DISCORD_CLIENT_ID = 'id'
      delete process.env.DISCORD_CLIENT_SECRET

      expect(isProviderConfigured('discord')).toBe(false)
    })
  })

  describe('getProviderCredentials', () => {
    it('returns credentials when configured', () => {
      process.env.GITHUB_CLIENT_ID = 'github-id'
      process.env.GITHUB_CLIENT_SECRET = 'github-secret'

      const creds = getProviderCredentials('github')

      expect(creds).toEqual({
        clientId: 'github-id',
        clientSecret: 'github-secret',
      })
    })

    it('returns null when not configured', () => {
      delete process.env.TWITTER_CLIENT_ID
      delete process.env.TWITTER_CLIENT_SECRET

      expect(getProviderCredentials('twitter')).toBeNull()
    })
  })
})
