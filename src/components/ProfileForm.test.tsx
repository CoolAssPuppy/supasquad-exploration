import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileForm } from './ProfileForm'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock Supabase client
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()

const mockSupabaseClient = {
  from: vi.fn(() => ({
    update: mockUpdate.mockReturnValue({
      eq: mockEq,
    }),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  },
}

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  profile: {
    first_name: 'John',
    last_name: 'Doe',
    city: 'New York',
    country: 'USA',
    avatar_url: null,
  },
  session: null,
  isLoading: false,
  isMockAuth: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

describe('ProfileForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.user = { id: 'user-123', email: 'test@example.com' }
    mockAuthContext.profile = {
      first_name: 'John',
      last_name: 'Doe',
      city: 'New York',
      country: 'USA',
      avatar_url: null,
    }
    mockAuthContext.isMockAuth = false
    mockEq.mockResolvedValue({ data: null, error: null })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/avatar.jpg' },
    })
  })

  describe('when rendering the form', () => {
    it('should display form header', () => {
      render(<ProfileForm />)

      expect(screen.getByText('Profile settings')).toBeInTheDocument()
    })

    it('should display form description', () => {
      render(<ProfileForm />)

      expect(screen.getByText('Update your profile information')).toBeInTheDocument()
    })

    it('should display avatar', () => {
      render(<ProfileForm />)

      expect(screen.getByText('JO')).toBeInTheDocument() // Fallback initials
    })

    it('should display upload avatar button', () => {
      render(<ProfileForm />)

      expect(screen.getByText('Upload avatar')).toBeInTheDocument()
    })

    it('should display disabled email input', () => {
      render(<ProfileForm />)

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveValue('test@example.com')
      expect(emailInput).toBeDisabled()
    })

    it('should display first name input with profile value', () => {
      render(<ProfileForm />)

      expect(screen.getByLabelText('First name')).toHaveValue('John')
    })

    it('should display last name input with profile value', () => {
      render(<ProfileForm />)

      expect(screen.getByLabelText('Last name')).toHaveValue('Doe')
    })

    it('should display city input with profile value', () => {
      render(<ProfileForm />)

      expect(screen.getByLabelText('City')).toHaveValue('New York')
    })

    it('should display country input with profile value', () => {
      render(<ProfileForm />)

      expect(screen.getByLabelText('Country')).toHaveValue('USA')
    })

    it('should display save button', () => {
      render(<ProfileForm />)

      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    })
  })

  describe('when updating form fields', () => {
    it('should update first name value', () => {
      render(<ProfileForm />)

      const input = screen.getByLabelText('First name')
      fireEvent.change(input, { target: { value: 'Jane' } })

      expect(input).toHaveValue('Jane')
    })

    it('should update last name value', () => {
      render(<ProfileForm />)

      const input = screen.getByLabelText('Last name')
      fireEvent.change(input, { target: { value: 'Smith' } })

      expect(input).toHaveValue('Smith')
    })

    it('should update city value', () => {
      render(<ProfileForm />)

      const input = screen.getByLabelText('City')
      fireEvent.change(input, { target: { value: 'Los Angeles' } })

      expect(input).toHaveValue('Los Angeles')
    })

    it('should update country value', () => {
      render(<ProfileForm />)

      const input = screen.getByLabelText('Country')
      fireEvent.change(input, { target: { value: 'UK' } })

      expect(input).toHaveValue('UK')
    })
  })

  describe('when submitting the form', () => {
    it('should call Supabase update with correct data', async () => {
      render(<ProfileForm />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
        expect(mockUpdate).toHaveBeenCalled()
        expect(mockEq).toHaveBeenCalledWith('id', 'user-123')
      })
    })

    it('should show success message on successful update', async () => {
      render(<ProfileForm />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
    })

    it('should show error message on failed update', async () => {
      mockEq.mockRejectedValue(new Error('Update failed'))

      render(<ProfileForm />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })
    })

    it('should show error when user not logged in', async () => {
      mockAuthContext.user = null

      render(<ProfileForm />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => {
        expect(
          screen.getByText('You must be logged in to update your profile')
        ).toBeInTheDocument()
      })
    })
  })

  describe('when in mock auth mode', () => {
    it('should show mock success message without calling Supabase', async () => {
      mockAuthContext.isMockAuth = true

      render(<ProfileForm />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

      await waitFor(() => {
        expect(
          screen.getByText('Profile updated successfully! (Mock mode)')
        ).toBeInTheDocument()
        expect(mockUpdate).not.toHaveBeenCalled()
      })
    })
  })

  describe('when profile is null', () => {
    it('should show empty form fields', () => {
      mockAuthContext.profile = null

      render(<ProfileForm />)

      expect(screen.getByLabelText('First name')).toHaveValue('')
      expect(screen.getByLabelText('Last name')).toHaveValue('')
      expect(screen.getByLabelText('City')).toHaveValue('')
      expect(screen.getByLabelText('Country')).toHaveValue('')
    })
  })

  describe('when using email as fallback display name', () => {
    it('should use email prefix when first name is empty', () => {
      mockAuthContext.profile = {
        first_name: '',
        last_name: '',
        city: '',
        country: '',
        avatar_url: null,
      }

      render(<ProfileForm />)

      // Avatar should show 'TE' from 'test' (email prefix)
      expect(screen.getByText('TE')).toBeInTheDocument()
    })
  })
})
