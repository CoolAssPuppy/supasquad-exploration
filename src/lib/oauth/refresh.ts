/**
 * OAuth Token Refresh Module
 *
 * Handles token refresh for all supported OAuth providers.
 * Each provider has different refresh mechanisms and token lifetimes:
 *
 * - GitHub: Tokens don't expire by default (no refresh needed)
 * - Twitter: Access tokens expire in 2 hours, refresh tokens in 6 months
 * - LinkedIn: Access tokens expire in 60 days, refresh tokens in 365 days
 * - Discord: Access tokens expire in 7 days, refresh tokens don't expire
 */

export type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

export interface TokenPair {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}

export interface RefreshResult {
  success: boolean
  tokens?: TokenPair
  error?: string
}

interface ProviderRefreshConfig {
  tokenUrl: string
  supportsRefresh: boolean
  buildRequest: (
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ) => { headers: Record<string, string>; body: string }
  parseResponse: (data: Record<string, unknown>) => TokenPair
}

const PROVIDER_CONFIGS: Record<Provider, ProviderRefreshConfig> = {
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    supportsRefresh: false,
    buildRequest: () => ({ headers: {}, body: '' }),
    parseResponse: () => ({ accessToken: '', refreshToken: null, expiresAt: null }),
  },

  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    supportsRefresh: true,
    buildRequest: (refreshToken, clientId, clientSecret) => {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      })
      return {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params.toString(),
      }
    },
    parseResponse: (data) => ({
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) || null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + (data.expires_in as number) * 1000)
        : null,
    }),
  },

  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    supportsRefresh: true,
    buildRequest: (refreshToken, clientId, clientSecret) => {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      })
      return {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    },
    parseResponse: (data) => ({
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) || null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + (data.expires_in as number) * 1000)
        : null,
    }),
  },

  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    supportsRefresh: true,
    buildRequest: (refreshToken, clientId, clientSecret) => {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      })
      return {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    },
    parseResponse: (data) => ({
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) || null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + (data.expires_in as number) * 1000)
        : null,
    }),
  },
}

/**
 * Determines if a token needs refreshing based on expiration time.
 * Returns true if token expires within the buffer period.
 *
 * @param expiresAt - Token expiration timestamp
 * @param bufferMinutes - Minutes before expiry to trigger refresh (default: 5)
 */
export function isTokenExpired(expiresAt: Date | string | null, bufferMinutes = 5): boolean {
  if (!expiresAt) {
    return false
  }

  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const bufferMs = bufferMinutes * 60 * 1000
  return Date.now() >= expiry.getTime() - bufferMs
}

/**
 * Checks if a provider supports token refresh.
 */
export function supportsRefresh(provider: Provider): boolean {
  return PROVIDER_CONFIGS[provider].supportsRefresh
}

/**
 * Refreshes an OAuth token for the specified provider.
 *
 * @param provider - The OAuth provider
 * @param refreshToken - The refresh token to use
 * @returns RefreshResult with new tokens or error
 */
export async function refreshToken(
  provider: Provider,
  refreshToken: string
): Promise<RefreshResult> {
  const config = PROVIDER_CONFIGS[provider]

  if (!config.supportsRefresh) {
    return {
      success: false,
      error: `Provider ${provider} does not support token refresh`,
    }
  }

  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: `Missing OAuth credentials for ${provider}`,
    }
  }

  try {
    const { headers, body } = config.buildRequest(refreshToken, clientId, clientSecret)

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Token refresh failed for ${provider}:`, response.status, errorText)

      // Check for specific error conditions
      if (response.status === 400 || response.status === 401) {
        return {
          success: false,
          error: `Refresh token is invalid or expired for ${provider}`,
        }
      }

      return {
        success: false,
        error: `Token refresh failed: HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    const tokens = config.parseResponse(data)

    // Validate we got an access token
    if (!tokens.accessToken) {
      return {
        success: false,
        error: 'No access token in refresh response',
      }
    }

    return {
      success: true,
      tokens,
    }
  } catch (error) {
    console.error(`Token refresh error for ${provider}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during token refresh',
    }
  }
}

/**
 * Attempts to refresh a token if it's expired or about to expire.
 * Returns the original tokens if refresh is not needed or not supported.
 *
 * @param provider - The OAuth provider
 * @param currentTokens - Current token pair
 * @returns RefreshResult with potentially new tokens
 */
export async function refreshIfNeeded(
  provider: Provider,
  currentTokens: TokenPair
): Promise<RefreshResult> {
  // Check if refresh is needed
  if (!isTokenExpired(currentTokens.expiresAt)) {
    return {
      success: true,
      tokens: currentTokens,
    }
  }

  // Check if provider supports refresh
  if (!supportsRefresh(provider)) {
    // GitHub tokens don't expire, so this is fine
    if (provider === 'github') {
      return {
        success: true,
        tokens: currentTokens,
      }
    }
    return {
      success: false,
      error: `Token expired and ${provider} does not support refresh`,
    }
  }

  // Check if we have a refresh token
  if (!currentTokens.refreshToken) {
    return {
      success: false,
      error: `Token expired but no refresh token available for ${provider}`,
    }
  }

  // Attempt refresh
  return refreshToken(provider, currentTokens.refreshToken)
}
