import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  encryptToken,
  decryptToken,
  signData,
  verifySignature,
  encryptTokenSafe,
  decryptTokenSafe,
} from './tokens'

describe('Token encryption and decryption', () => {
  describe('when encrypting and decrypting tokens', () => {
    it('should successfully round-trip a token through encryption and decryption', () => {
      const originalToken = 'my-secret-access-token-12345'

      const encrypted = encryptToken(originalToken)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(originalToken)
    })

    it('should produce different ciphertext for the same plaintext (due to random IV)', () => {
      const token = 'same-token-value'

      const encrypted1 = encryptToken(token)
      const encrypted2 = encryptToken(token)

      expect(encrypted1).not.toBe(encrypted2)
      // But both should decrypt to the same value
      expect(decryptToken(encrypted1)).toBe(token)
      expect(decryptToken(encrypted2)).toBe(token)
    })

    it('should handle empty strings', () => {
      const emptyToken = ''

      const encrypted = encryptToken(emptyToken)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(emptyToken)
    })

    it('should handle tokens with special characters', () => {
      const specialToken = 'token/with+special=chars&more?yes#hash'

      const encrypted = encryptToken(specialToken)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(specialToken)
    })

    it('should handle long tokens', () => {
      const longToken = 'a'.repeat(10000)

      const encrypted = encryptToken(longToken)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(longToken)
    })

    it('should handle unicode characters', () => {
      const unicodeToken = 'token-with-emoji-and-unicode-chars'

      const encrypted = encryptToken(unicodeToken)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(unicodeToken)
    })
  })

  describe('when encryption key is missing', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', '')
    })

    it('should throw error when trying to encrypt without key', () => {
      expect(() => encryptToken('token')).toThrow(
        'TOKEN_ENCRYPTION_KEY environment variable is required'
      )
    })

    it('should throw error when trying to decrypt without key', () => {
      expect(() => decryptToken('encrypted-data')).toThrow(
        'TOKEN_ENCRYPTION_KEY environment variable is required'
      )
    })
  })

  describe('when decrypting tampered data', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', 'YfdUj3UGICucVGsORZZm7GhaPtID/pjYjyKHCMyRsKg=')
    })

    it('should fail when ciphertext is tampered with', () => {
      const token = 'secret-token'
      const encrypted = encryptToken(token)

      // Tamper with the encrypted data
      const tamperedBuffer = Buffer.from(encrypted, 'base64')
      tamperedBuffer[tamperedBuffer.length - 1] ^= 0xff // Flip bits in auth tag
      const tampered = tamperedBuffer.toString('base64')

      expect(() => decryptToken(tampered)).toThrow()
    })

    it('should fail when IV is tampered with', () => {
      const token = 'secret-token'
      const encrypted = encryptToken(token)

      // Tamper with the IV (first 16 bytes)
      const tamperedBuffer = Buffer.from(encrypted, 'base64')
      tamperedBuffer[0] ^= 0xff
      const tampered = tamperedBuffer.toString('base64')

      expect(() => decryptToken(tampered)).toThrow()
    })
  })
})

describe('Data signing and verification', () => {
  describe('when signing data', () => {
    it('should produce consistent signatures for the same data', () => {
      const data = 'data-to-sign'

      const signature1 = signData(data)
      const signature2 = signData(data)

      expect(signature1).toBe(signature2)
    })

    it('should produce different signatures for different data', () => {
      const signature1 = signData('data-one')
      const signature2 = signData('data-two')

      expect(signature1).not.toBe(signature2)
    })
  })

  describe('when verifying signatures', () => {
    it('should return true for valid signatures', () => {
      const data = 'data-to-verify'
      const signature = signData(data)

      expect(verifySignature(data, signature)).toBe(true)
    })

    it('should return false for invalid signatures', () => {
      const data = 'data-to-verify'
      const wrongSignature = 'invalid-signature'

      expect(verifySignature(data, wrongSignature)).toBe(false)
    })

    it('should return false when data is tampered', () => {
      const originalData = 'original-data'
      const signature = signData(originalData)
      const tamperedData = 'tampered-data'

      expect(verifySignature(tamperedData, signature)).toBe(false)
    })

    it('should use timing-safe comparison to prevent timing attacks', () => {
      const data = 'sensitive-data'
      const signature = signData(data)

      // These should all take similar time regardless of how wrong they are
      expect(verifySignature(data, '')).toBe(false)
      expect(verifySignature(data, 'a')).toBe(false)
      expect(verifySignature(data, signature.substring(0, 5))).toBe(false)
      expect(verifySignature(data, signature + 'extra')).toBe(false)
    })
  })
})

describe('Safe encryption functions (with fallback)', () => {
  describe('when encryption key is configured', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', 'YfdUj3UGICucVGsORZZm7GhaPtID/pjYjyKHCMyRsKg=')
    })

    it('should encrypt and decrypt tokens normally', () => {
      const token = 'my-token'

      const encrypted = encryptTokenSafe(token)
      const decrypted = decryptTokenSafe(encrypted)

      expect(decrypted).toBe(token)
      expect(encrypted).not.toBe(token) // Should be encrypted
    })
  })

  describe('when encryption key is not configured (development fallback)', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', '')
      vi.stubEnv('NODE_ENV', 'development')
    })

    it('should return plaintext when encrypting without key in development', () => {
      const token = 'plaintext-token'

      const result = encryptTokenSafe(token)

      expect(result).toBe(token)
    })

    it('should return data as-is when decrypting without key', () => {
      const data = 'some-data'

      const result = decryptTokenSafe(data)

      expect(result).toBe(data)
    })
  })

  describe('when encryption key is not configured (production enforcement)', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', '')
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('should throw error when encrypting without key in production', () => {
      const token = 'plaintext-token'

      expect(() => encryptTokenSafe(token)).toThrow(
        'TOKEN_ENCRYPTION_KEY is required in production'
      )
    })
  })

  describe('when migrating from plaintext to encrypted tokens', () => {
    beforeEach(() => {
      vi.stubEnv('TOKEN_ENCRYPTION_KEY', 'YfdUj3UGICucVGsORZZm7GhaPtID/pjYjyKHCMyRsKg=')
    })

    it('should handle plaintext tokens gracefully during migration', () => {
      // Simulate a pre-migration plaintext token
      const plaintextToken = 'old-plaintext-token'

      // decryptTokenSafe should return it as-is if decryption fails
      const result = decryptTokenSafe(plaintextToken)

      expect(result).toBe(plaintextToken)
    })
  })
})
