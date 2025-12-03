type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface RevokeConfig {
  url: string
  method: 'POST' | 'DELETE'
  buildBody?: (token: string, clientId: string, clientSecret: string) => URLSearchParams | string
  buildHeaders?: (clientId: string, clientSecret: string) => Record<string, string>
  tokenParam?: string
}

const REVOKE_CONFIGS: Record<Provider, RevokeConfig | null> = {
  discord: {
    url: 'https://discord.com/api/oauth2/token/revoke',
    method: 'POST',
    buildBody: (token, clientId, clientSecret) => {
      const params = new URLSearchParams()
      params.set('token', token)
      params.set('client_id', clientId)
      params.set('client_secret', clientSecret)
      return params
    },
    buildHeaders: () => ({
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
  },
  linkedin: {
    url: 'https://www.linkedin.com/oauth/v2/revoke',
    method: 'POST',
    buildBody: (token, clientId, clientSecret) => {
      const params = new URLSearchParams()
      params.set('token', token)
      params.set('client_id', clientId)
      params.set('client_secret', clientSecret)
      return params
    },
    buildHeaders: () => ({
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
  },
  github: {
    // GitHub uses DELETE to revoke application authorization
    url: 'https://api.github.com/applications/{client_id}/grant',
    method: 'DELETE',
    buildBody: (token) => JSON.stringify({ access_token: token }),
    buildHeaders: (clientId, clientSecret) => ({
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'X-GitHub-Api-Version': '2022-11-28',
    }),
  },
  twitter: {
    url: 'https://api.twitter.com/2/oauth2/revoke',
    method: 'POST',
    buildBody: (token, clientId) => {
      const params = new URLSearchParams()
      params.set('token', token)
      params.set('client_id', clientId)
      params.set('token_type_hint', 'access_token')
      return params
    },
    buildHeaders: (clientId, clientSecret) => ({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    }),
  },
}

export interface RevokeResult {
  success: boolean
  error?: string
}

/**
 * Revokes an OAuth token at the provider
 * Note: Some providers may not support token revocation or may fail silently
 */
export async function revokeToken(
  provider: Provider,
  accessToken: string
): Promise<RevokeResult> {
  const config = REVOKE_CONFIGS[provider]

  if (!config) {
    return { success: true } // No revocation endpoint, consider it "successful"
  }

  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]

  if (!clientId || !clientSecret) {
    console.error(`Missing OAuth credentials for ${provider} token revocation`)
    return { success: false, error: 'Missing credentials' }
  }

  try {
    let url = config.url
    if (provider === 'github') {
      url = url.replace('{client_id}', clientId)
    }

    const headers = config.buildHeaders?.(clientId, clientSecret) || {}
    const body = config.buildBody?.(accessToken, clientId, clientSecret)

    const response = await fetch(url, {
      method: config.method,
      headers,
      body: body?.toString(),
    })

    // GitHub returns 204 on success, others return 200
    if (response.ok || response.status === 204) {
      return { success: true }
    }

    // Some providers return 400 if token is already invalid/expired
    // Consider this a "success" since the token is no longer valid
    if (response.status === 400 || response.status === 401) {
      console.warn(`Token revocation returned ${response.status} for ${provider} - token may already be invalid`)
      return { success: true }
    }

    const errorText = await response.text()
    console.error(`Token revocation failed for ${provider}:`, response.status, errorText)
    return { success: false, error: `HTTP ${response.status}: ${errorText}` }
  } catch (error) {
    console.error(`Token revocation error for ${provider}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Revokes both access and refresh tokens if available
 */
export async function revokeAllTokens(
  provider: Provider,
  accessToken: string | null,
  refreshToken: string | null
): Promise<RevokeResult> {
  const results: RevokeResult[] = []

  if (accessToken) {
    results.push(await revokeToken(provider, accessToken))
  }

  // Some providers allow revoking refresh tokens separately
  if (refreshToken && provider === 'twitter') {
    // Twitter requires separate revocation for refresh tokens
    const config = REVOKE_CONFIGS[provider]
    if (config) {
      const clientId = process.env.TWITTER_CLIENT_ID
      const clientSecret = process.env.TWITTER_CLIENT_SECRET
      if (clientId && clientSecret) {
        try {
          const params = new URLSearchParams()
          params.set('token', refreshToken)
          params.set('client_id', clientId)
          params.set('token_type_hint', 'refresh_token')

          const response = await fetch(config.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: params.toString(),
          })

          results.push({
            success: response.ok || response.status === 204 || response.status === 400,
          })
        } catch (error) {
          console.error('Twitter refresh token revocation error:', error)
        }
      }
    }
  }

  // Return success if any revocation succeeded, or if there were no tokens
  const anySuccess = results.length === 0 || results.some((r) => r.success)
  const errors = results.filter((r) => !r.success).map((r) => r.error).join('; ')

  return {
    success: anySuccess,
    error: errors || undefined,
  }
}
