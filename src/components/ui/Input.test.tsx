import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'

describe('Input component', () => {
  describe('when rendering with default props', () => {
    it('should render an input element', () => {
      render(<Input />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should forward ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null }
      render(<Input ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })
  })

  describe('when rendering with label', () => {
    it('should display the label text', () => {
      render(<Input label="Email" id="email" />)

      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should associate label with input via htmlFor', () => {
      render(<Input label="Email" id="email" />)

      const label = screen.getByText('Email')
      expect(label).toHaveAttribute('for', 'email')
    })

    it('should not render label when not provided', () => {
      render(<Input id="email" />)

      expect(screen.queryByRole('label')).not.toBeInTheDocument()
    })
  })

  describe('when rendering with error', () => {
    it('should display error message', () => {
      render(<Input error="This field is required" />)

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('should apply error styles to input', () => {
      render(<Input error="Invalid" />)

      const input = screen.getByRole('textbox')
      expect(input.className).toContain('border-[var(--destructive)]')
    })

    it('should not render error when not provided', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input.className).not.toContain('border-[var(--destructive)]')
    })
  })

  describe('when handling user interactions', () => {
    it('should call onChange when value changes', () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })

      expect(handleChange).toHaveBeenCalled()
    })

    it('should update value when typing', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'hello' } })

      expect(input).toHaveValue('hello')
    })

    it('should call onBlur when focus is lost', () => {
      const handleBlur = vi.fn()
      render(<Input onBlur={handleBlur} />)

      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      fireEvent.blur(input)

      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('when disabled', () => {
    it('should have disabled attribute', () => {
      render(<Input disabled />)

      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('when passing input attributes', () => {
    it('should accept placeholder', () => {
      render(<Input placeholder="Enter email" />)

      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
    })

    it('should accept type attribute', () => {
      const { container } = render(<Input type="password" />)

      const input = container.querySelector('input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should accept custom className', () => {
      render(<Input className="custom-class" />)

      const input = screen.getByRole('textbox')
      expect(input.className).toContain('custom-class')
    })
  })
})
