import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const ENCODING = 'base64' as const

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
  }
  // Key should be 32 bytes (256 bits) for AES-256
  const keyBuffer = Buffer.from(key, 'base64')
  if (keyBuffer.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte base64-encoded string')
  }
  return keyBuffer
}

function getSigningKey(): Buffer {
  const key = process.env.OAUTH_STATE_SECRET
  if (!key) {
    throw new Error('OAUTH_STATE_SECRET environment variable is required')
  }
  return Buffer.from(key, 'utf-8')
}

/**
 * Encrypts a token using AES-256-GCM
 * Returns a base64 string containing: IV + AuthTag + Ciphertext
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const authTag = cipher.getAuthTag()

  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])

  return combined.toString(ENCODING)
}

/**
 * Decrypts a token that was encrypted with encryptToken
 */
export function decryptToken(encryptedData: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, ENCODING)

  // Extract IV, AuthTag, and Ciphertext
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Creates an HMAC signature for data
 */
export function signData(data: string): string {
  const key = getSigningKey()
  return createHmac('sha256', key).update(data).digest('base64url')
}

/**
 * Verifies an HMAC signature
 */
export function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = signData(data)
  // Use timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
  }
  return result === 0
}

/**
 * Encrypts token with production enforcement
 * In production: Throws if encryption key is not set
 * In development: Falls back to plaintext with warning
 */
export function encryptTokenSafe(plaintext: string): string {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY is required in production. ' +
          'Generate one with: openssl rand -base64 32'
      )
    }
    console.warn('[DEV] TOKEN_ENCRYPTION_KEY not set - tokens will be stored unencrypted')
    return plaintext
  }
  return encryptToken(plaintext)
}

/**
 * Decrypts token only if it was encrypted
 * Handles both encrypted and plaintext tokens for migration
 */
export function decryptTokenSafe(data: string): string {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    return data
  }

  try {
    return decryptToken(data)
  } catch {
    // Token might be plaintext (pre-migration), return as-is
    console.warn('Failed to decrypt token - may be plaintext from before encryption was enabled')
    return data
  }
}
