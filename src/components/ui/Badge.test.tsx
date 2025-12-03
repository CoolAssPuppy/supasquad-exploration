import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge component', () => {
  describe('when rendering with default props', () => {
    it('should render children text', () => {
      render(<Badge>New</Badge>)

      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('should have default variant by default', () => {
      render(<Badge>Default</Badge>)

      const badge = screen.getByText('Default')
      expect(badge.className).toContain('bg-[var(--surface)]')
    })
  })

  describe('when using different variants', () => {
    it('should apply brand variant styles', () => {
      render(<Badge variant="brand">Brand</Badge>)

      const badge = screen.getByText('Brand')
      expect(badge.className).toContain('bg-[var(--brand)]/10')
      expect(badge.className).toContain('text-[var(--brand)]')
    })

    it('should apply success variant styles', () => {
      render(<Badge variant="success">Success</Badge>)

      const badge = screen.getByText('Success')
      expect(badge.className).toContain('bg-[var(--success)]/10')
      expect(badge.className).toContain('text-[var(--success)]')
    })

    it('should apply warning variant styles', () => {
      render(<Badge variant="warning">Warning</Badge>)

      const badge = screen.getByText('Warning')
      expect(badge.className).toContain('bg-[var(--warning)]/10')
      expect(badge.className).toContain('text-[var(--warning)]')
    })

    it('should apply destructive variant styles', () => {
      render(<Badge variant="destructive">Error</Badge>)

      const badge = screen.getByText('Error')
      expect(badge.className).toContain('bg-[var(--destructive)]/10')
      expect(badge.className).toContain('text-[var(--destructive)]')
    })
  })

  describe('when passing additional props', () => {
    it('should apply custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>)

      const badge = screen.getByText('Custom')
      expect(badge.className).toContain('custom-badge')
    })

    it('should forward ref to span element', () => {
      const ref = { current: null as HTMLSpanElement | null }
      render(<Badge ref={ref}>Ref Badge</Badge>)

      expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    })

    it('should pass through additional HTML attributes', () => {
      render(<Badge data-testid="test-badge">Test</Badge>)

      expect(screen.getByTestId('test-badge')).toBeInTheDocument()
    })
  })

  describe('styling properties', () => {
    it('should have rounded-full class for pill shape', () => {
      render(<Badge>Pill</Badge>)

      const badge = screen.getByText('Pill')
      expect(badge.className).toContain('rounded-full')
    })

    it('should have border class', () => {
      render(<Badge>Bordered</Badge>)

      const badge = screen.getByText('Bordered')
      expect(badge.className).toContain('border')
    })

    it('should have small text size', () => {
      render(<Badge>Small</Badge>)

      const badge = screen.getByText('Small')
      expect(badge.className).toContain('text-xs')
    })
  })
})
