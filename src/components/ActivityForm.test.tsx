import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActivityForm } from './ActivityForm'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Supabase client
const mockInsert = vi.fn()
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: mockInsert,
  })),
}

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  profile: { first_name: 'John', last_name: 'Doe', avatar_url: null },
  session: null,
  isLoading: false,
  isMockAuth: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock window.alert
const mockAlert = vi.fn()
vi.stubGlobal('alert', mockAlert)

describe('ActivityForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.user = { id: 'user-123', email: 'test@example.com' }
    mockAuthContext.isMockAuth = false
    mockInsert.mockResolvedValue({ data: null, error: null })
  })

  describe('when rendering the form', () => {
    it('should display the form header', () => {
      render(<ActivityForm />)

      expect(screen.getByText('Manual submission')).toBeInTheDocument()
    })

    it('should display custom header when provided', () => {
      render(<ActivityForm header="Custom Header" />)

      expect(screen.getByText('Custom Header')).toBeInTheDocument()
    })

    it('should display activity type selector', () => {
      render(<ActivityForm />)

      expect(screen.getByLabelText('Activity type')).toBeInTheDocument()
    })

    it('should display title input', () => {
      render(<ActivityForm />)

      expect(screen.getByLabelText('Title')).toBeInTheDocument()
    })

    it('should display description textarea', () => {
      render(<ActivityForm />)

      expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    })

    it('should display submit button with points', () => {
      render(<ActivityForm />)

      expect(screen.getByRole('button', { name: /Submit activity/ })).toBeInTheDocument()
    })

    it('should display cancel button when onCancel provided', () => {
      const onCancel = vi.fn()
      render(<ActivityForm onCancel={onCancel} />)

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should display custom submit label when provided', () => {
      render(<ActivityForm submitLabel="Save Activity" />)

      expect(screen.getByRole('button', { name: 'Save Activity' })).toBeInTheDocument()
    })
  })

  describe('when selecting different activity types', () => {
    it('should show URL field for blog post', () => {
      render(<ActivityForm />)

      // Blog post is default and requires URL
      expect(screen.getByLabelText('URL')).toBeInTheDocument()
    })

    it('should show event fields for conference talk', async () => {
      render(<ActivityForm />)

      const select = screen.getByLabelText('Activity type')
      fireEvent.change(select, { target: { value: 'conference_talk' } })

      await waitFor(() => {
        expect(screen.getByLabelText('Event name')).toBeInTheDocument()
        expect(screen.getByLabelText('Event date')).toBeInTheDocument()
      })
    })

    it('should show platform field for community answers', async () => {
      render(<ActivityForm />)

      const select = screen.getByLabelText('Activity type')
      fireEvent.change(select, { target: { value: 'community_answers' } })

      await waitFor(() => {
        expect(screen.getByLabelText('Platform')).toBeInTheDocument()
        expect(screen.getByLabelText('Number of answers')).toBeInTheDocument()
      })
    })
  })

  describe('when filling out the form', () => {
    it('should update title value', () => {
      render(<ActivityForm />)

      const titleInput = screen.getByLabelText('Title')
      fireEvent.change(titleInput, { target: { value: 'My Blog Post' } })

      expect(titleInput).toHaveValue('My Blog Post')
    })

    it('should update URL value', () => {
      render(<ActivityForm />)

      const urlInput = screen.getByLabelText('URL')
      fireEvent.change(urlInput, { target: { value: 'https://example.com/post' } })

      expect(urlInput).toHaveValue('https://example.com/post')
    })

    it('should toggle amplification checkbox', () => {
      render(<ActivityForm />)

      const checkbox = screen.getByLabelText(/Request community amplification/)
      expect(checkbox).not.toBeChecked()

      fireEvent.click(checkbox)

      expect(checkbox).toBeChecked()
    })

    it('should show amplification URL input when checkbox is checked', () => {
      render(<ActivityForm />)

      const checkbox = screen.getByLabelText(/Request community amplification/)
      fireEvent.click(checkbox)

      expect(screen.getByLabelText(/Content URL to amplify/)).toBeInTheDocument()
    })
  })

  describe('when submitting the form', () => {
    const fillRequiredFields = () => {
      const titleInput = screen.getByLabelText('Title')
      fireEvent.change(titleInput, { target: { value: 'Test Blog Post' } })

      const urlInput = screen.getByLabelText('URL')
      fireEvent.change(urlInput, { target: { value: 'https://example.com/blog' } })
    }

    it('should submit to Supabase with correct data', async () => {
      render(<ActivityForm />)

      fillRequiredFields()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('activities')
        expect(mockInsert).toHaveBeenCalled()
      })
    })

    it('should redirect to feed on success', async () => {
      render(<ActivityForm />)

      fillRequiredFields()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/feed')
      })
    })

    it('should call onSuccess callback when provided', async () => {
      const onSuccess = vi.fn()
      render(<ActivityForm onSuccess={onSuccess} />)

      fillRequiredFields()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should show error when submission fails', async () => {
      mockInsert.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      render(<ActivityForm />)

      fillRequiredFields()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Component throws non-Error objects with fallback message
        expect(screen.getByText('Failed to submit activity')).toBeInTheDocument()
      })
    })

    it('should show error when user is not logged in', async () => {
      mockAuthContext.user = null

      render(<ActivityForm />)

      fillRequiredFields()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('You must be logged in to submit an activity')).toBeInTheDocument()
      })
    })
  })

  describe('when in mock auth mode', () => {
    const fillRequiredFieldsForMock = () => {
      const titleInput = screen.getByLabelText('Title')
      fireEvent.change(titleInput, { target: { value: 'Test Blog Post' } })

      const urlInput = screen.getByLabelText('URL')
      fireEvent.change(urlInput, { target: { value: 'https://example.com/blog' } })
    }

    it('should show alert and not call Supabase', async () => {
      mockAuthContext.isMockAuth = true

      render(<ActivityForm />)

      fillRequiredFieldsForMock()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Activity submitted successfully! (Mock mode)')
        expect(mockPush).toHaveBeenCalledWith('/feed')
        expect(mockInsert).not.toHaveBeenCalled()
      })
    })

    it('should call onSuccess instead of alert when provided', async () => {
      mockAuthContext.isMockAuth = true
      const onSuccess = vi.fn()

      render(<ActivityForm onSuccess={onSuccess} />)

      fillRequiredFieldsForMock()

      const submitButton = screen.getByRole('button', { name: /Submit activity/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        expect(mockAlert).not.toHaveBeenCalled()
      })
    })
  })

  describe('when using cancel button', () => {
    it('should call onCancel when clicked', () => {
      const onCancel = vi.fn()
      render(<ActivityForm onCancel={onCancel} />)

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('when using initial values', () => {
    it('should populate form with initial values', () => {
      render(
        <ActivityForm
          initialValues={{
            activityType: 'blog_post',
            title: 'Existing Post',
            url: 'https://example.com/existing',
          }}
        />
      )

      expect(screen.getByLabelText('Title')).toHaveValue('Existing Post')
      expect(screen.getByLabelText('URL')).toHaveValue('https://example.com/existing')
    })
  })
})
