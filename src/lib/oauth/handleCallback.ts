import { createClient } from '@/utils/supabase/server'
import { parseOAuthState, validateCsrf } from '@/lib/oauth/state'
import { encryptTokenSafe } from '@/lib/crypto/tokens'

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
}

interface UserInfo {
  id: string
  username?: string
  email?: string
}

interface ProviderConfig {
  tokenUrl: string
  userInfoUrl: string
  getUserInfo: (data: Record<string, unknown>) => UserInfo
}

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    getUserInfo: (data) => ({
      id: data.id as string,
      username: data.username as string,
      email: data.email as string | undefined,
    }),
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    getUserInfo: (data) => ({
      id: data.sub as string,
      username: data.name as string,
      email: data.email as string | undefined,
    }),
  },
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    getUserInfo: (data) => ({
      id: String(data.id),
      username: data.login as string,
      email: data.email as string | undefined,
    }),
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    getUserInfo: (data) => {
      const userData = (data.data || data) as Record<string, unknown>
      return {
        id: userData.id as string,
        username: userData.username as string,
      }
    },
  },
}

async function exchangeCodeForTokens(
  provider: Provider,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  const config = PROVIDER_CONFIGS[provider]
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]

  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${provider}`)
  }

  const params = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (provider === 'github') {
    headers['Accept'] = 'application/json'
    params.set('client_id', clientId)
    params.set('client_secret', clientSecret)
  } else if (provider === 'twitter') {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${credentials}`
    // Use the code verifier from PKCE
    if (codeVerifier) {
      params.set('code_verifier', codeVerifier)
    }
  } else {
    params.set('client_id', clientId)
    params.set('client_secret', clientSecret)
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Token exchange failed for ${provider}:`, response.status, error)
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  return response.json()
}

async function fetchUserInfo(provider: Provider, accessToken: string): Promise<UserInfo> {
  const config = PROVIDER_CONFIGS[provider]

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }

  if (provider === 'github') {
    headers['User-Agent'] = 'SupaSquad'
    headers['Accept'] = 'application/vnd.github+json'
  }

  const response = await fetch(config.userInfoUrl, { headers })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to fetch user info for ${provider}:`, response.status, error)
    throw new Error(`Failed to fetch user info: ${response.status}`)
  }

  const data = await response.json()
  return config.getUserInfo(data)
}

export interface OAuthCallbackResult {
  success: boolean
  error?: string
  errorCode?: string
  redirectUrl: string
}

type OAuthErrorCode =
  | 'invalid_state'
  | 'expired_state'
  | 'csrf_mismatch'
  | 'token_exchange_failed'
  | 'user_info_failed'
  | 'database_error'
  | 'provider_mismatch'
  | 'unknown'

function createErrorResult(
  errorCode: OAuthErrorCode,
  message: string,
  origin: string,
  redirectUrl = '/profile'
): OAuthCallbackResult {
  const errorUrl = new URL(redirectUrl, origin)
  errorUrl.searchParams.set('oauth', 'error')
  errorUrl.searchParams.set('code', errorCode)
  errorUrl.searchParams.set('message', message)

  return {
    success: false,
    error: message,
    errorCode,
    redirectUrl: errorUrl.toString(),
  }
}

export async function handleOAuthCallback(
  provider: Provider,
  code: string,
  state: string,
  origin: string
): Promise<OAuthCallbackResult> {
  // Parse and validate state
  const statePayload = parseOAuthState(state)

  if (!statePayload) {
    return createErrorResult(
      'invalid_state',
      'Invalid or expired authorization request. Please try again.',
      origin
    )
  }

  // Verify the provider matches
  if (statePayload.provider !== provider) {
    return createErrorResult(
      'provider_mismatch',
      'Provider mismatch in authorization request.',
      origin,
      statePayload.redirectUrl
    )
  }

  // Validate CSRF token
  const csrfValid = await validateCsrf(statePayload)
  if (!csrfValid) {
    return createErrorResult(
      'csrf_mismatch',
      'Security validation failed. Please try again.',
      origin,
      statePayload.redirectUrl
    )
  }

  const { userId, redirectUrl, codeVerifier } = statePayload

  try {
    // Exchange code for tokens
    const callbackUri = `${origin}/api/auth/callback/${provider}`
    const tokens = await exchangeCodeForTokens(provider, code, callbackUri, codeVerifier)

    // Fetch user info
    const userInfo = await fetchUserInfo(provider, tokens.access_token)

    // Calculate token expiration
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    // Encrypt tokens before storage
    const encryptedAccessToken = encryptTokenSafe(tokens.access_token)
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptTokenSafe(tokens.refresh_token)
      : null

    // Save to database
    const supabase = await createClient()

    // Check if connection exists
    const { data: existing } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('social_connections')
        .update({
          provider_user_id: userInfo.id,
          provider_username: userInfo.username || null,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error(`Failed to update connection for ${provider}:`, updateError)
        return createErrorResult(
          'database_error',
          'Failed to update connection. Please try again.',
          origin,
          redirectUrl
        )
      }
    } else {
      // Insert new connection
      const { error: insertError } = await supabase.from('social_connections').insert({
        user_id: userId,
        provider,
        provider_user_id: userInfo.id,
        provider_username: userInfo.username || null,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
      })

      if (insertError) {
        console.error(`Failed to save connection for ${provider}:`, insertError)
        return createErrorResult(
          'database_error',
          'Failed to save connection. Please try again.',
          origin,
          redirectUrl
        )
      }
    }

    const successUrl = new URL(redirectUrl || '/profile', origin)
    successUrl.searchParams.set('oauth', 'success')
    successUrl.searchParams.set('provider', provider)

    return {
      success: true,
      redirectUrl: successUrl.toString(),
    }
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error)

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'

    // Determine error type from message
    let errorCode: OAuthErrorCode = 'unknown'
    if (message.includes('Token exchange')) {
      errorCode = 'token_exchange_failed'
    } else if (message.includes('user info')) {
      errorCode = 'user_info_failed'
    }

    return createErrorResult(errorCode, message, origin, redirectUrl)
  }
}
