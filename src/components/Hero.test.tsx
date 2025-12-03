import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Hero } from './Hero'

// Mock the AuthContext
const mockSignIn = vi.fn()
const mockAuthContext = {
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isMockAuth: false,
  signIn: mockSignIn,
  signOut: vi.fn(),
}

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

describe('Hero component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.isLoading = false
  })

  describe('when rendering hero section', () => {
    it('should display the hero title', () => {
      render(<Hero />)

      expect(screen.getByText('Build the Supabase')).toBeInTheDocument()
      expect(screen.getByText('community.')).toBeInTheDocument()
    })

    it('should display the tagline', () => {
      render(<Hero />)

      expect(screen.getByText('SupaSquad assemble!')).toBeInTheDocument()
    })

    it('should display the description', () => {
      render(<Hero />)

      expect(
        screen.getByText(/Earn prizes and recognition by contributing/)
      ).toBeInTheDocument()
    })

    it('should display login button', () => {
      render(<Hero />)

      expect(
        screen.getByRole('button', { name: /Login with Supabase/i })
      ).toBeInTheDocument()
    })

    it('should display apply link', () => {
      render(<Hero />)

      const link = screen.getByText('Apply to join the SupaSquad')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://supabase.com/community')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('when interacting with login button', () => {
    it('should call signIn when login button is clicked', () => {
      render(<Hero />)

      fireEvent.click(screen.getByRole('button', { name: /Login with Supabase/i }))

      expect(mockSignIn).toHaveBeenCalledTimes(1)
    })

    it('should show loading state when isLoading is true', () => {
      mockAuthContext.isLoading = true
      render(<Hero />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})
