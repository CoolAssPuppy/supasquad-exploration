import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

import { Avatar } from './Avatar'

describe('Avatar component', () => {
  describe('when rendering with image', () => {
    it('should render image when src is provided', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User avatar" />)

      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should have alt text on image', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="John Doe" />)

      expect(screen.getByAltText('John Doe')).toBeInTheDocument()
    })
  })

  describe('when rendering fallback', () => {
    it('should show fallback text when no src is provided', () => {
      render(<Avatar fallback="John Doe" />)

      expect(screen.getByText('JO')).toBeInTheDocument()
    })

    it('should use alt text for fallback when fallback prop is not provided', () => {
      render(<Avatar alt="Jane Smith" />)

      expect(screen.getByText('JA')).toBeInTheDocument()
    })

    it('should show question mark when neither fallback nor alt is provided', () => {
      render(<Avatar />)

      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('should uppercase fallback text', () => {
      render(<Avatar fallback="test user" />)

      expect(screen.getByText('TE')).toBeInTheDocument()
    })

    it('should handle single character fallback', () => {
      render(<Avatar fallback="A" />)

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('when using different sizes', () => {
    it('should apply small size', () => {
      const { container } = render(<Avatar size="sm" fallback="T" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar.className).toContain('h-8')
      expect(avatar.className).toContain('w-8')
    })

    it('should apply medium size by default', () => {
      const { container } = render(<Avatar fallback="T" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar.className).toContain('h-10')
      expect(avatar.className).toContain('w-10')
    })

    it('should apply large size', () => {
      const { container } = render(<Avatar size="lg" fallback="T" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar.className).toContain('h-12')
      expect(avatar.className).toContain('w-12')
    })

    it('should apply xlarge size', () => {
      const { container } = render(<Avatar size="xl" fallback="T" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar.className).toContain('h-16')
      expect(avatar.className).toContain('w-16')
    })
  })

  describe('when passing additional props', () => {
    it('should accept custom className', () => {
      const { container } = render(<Avatar className="custom-avatar" fallback="T" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar.className).toContain('custom-avatar')
    })

    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<Avatar ref={ref} fallback="T" />)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should have rounded-full class', () => {
      const { container } = render(<Avatar fallback="T" />)

      const avatar = container.firstChild as HTMLElement
      expect(avatar.className).toContain('rounded-full')
    })
  })

  describe('when src is null', () => {
    it('should render fallback for null src', () => {
      render(<Avatar src={null} fallback="Test" />)

      expect(screen.getByText('TE')).toBeInTheDocument()
    })
  })
})
