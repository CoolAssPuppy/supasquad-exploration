import { createClient } from '@/utils/supabase/server'

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
  redirectUri: string
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
    params.set('code_verifier', 'supasquad_challenge') // Match the code_challenge from connect
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
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

async function fetchUserInfo(provider: Provider, accessToken: string): Promise<UserInfo> {
  const config = PROVIDER_CONFIGS[provider]

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  }

  if (provider === 'github') {
    headers['User-Agent'] = 'SupaSquad'
    headers['Accept'] = 'application/vnd.github+json'
  }

  const response = await fetch(config.userInfoUrl, { headers })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch user info: ${error}`)
  }

  const data = await response.json()
  return config.getUserInfo(data)
}

export interface OAuthCallbackResult {
  success: boolean
  error?: string
  redirectUrl: string
}

export async function handleOAuthCallback(
  provider: Provider,
  code: string,
  state: string,
  origin: string
): Promise<OAuthCallbackResult> {
  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId, redirectUrl } = stateData

    if (!userId) {
      throw new Error('Missing user ID in state')
    }

    // Exchange code for tokens
    const callbackUri = `${origin}/api/auth/callback/${provider}`
    const tokens = await exchangeCodeForTokens(provider, code, callbackUri)

    // Fetch user info
    const userInfo = await fetchUserInfo(provider, tokens.access_token)

    // Calculate token expiration
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
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
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        throw new Error(`Failed to update connection: ${updateError.message}`)
      }
    } else {
      // Insert new connection
      const { error: insertError } = await supabase
        .from('social_connections')
        .insert({
          user_id: userId,
          provider,
          provider_user_id: userInfo.id,
          provider_username: userInfo.username || null,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
        })

      if (insertError) {
        throw new Error(`Failed to save connection: ${insertError.message}`)
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

    const errorUrl = new URL('/profile', origin)
    errorUrl.searchParams.set('oauth', 'error')
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      redirectUrl: errorUrl.toString(),
    }
  }
}
