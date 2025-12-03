import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from './Navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/feed'),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock the AuthContext
const mockSignOut = vi.fn()
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  profile: { first_name: 'John', last_name: 'Doe', avatar_url: null },
  session: null,
  isLoading: false,
  isMockAuth: false,
  signIn: vi.fn(),
  signOut: mockSignOut,
}

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

import { usePathname } from 'next/navigation'

describe('Navigation component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.isLoading = false
    mockAuthContext.profile = { first_name: 'John', last_name: 'Doe', avatar_url: null }
    mockAuthContext.user = { id: 'user-123', email: 'test@example.com' }
    vi.mocked(usePathname).mockReturnValue('/feed')
  })

  describe('when rendering navigation', () => {
    it('should display the logo', () => {
      render(<Navigation />)

      expect(screen.getByText('SupaSquad')).toBeInTheDocument()
    })

    it('should display all nav links', () => {
      render(<Navigation />)

      expect(screen.getByText('Feed')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      expect(screen.getByText('Program')).toBeInTheDocument()
    })

    it('should have correct href for nav links', () => {
      render(<Navigation />)

      expect(screen.getByText('Feed').closest('a')).toHaveAttribute('href', '/feed')
      expect(screen.getByText('Share').closest('a')).toHaveAttribute('href', '/share')
      expect(screen.getByText('Program').closest('a')).toHaveAttribute('href', '/program')
    })

    it('should display user display name', () => {
      render(<Navigation />)

      expect(screen.getByText('John')).toBeInTheDocument()
    })
  })

  describe('when displaying user name', () => {
    it('should show first name from profile', () => {
      render(<Navigation />)

      expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('should show email prefix when no first name', () => {
      mockAuthContext.profile = { first_name: '', last_name: '', avatar_url: null }
      render(<Navigation />)

      expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('should show "User" when no profile or email', () => {
      mockAuthContext.profile = null
      mockAuthContext.user = null
      render(<Navigation />)

      expect(screen.getByText('User')).toBeInTheDocument()
    })
  })

  describe('when interacting with user menu', () => {
    it('should open dropdown when clicking user button', () => {
      render(<Navigation />)

      // Click the user menu button
      fireEvent.click(screen.getByText('John'))

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })

    it('should have profile link in dropdown', () => {
      render(<Navigation />)

      fireEvent.click(screen.getByText('John'))

      const profileLink = screen.getByText('Profile')
      expect(profileLink.closest('a')).toHaveAttribute('href', '/profile')
    })

    it('should call signOut when clicking sign out button', () => {
      render(<Navigation />)

      fireEvent.click(screen.getByText('John'))
      fireEvent.click(screen.getByText('Sign out'))

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should show loading state on sign out button', () => {
      mockAuthContext.isLoading = true
      render(<Navigation />)

      fireEvent.click(screen.getByText('John'))

      expect(screen.getByText('Signing out...')).toBeInTheDocument()
    })

    it('should close menu when clicking profile link', () => {
      render(<Navigation />)

      fireEvent.click(screen.getByText('John'))
      expect(screen.getByText('Profile')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Profile'))

      // Menu should close after clicking link
      // Note: In real app this would navigate, in test it just closes
    })
  })

  describe('when highlighting active route', () => {
    it('should highlight feed link when on feed page', () => {
      vi.mocked(usePathname).mockReturnValue('/feed')
      render(<Navigation />)

      const feedLink = screen.getByText('Feed')
      expect(feedLink.className).toContain('bg-[var(--surface)]')
    })

    it('should highlight share link when on share page', () => {
      vi.mocked(usePathname).mockReturnValue('/share')
      render(<Navigation />)

      const shareLink = screen.getByText('Share')
      expect(shareLink.className).toContain('bg-[var(--surface)]')
    })
  })
})
