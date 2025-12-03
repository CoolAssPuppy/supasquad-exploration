import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from './Select'

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

describe('Select component', () => {
  describe('when rendering with options', () => {
    it('should render a select element', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render all options', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('should have correct option values', () => {
      render(<Select options={defaultOptions} />)

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveValue('option1')
      expect(options[1]).toHaveValue('option2')
      expect(options[2]).toHaveValue('option3')
    })

    it('should forward ref to select element', () => {
      const ref = { current: null as HTMLSelectElement | null }
      render(<Select ref={ref} options={defaultOptions} />)

      expect(ref.current).toBeInstanceOf(HTMLSelectElement)
    })
  })

  describe('when rendering with label', () => {
    it('should display the label text', () => {
      render(<Select label="Country" id="country" options={defaultOptions} />)

      expect(screen.getByText('Country')).toBeInTheDocument()
    })

    it('should associate label with select via htmlFor', () => {
      render(<Select label="Country" id="country" options={defaultOptions} />)

      const label = screen.getByText('Country')
      expect(label).toHaveAttribute('for', 'country')
    })

    it('should not render label when not provided', () => {
      render(<Select options={defaultOptions} />)

      expect(screen.queryByRole('label')).not.toBeInTheDocument()
    })
  })

  describe('when rendering with error', () => {
    it('should display error message', () => {
      render(<Select options={defaultOptions} error="Please select an option" />)

      expect(screen.getByText('Please select an option')).toBeInTheDocument()
    })

    it('should apply error styles to select', () => {
      render(<Select options={defaultOptions} error="Invalid" />)

      const select = screen.getByRole('combobox')
      expect(select.className).toContain('border-[var(--destructive)]')
    })
  })

  describe('when handling user interactions', () => {
    it('should call onChange when selection changes', () => {
      const handleChange = vi.fn()
      render(<Select options={defaultOptions} onChange={handleChange} />)

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'option2' } })

      expect(handleChange).toHaveBeenCalled()
    })

    it('should update selected value', () => {
      render(<Select options={defaultOptions} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'option2' } })

      expect(select).toHaveValue('option2')
    })
  })

  describe('when disabled', () => {
    it('should have disabled attribute', () => {
      render(<Select options={defaultOptions} disabled />)

      expect(screen.getByRole('combobox')).toBeDisabled()
    })
  })

  describe('when passing additional props', () => {
    it('should accept custom className', () => {
      render(<Select options={defaultOptions} className="custom-select" />)

      const select = screen.getByRole('combobox')
      expect(select.className).toContain('custom-select')
    })

    it('should accept defaultValue', () => {
      render(<Select options={defaultOptions} defaultValue="option2" />)

      expect(screen.getByRole('combobox')).toHaveValue('option2')
    })
  })
})
