import { randomBytes, createHmac } from 'crypto'
import { cookies } from 'next/headers'

const STATE_COOKIE_NAME = 'oauth_state'
const STATE_EXPIRATION_MS = 5 * 60 * 1000 // 5 minutes
const COOKIE_MAX_AGE = 600 // 10 minutes (slightly longer than state expiration)

interface OAuthStatePayload {
  userId: string
  redirectUrl: string
  provider: string
  csrf: string
  exp: number
  codeVerifier?: string // For PKCE
}

function getSigningKey(): string {
  const key = process.env.OAUTH_STATE_SECRET
  if (!key) {
    throw new Error('OAUTH_STATE_SECRET environment variable is required')
  }
  return key
}

/**
 * Creates a signed OAuth state parameter with CSRF protection
 */
export function createOAuthState(payload: Omit<OAuthStatePayload, 'csrf' | 'exp'>): string {
  const csrf = randomBytes(32).toString('base64url')
  const exp = Date.now() + STATE_EXPIRATION_MS

  const fullPayload: OAuthStatePayload = {
    ...payload,
    csrf,
    exp,
  }

  const data = JSON.stringify(fullPayload)
  const signature = createHmac('sha256', getSigningKey()).update(data).digest('base64url')

  // Return state as: base64url(payload).signature
  const encodedPayload = Buffer.from(data).toString('base64url')
  return `${encodedPayload}.${signature}`
}

/**
 * Parses and validates an OAuth state parameter
 * Returns null if invalid or expired
 */
export function parseOAuthState(state: string): OAuthStatePayload | null {
  try {
    const [encodedPayload, signature] = state.split('.')
    if (!encodedPayload || !signature) {
      console.error('OAuth state: Invalid format - missing payload or signature')
      return null
    }

    const data = Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    const expectedSignature = createHmac('sha256', getSigningKey()).update(data).digest('base64url')

    // Timing-safe comparison
    if (signature.length !== expectedSignature.length) {
      console.error('OAuth state: Signature length mismatch')
      return null
    }

    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
    }

    if (result !== 0) {
      console.error('OAuth state: Invalid signature')
      return null
    }

    const payload = JSON.parse(data) as OAuthStatePayload

    // Check expiration
    if (Date.now() > payload.exp) {
      console.error('OAuth state: Expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('OAuth state: Parse error', error)
    return null
  }
}

/**
 * Stores CSRF token in an HttpOnly cookie for double-submit verification
 */
export async function setStateCookie(csrf: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE_NAME, csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Retrieves and clears the CSRF cookie
 */
export async function getAndClearStateCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const csrf = cookieStore.get(STATE_COOKIE_NAME)?.value || null

  if (csrf) {
    cookieStore.delete(STATE_COOKIE_NAME)
  }

  return csrf
}

/**
 * Validates that the CSRF token in state matches the cookie
 */
export async function validateCsrf(statePayload: OAuthStatePayload): Promise<boolean> {
  const cookieCsrf = await getAndClearStateCookie()

  if (!cookieCsrf) {
    console.error('OAuth CSRF: No cookie found')
    return false
  }

  // Timing-safe comparison
  if (cookieCsrf.length !== statePayload.csrf.length) {
    console.error('OAuth CSRF: Length mismatch')
    return false
  }

  let result = 0
  for (let i = 0; i < cookieCsrf.length; i++) {
    result |= cookieCsrf.charCodeAt(i) ^ statePayload.csrf.charCodeAt(i)
  }

  if (result !== 0) {
    console.error('OAuth CSRF: Token mismatch')
    return false
  }

  return true
}

/**
 * Extracts the CSRF token from a state string without full validation
 * Used to set the cookie before redirect
 */
export function extractCsrfFromState(state: string): string | null {
  try {
    const [encodedPayload] = state.split('.')
    if (!encodedPayload) return null

    const data = Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    const payload = JSON.parse(data) as OAuthStatePayload

    return payload.csrf
  } catch {
    return null
  }
}
