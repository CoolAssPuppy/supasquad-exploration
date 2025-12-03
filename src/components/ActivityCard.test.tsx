import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityCard } from './ActivityCard'
import { createActivity, createProfile } from '@/test/factories'

function createActivityWithProfile(activityOverrides = {}, profileOverrides = {}) {
  const profile = createProfile(profileOverrides)
  const activity = createActivity({ user_id: profile.id, ...activityOverrides })
  return {
    ...activity,
    profiles: profile,
  }
}

describe('ActivityCard component', () => {
  describe('when rendering user information', () => {
    it('should display full name when first_name is available', () => {
      const activity = createActivityWithProfile(
        {},
        { first_name: 'John', last_name: 'Doe' }
      )

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display email prefix when first_name is not available', () => {
      const activity = createActivityWithProfile(
        {},
        { first_name: '', last_name: '', email: 'testuser@example.com' }
      )

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should display first name only when last_name is empty', () => {
      const activity = createActivityWithProfile(
        {},
        { first_name: 'Alice', last_name: '' }
      )

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText(/Alice/)).toBeInTheDocument()
    })
  })

  describe('when rendering activity details', () => {
    it('should display activity title', () => {
      const activity = createActivityWithProfile({ title: 'My Amazing Blog Post' })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('My Amazing Blog Post')).toBeInTheDocument()
    })

    it('should display activity description when provided', () => {
      const activity = createActivityWithProfile({
        description: 'This is a detailed description of the activity',
      })

      render(<ActivityCard activity={activity} />)

      expect(
        screen.getByText('This is a detailed description of the activity')
      ).toBeInTheDocument()
    })

    it('should not render description when not provided', () => {
      const activity = createActivityWithProfile({ description: null })

      render(<ActivityCard activity={activity} />)

      // Verify the description container is not present
      const paragraphs = screen.queryAllByText(/./i)
      expect(paragraphs.every((p) => !p.classList.contains('line-clamp-2'))).toBe(true)
    })

    it('should display points with plus sign', () => {
      const activity = createActivityWithProfile({ points: 75 })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('+75 pts')).toBeInTheDocument()
    })

    it('should display activity type badge', () => {
      const activity = createActivityWithProfile({ activity_type: 'blog_post' })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('Published a blog post')).toBeInTheDocument()
    })
  })

  describe('when rendering optional fields', () => {
    it('should display URL link when provided', () => {
      const activity = createActivityWithProfile({
        url: 'https://example.com/blog-post',
      })

      render(<ActivityCard activity={activity} />)

      const link = screen.getByText('View link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/blog-post')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should not display URL link when not provided', () => {
      const activity = createActivityWithProfile({ url: null })

      render(<ActivityCard activity={activity} />)

      expect(screen.queryByText('View link')).not.toBeInTheDocument()
    })

    it('should display event name when provided', () => {
      const activity = createActivityWithProfile({ event_name: 'React Conference 2024' })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('React Conference 2024')).toBeInTheDocument()
    })

    it('should display location when provided', () => {
      const activity = createActivityWithProfile({ location: 'San Francisco, CA' })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })
  })

  describe('when rendering amplification request', () => {
    it('should display amplification link when requested', () => {
      const activity = createActivityWithProfile({
        request_amplification: true,
        amplification_url: 'https://twitter.com/user/status/123',
      })

      render(<ActivityCard activity={activity} />)

      const amplifyLink = screen.getByText('Please Amplify')
      expect(amplifyLink).toBeInTheDocument()
      expect(amplifyLink.closest('a')).toHaveAttribute(
        'href',
        'https://twitter.com/user/status/123'
      )
    })

    it('should not display amplification when not requested', () => {
      const activity = createActivityWithProfile({
        request_amplification: false,
        amplification_url: 'https://twitter.com/user/status/123',
      })

      render(<ActivityCard activity={activity} />)

      expect(screen.queryByText('Please Amplify')).not.toBeInTheDocument()
    })

    it('should not display amplification when URL is missing', () => {
      const activity = createActivityWithProfile({
        request_amplification: true,
        amplification_url: null,
      })

      render(<ActivityCard activity={activity} />)

      expect(screen.queryByText('Please Amplify')).not.toBeInTheDocument()
    })
  })

  describe('when rendering timestamps', () => {
    it('should display relative time for recent activities', () => {
      const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      const activity = createActivityWithProfile({ created_at: recentDate })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument()
    })

    it('should display relative time for older activities', () => {
      const olderDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      const activity = createActivityWithProfile({ created_at: olderDate })

      render(<ActivityCard activity={activity} />)

      expect(screen.getByText('3 days ago')).toBeInTheDocument()
    })
  })
})
