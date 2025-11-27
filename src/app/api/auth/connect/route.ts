import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface ProviderConfig {
  authUrl: string
  scopes: string[]
  additionalParams?: Record<string, string>
}

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  discord: {
    authUrl: 'https://discord.com/api/oauth2/authorize',
    scopes: ['identify', 'email', 'guilds'],
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    scopes: ['read:user', 'user:email', 'public_repo'],
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    additionalParams: {
      code_challenge_method: 'plain',
      code_challenge: 'supasquad_challenge', // In production, use a proper PKCE challenge
    },
  },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get('provider') as Provider

  if (!provider || !PROVIDER_CONFIGS[provider]) {
    return NextResponse.json(
      { error: 'Invalid or missing provider' },
      { status: 400 }
    )
  }

  // Get the current user
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }

  const config = PROVIDER_CONFIGS[provider]
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]

  if (!clientId) {
    return NextResponse.json(
      { error: `OAuth not configured for ${provider}` },
      { status: 500 }
    )
  }

  // Build the redirect URI
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/callback/${provider}`

  // Create state with user info and CSRF token
  const state = btoa(JSON.stringify({
    userId: user.id,
    redirectUrl: searchParams.get('redirect') || '/profile',
    csrf: crypto.randomUUID(),
  }))

  // Build the authorization URL
  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', config.scopes.join(' '))
  authUrl.searchParams.set('state', state)

  // Add provider-specific params
  if (config.additionalParams) {
    for (const [key, value] of Object.entries(config.additionalParams)) {
      authUrl.searchParams.set(key, value)
    }
  }

  return NextResponse.redirect(authUrl.toString())
}
