import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge, generatePkcePair } from './pkce'
import { createHash } from 'crypto'

describe('PKCE code generation', () => {
  describe('when generating code verifiers', () => {
    it('should generate a verifier with valid length (43-128 characters per RFC 7636)', () => {
      const verifier = generateCodeVerifier()

      expect(verifier.length).toBeGreaterThanOrEqual(43)
      expect(verifier.length).toBeLessThanOrEqual(128)
    })

    it('should generate different verifiers each time', () => {
      const verifier1 = generateCodeVerifier()
      const verifier2 = generateCodeVerifier()

      expect(verifier1).not.toBe(verifier2)
    })

    it('should only contain valid base64url characters', () => {
      const verifier = generateCodeVerifier()
      const base64urlPattern = /^[A-Za-z0-9_-]+$/

      expect(verifier).toMatch(base64urlPattern)
    })

    it('should not contain padding characters', () => {
      const verifier = generateCodeVerifier()

      expect(verifier).not.toContain('=')
    })
  })

  describe('when generating code challenges', () => {
    it('should generate a valid S256 challenge from a verifier', () => {
      const verifier = 'test-verifier-value'

      const challenge = generateCodeChallenge(verifier)

      // Manually calculate expected S256 challenge
      const expectedChallenge = createHash('sha256')
        .update(verifier)
        .digest('base64url')

      expect(challenge).toBe(expectedChallenge)
    })

    it('should produce different challenges for different verifiers', () => {
      const challenge1 = generateCodeChallenge('verifier-one')
      const challenge2 = generateCodeChallenge('verifier-two')

      expect(challenge1).not.toBe(challenge2)
    })

    it('should produce consistent challenges for the same verifier', () => {
      const verifier = 'same-verifier'

      const challenge1 = generateCodeChallenge(verifier)
      const challenge2 = generateCodeChallenge(verifier)

      expect(challenge1).toBe(challenge2)
    })

    it('should use base64url encoding (no padding)', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)

      expect(challenge).not.toContain('=')
      expect(challenge).not.toContain('+')
      expect(challenge).not.toContain('/')
    })
  })

  describe('when generating PKCE pairs', () => {
    it('should return both verifier and challenge', () => {
      const { verifier, challenge } = generatePkcePair()

      expect(verifier).toBeDefined()
      expect(challenge).toBeDefined()
      expect(verifier.length).toBeGreaterThanOrEqual(43)
      expect(challenge.length).toBeGreaterThan(0)
    })

    it('should generate a challenge that corresponds to the verifier', () => {
      const { verifier, challenge } = generatePkcePair()

      // Verify the challenge is correctly derived from the verifier
      const expectedChallenge = generateCodeChallenge(verifier)

      expect(challenge).toBe(expectedChallenge)
    })

    it('should generate unique pairs each time', () => {
      const pair1 = generatePkcePair()
      const pair2 = generatePkcePair()

      expect(pair1.verifier).not.toBe(pair2.verifier)
      expect(pair1.challenge).not.toBe(pair2.challenge)
    })
  })

  describe('RFC 7636 compliance', () => {
    it('should generate verifiers that meet the minimum entropy requirement', () => {
      // RFC 7636 recommends 32 octets of random data
      // Our implementation uses randomBytes(32) which provides this
      const verifier = generateCodeVerifier()

      // 32 bytes encoded as base64url = 43 characters
      expect(verifier.length).toBe(43)
    })

    it('should use S256 method (SHA-256 hash)', () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
      const challenge = generateCodeChallenge(verifier)

      // This is a known test vector - the challenge should be a valid SHA-256 hash
      const manualHash = createHash('sha256').update(verifier).digest('base64url')

      expect(challenge).toBe(manualHash)
    })
  })
})
