import { randomBytes, createHash } from 'crypto'

/**
 * Generates a cryptographically secure code verifier for PKCE
 * Per RFC 7636, the verifier should be 43-128 characters from [A-Z][a-z][0-9]-._~
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes and encode as base64url (43 characters)
  return randomBytes(32).toString('base64url')
}

/**
 * Generates a code challenge from a verifier using S256 method
 * Per RFC 7636: BASE64URL(SHA256(code_verifier))
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Generates both code verifier and challenge
 */
export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  return { verifier, challenge }
}
