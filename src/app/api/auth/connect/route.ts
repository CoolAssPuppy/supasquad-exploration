import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  createOAuthState,
  extractCsrfFromState,
  setStateCookie,
  setPkceVerifierCookie,
} from '@/lib/oauth/state'
import { generatePkcePair } from '@/lib/oauth/pkce'

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

const VALID_PROVIDERS = new Set<Provider>(['discord', 'linkedin', 'github', 'twitter'])

interface ProviderConfig {
  authUrl: string
  scopes: string[]
  usePkce?: boolean
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
    usePkce: true,
  },
}

function isValidProvider(provider: string): provider is Provider {
  return VALID_PROVIDERS.has(provider as Provider)
}

function isValidRedirectUrl(url: string): boolean {
  // Only allow relative paths starting with /
  if (!url.startsWith('/')) {
    return false
  }
  // Prevent protocol-relative URLs and double slashes
  if (url.startsWith('//')) {
    return false
  }
  // Prevent any URL encoding tricks
  try {
    const decoded = decodeURIComponent(url)
    if (decoded.includes('//') || decoded.includes(':')) {
      return false
    }
  } catch {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const providerParam = searchParams.get('provider')
  const redirectParam = searchParams.get('redirect') || '/profile'

  // Validate provider
  if (!providerParam || !isValidProvider(providerParam)) {
    return NextResponse.json(
      { error: 'Invalid or missing provider' },
      { status: 400 }
    )
  }

  const provider = providerParam

  // Validate redirect URL to prevent open redirect
  if (!isValidRedirectUrl(redirectParam)) {
    return NextResponse.json(
      { error: 'Invalid redirect URL' },
      { status: 400 }
    )
  }

  // Verify user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    const loginUrl = new URL('/login', request.nextUrl.origin)
    loginUrl.searchParams.set('error', 'unauthorized')
    loginUrl.searchParams.set('redirect', redirectParam)
    return NextResponse.redirect(loginUrl)
  }

  const config = PROVIDER_CONFIGS[provider]
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]

  if (!clientId) {
    console.error(`Missing CLIENT_ID for provider: ${provider}`)
    const errorUrl = new URL(redirectParam, request.nextUrl.origin)
    errorUrl.searchParams.set('oauth', 'error')
    errorUrl.searchParams.set('message', `OAuth not configured for ${provider}`)
    return NextResponse.redirect(errorUrl)
  }

  // Build redirect URI
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUri = `${appUrl}/api/auth/callback/${provider}`

  // Generate PKCE if required
  let codeChallenge: string | undefined

  if (config.usePkce) {
    const pkce = generatePkcePair()
    codeChallenge = pkce.challenge
    // Store verifier in HttpOnly cookie (more secure than state URL)
    await setPkceVerifierCookie(pkce.verifier)
  }

  // Create signed state with CSRF token (no longer includes codeVerifier)
  const state = createOAuthState({
    userId: user.id,
    redirectUrl: redirectParam,
    provider,
  })

  // Extract CSRF and store in cookie for double-submit validation
  const csrf = extractCsrfFromState(state)
  if (csrf) {
    await setStateCookie(csrf)
  }

  // Build authorization URL
  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', config.scopes.join(' '))
  authUrl.searchParams.set('state', state)

  // Add PKCE parameters if required
  if (config.usePkce && codeChallenge) {
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
  }

  return NextResponse.redirect(authUrl.toString())
}
