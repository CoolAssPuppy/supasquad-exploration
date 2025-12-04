/**
 * Environment variable validation and configuration
 *
 * This module validates required environment variables and provides
 * type-safe access to configuration values.
 */

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  configured: boolean
}

interface EnvConfig {
  // Runtime environment
  isProduction: boolean
  isDevelopment: boolean

  // Supabase
  supabaseUrl: string
  supabaseAnonKey: string

  // App
  appUrl: string

  // Security
  tokenEncryptionKey: string | null
  oauthStateSecret: string | null

  // OAuth providers
  providers: Record<Provider, OAuthProviderConfig>
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates environment variables and returns any errors/warnings
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  // Required Supabase configuration
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Security keys - required in production
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    if (isProduction) {
      errors.push('TOKEN_ENCRYPTION_KEY is required in production')
    } else {
      warnings.push('TOKEN_ENCRYPTION_KEY not set - tokens will be stored unencrypted (dev only)')
    }
  } else {
    // Validate key length
    try {
      const keyBuffer = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'base64')
      if (keyBuffer.length !== 32) {
        errors.push('TOKEN_ENCRYPTION_KEY must be exactly 32 bytes when base64-decoded')
      }
    } catch {
      errors.push('TOKEN_ENCRYPTION_KEY must be a valid base64 string')
    }
  }

  if (!process.env.OAUTH_STATE_SECRET) {
    if (isProduction) {
      errors.push('OAUTH_STATE_SECRET is required in production')
    } else {
      warnings.push('OAUTH_STATE_SECRET not set - OAuth flows will fail')
    }
  }

  // App URL - required in production for OAuth callbacks
  if (!process.env.NEXT_PUBLIC_APP_URL && isProduction) {
    errors.push('NEXT_PUBLIC_APP_URL is required in production for OAuth callbacks')
  }

  // OAuth providers - warn if not configured
  const providers: Provider[] = ['discord', 'linkedin', 'github', 'twitter']
  const missingProviders: string[] = []

  for (const provider of providers) {
    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]

    if (!clientId || !clientSecret) {
      missingProviders.push(provider)
    }
  }

  if (missingProviders.length > 0) {
    warnings.push(`OAuth not configured for: ${missingProviders.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Gets the current environment configuration
 * Does NOT throw - use validateEnvironment() to check for errors first
 */
export function getEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production'

  const providers: Record<Provider, OAuthProviderConfig> = {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      configured: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      configured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      configured: Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    },
  }

  return {
    isProduction,
    isDevelopment: !isProduction,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || null,
    oauthStateSecret: process.env.OAUTH_STATE_SECRET || null,
    providers,
  }
}

/**
 * Validates environment on module load in production
 * Logs warnings in development, throws in production if invalid
 */
export function assertValidEnvironment(): void {
  const result = validateEnvironment()

  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`[ENV] Warning: ${warning}`)
  }

  // In production, throw on errors
  if (!result.valid && process.env.NODE_ENV === 'production') {
    const errorMessage = `Environment validation failed:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`
    throw new Error(errorMessage)
  }

  // In development, log errors but don't throw
  if (!result.valid) {
    console.error('[ENV] Configuration errors (app may not work correctly):')
    for (const error of result.errors) {
      console.error(`  - ${error}`)
    }
  }
}

/**
 * Checks if a specific OAuth provider is configured
 */
export function isProviderConfigured(provider: Provider): boolean {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]
  return Boolean(clientId && clientSecret)
}

/**
 * Gets OAuth credentials for a provider
 * Returns null if not configured
 */
export function getProviderCredentials(
  provider: Provider
): { clientId: string; clientSecret: string } | null {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]

  if (!clientId || !clientSecret) {
    return null
  }

  return { clientId, clientSecret }
}
