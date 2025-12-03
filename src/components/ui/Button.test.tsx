import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button component', () => {
  describe('when rendering with default props', () => {
    it('should render children text', () => {
      render(<Button>Click me</Button>)

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should have primary variant by default', () => {
      render(<Button>Primary</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-[var(--brand)]')
    })

    it('should have medium size by default', () => {
      render(<Button>Medium</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('h-[38px]')
    })
  })

  describe('when handling click events', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      fireEvent.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )

      fireEvent.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} isLoading>
          Loading
        </Button>
      )

      fireEvent.click(screen.getByRole('button'))

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('when in loading state', () => {
    it('should show loading spinner and text', () => {
      render(<Button isLoading>Submit</Button>)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should not show children when loading', () => {
      render(<Button isLoading>Submit</Button>)

      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('should be disabled when loading', () => {
      render(<Button isLoading>Submit</Button>)

      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('when using different variants', () => {
    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Delete</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-[var(--destructive-400)]')
    })

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-transparent')
      expect(button.className).toContain('border-[var(--border-strong)]')
    })

    it('should apply warning variant styles', () => {
      render(<Button variant="warning">Warning</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-[var(--warning-400)]')
    })

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-[var(--foreground)]')
    })
  })

  describe('when using different sizes', () => {
    it('should apply tiny size', () => {
      render(<Button size="tiny">Tiny</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('h-[26px]')
    })

    it('should apply small size', () => {
      render(<Button size="small">Small</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('h-[34px]')
    })

    it('should apply large size', () => {
      render(<Button size="large">Large</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('h-[42px]')
    })

    it('should apply xlarge size', () => {
      render(<Button size="xlarge">XLarge</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('h-[50px]')
    })
  })

  describe('when disabled', () => {
    it('should have disabled attribute', () => {
      render(<Button disabled>Disabled</Button>)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('disabled:opacity-50')
    })
  })

  describe('when passing additional props', () => {
    it('should forward ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null }
      render(<Button ref={ref}>Ref Button</Button>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('custom-class')
    })

    it('should forward type attribute', () => {
      render(<Button type="submit">Submit</Button>)

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })
})
