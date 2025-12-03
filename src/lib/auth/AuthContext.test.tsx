import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock Supabase client
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignOut = vi.fn()
const mockFrom = vi.fn()

const mockSupabaseClient = {
  auth: {
    getSession: mockGetSession,
    getUser: mockGetUser,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
  },
  from: mockFrom,
}

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Test component that uses the auth context
function TestConsumer() {
  const { user, profile, isLoading, isMockAuth, signIn, signOut } = useAuth()

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user?.email ?? 'no-user'}</span>
      <span data-testid="profile">{profile?.first_name ?? 'no-profile'}</span>
      <span data-testid="mock-auth">{isMockAuth ? 'mock' : 'real'}</span>
      <button onClick={signIn}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
  })

  describe('when initializing', () => {
    it('should start in loading state', async () => {
      // Use a promise that doesn't resolve immediately
      mockGetSession.mockReturnValue(new Promise(() => {}))

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading').textContent).toBe('loading')
    })

    it('should finish loading after initialization', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('ready')
      })
    })

    it('should have no user when session is null', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('no-user')
      })
    })
  })

  describe('when session exists', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
      },
      access_token: 'token',
      refresh_token: 'refresh',
    }

    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      avatar_url: null,
    }

    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      })
    })

    it('should set user from session', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com')
      })
    })

    it('should fetch and set profile', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('profile').textContent).toBe('John')
      })
    })

    it('should not be in mock auth mode', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mock-auth').textContent).toBe('real')
      })
    })
  })

  describe('when using mock auth', () => {
    const mockProfile = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'dev@supasquad.local',
      first_name: 'Mock',
      last_name: 'User',
      avatar_url: null,
    }

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('true')
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      })
    })

    it('should detect mock auth from localStorage', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('mock-auth').textContent).toBe('mock')
      })
    })

    it('should set mock user from localStorage', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('dev@supasquad.local')
      })
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})
