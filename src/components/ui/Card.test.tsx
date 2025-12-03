import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardContent, CardFooter } from './Card'

describe('Card component', () => {
  describe('Card', () => {
    it('should render children content', () => {
      render(<Card>Card content</Card>)

      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply base styles', () => {
      render(<Card>Content</Card>)

      const card = screen.getByText('Content')
      expect(card.className).toContain('bg-[var(--surface)]')
      expect(card.className).toContain('border')
      expect(card.className).toContain('rounded-lg')
    })

    it('should accept custom className', () => {
      render(<Card className="custom-card">Content</Card>)

      const card = screen.getByText('Content')
      expect(card.className).toContain('custom-card')
    })

    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<Card ref={ref}>Content</Card>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('should pass through additional props', () => {
      render(<Card data-testid="test-card">Content</Card>)

      expect(screen.getByTestId('test-card')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('should render children content', () => {
      render(<CardHeader>Header content</CardHeader>)

      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should have padding and border-bottom styles', () => {
      render(<CardHeader>Header</CardHeader>)

      const header = screen.getByText('Header')
      expect(header.className).toContain('p-4')
      expect(header.className).toContain('border-b')
    })

    it('should accept custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>)

      const header = screen.getByText('Header')
      expect(header.className).toContain('custom-header')
    })

    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<CardHeader ref={ref}>Header</CardHeader>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardContent', () => {
    it('should render children content', () => {
      render(<CardContent>Body content</CardContent>)

      expect(screen.getByText('Body content')).toBeInTheDocument()
    })

    it('should have padding styles', () => {
      render(<CardContent>Body</CardContent>)

      const content = screen.getByText('Body')
      expect(content.className).toContain('p-4')
    })

    it('should accept custom className', () => {
      render(<CardContent className="custom-content">Body</CardContent>)

      const content = screen.getByText('Body')
      expect(content.className).toContain('custom-content')
    })

    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<CardContent ref={ref}>Body</CardContent>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardFooter', () => {
    it('should render children content', () => {
      render(<CardFooter>Footer content</CardFooter>)

      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should have padding and border-top styles', () => {
      render(<CardFooter>Footer</CardFooter>)

      const footer = screen.getByText('Footer')
      expect(footer.className).toContain('p-4')
      expect(footer.className).toContain('border-t')
    })

    it('should accept custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>)

      const footer = screen.getByText('Footer')
      expect(footer.className).toContain('custom-footer')
    })

    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<CardFooter ref={ref}>Footer</CardFooter>)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('Card composition', () => {
    it('should render complete card with header, content, and footer', () => {
      render(
        <Card>
          <CardHeader>Title</CardHeader>
          <CardContent>Main content here</CardContent>
          <CardFooter>Actions</CardFooter>
        </Card>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Main content here')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })
})
