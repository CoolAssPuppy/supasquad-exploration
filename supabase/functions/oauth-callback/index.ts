import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
  scope?: string
}

interface UserInfo {
  id: string
  username?: string
  email?: string
}

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

const PROVIDER_CONFIGS: Record<Provider, {
  tokenUrl: string
  userInfoUrl: string
  clientIdEnv: string
  clientSecretEnv: string
}> = {
  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    clientIdEnv: 'DISCORD_CLIENT_ID',
    clientSecretEnv: 'DISCORD_CLIENT_SECRET',
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    clientIdEnv: 'TWITTER_CLIENT_ID',
    clientSecretEnv: 'TWITTER_CLIENT_SECRET',
  },
}

async function exchangeCodeForTokens(
  provider: Provider,
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const config = PROVIDER_CONFIGS[provider]
  const clientId = Deno.env.get(config.clientIdEnv)
  const clientSecret = Deno.env.get(config.clientSecretEnv)

  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${provider}`)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  // Twitter requires PKCE code_verifier
  // For simplicity, we'll handle this separately if needed

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  // GitHub requires Accept header
  if (provider === 'github') {
    headers['Accept'] = 'application/json'
  }

  // Twitter requires Basic auth
  if (provider === 'twitter') {
    const credentials = btoa(`${clientId}:${clientSecret}`)
    headers['Authorization'] = `Basic ${credentials}`
    params.delete('client_id')
    params.delete('client_secret')
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

async function getUserInfo(provider: Provider, accessToken: string): Promise<UserInfo> {
  const config = PROVIDER_CONFIGS[provider]

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  }

  // GitHub requires User-Agent
  if (provider === 'github') {
    headers['User-Agent'] = 'SupaSquad'
  }

  const response = await fetch(config.userInfoUrl, { headers })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch user info: ${error}`)
  }

  const data = await response.json()

  // Normalize user info across providers
  switch (provider) {
    case 'discord':
      return {
        id: data.id,
        username: data.username,
        email: data.email,
      }
    case 'linkedin':
      return {
        id: data.sub,
        username: data.name,
        email: data.email,
      }
    case 'github':
      return {
        id: String(data.id),
        username: data.login,
        email: data.email,
      }
    case 'twitter':
      return {
        id: data.data.id,
        username: data.data.username,
      }
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const provider = url.searchParams.get('provider') as Provider
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      throw new Error(`OAuth error: ${error}`)
    }

    if (!code || !provider || !state) {
      throw new Error('Missing required parameters: code, provider, or state')
    }

    if (!PROVIDER_CONFIGS[provider]) {
      throw new Error(`Invalid provider: ${provider}`)
    }

    // Decode state to get user_id and redirect URL
    const stateData = JSON.parse(atob(state))
    const { userId, redirectUrl } = stateData

    if (!userId) {
      throw new Error('Missing user ID in state')
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the redirect URI from environment or construct it
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const callbackRedirectUri = `${appUrl}/api/auth/callback/${provider}`

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(provider, code, callbackRedirectUri)

    // Get user info from provider
    const userInfo = await getUserInfo(provider, tokens.access_token)

    // Calculate token expiration
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    // Upsert the social connection
    const { error: upsertError } = await supabase
      .from('social_connections')
      .upsert(
        {
          user_id: userId,
          provider,
          provider_user_id: userInfo.id,
          provider_username: userInfo.username || null,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    if (upsertError) {
      throw new Error(`Failed to save connection: ${upsertError.message}`)
    }

    // Redirect back to the app
    const successUrl = new URL(redirectUrl || `${appUrl}/profile`)
    successUrl.searchParams.set('oauth', 'success')
    successUrl.searchParams.set('provider', provider)

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': successUrl.toString(),
      },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const errorUrl = new URL(`${appUrl}/profile`)
    errorUrl.searchParams.set('oauth', 'error')
    errorUrl.searchParams.set('message', error.message)

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': errorUrl.toString(),
      },
    })
  }
})
