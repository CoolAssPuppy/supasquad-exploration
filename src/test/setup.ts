import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for tests
// This is a valid 32-byte key encoded as base64 (for testing only)
vi.stubEnv('TOKEN_ENCRYPTION_KEY', 'YfdUj3UGICucVGsORZZm7GhaPtID/pjYjyKHCMyRsKg=')
vi.stubEnv('OAUTH_STATE_SECRET', 'test-oauth-state-secret-for-testing')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock crypto.randomUUID for consistent testing
const mockUUID = vi.fn(() => 'test-uuid-1234-5678-9abc-def012345678')
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: mockUUID,
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  },
})
