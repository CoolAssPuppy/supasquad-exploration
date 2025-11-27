'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  ACTIVITY_TYPES,
  getActivityPoints,
  type ActivityType,
} from '@/lib/constants/activityPoints'

export interface ActivityFormInitialValues {
  activityType?: ActivityType
  title?: string
  description?: string
  url?: string
  eventName?: string
  eventDate?: string
  location?: string
  attendeeCount?: string
  platform?: string
  answerCount?: string
}

interface ActivityFormProps {
  initialValues?: ActivityFormInitialValues
  onSuccess?: () => void
  onCancel?: () => void
  compact?: boolean
  submitLabel?: string
  header?: string
  subheader?: string
}

export function ActivityForm({
  initialValues,
  onSuccess,
  onCancel,
  compact = false,
  submitLabel,
  header = 'Manual submission',
  subheader,
}: ActivityFormProps = {}) {
  const router = useRouter()
  const { user, isMockAuth } = useAuth()
  const supabase = createClient()

  const [activityType, setActivityType] = useState<ActivityType>(initialValues?.activityType || 'blog_post')
  const [title, setTitle] = useState(initialValues?.title || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [url, setUrl] = useState(initialValues?.url || '')
  const [eventName, setEventName] = useState(initialValues?.eventName || '')
  const [eventDate, setEventDate] = useState(initialValues?.eventDate || '')
  const [location, setLocation] = useState(initialValues?.location || '')
  const [attendeeCount, setAttendeeCount] = useState(initialValues?.attendeeCount || '')
  const [platform, setPlatform] = useState(initialValues?.platform || '')
  const [answerCount, setAnswerCount] = useState(initialValues?.answerCount || '')
  const [requestAmplification, setRequestAmplification] = useState(false)
  const [amplificationUrl, setAmplificationUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedActivity = ACTIVITY_TYPES.find((a) => a.type === activityType)
  const requiredFields = selectedActivity?.requiredFields || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!user) {
        throw new Error('You must be logged in to submit an activity')
      }

      const points = getActivityPoints(activityType)

      const activityData = {
        user_id: user.id,
        activity_type: activityType,
        title,
        description: description || null,
        url: url || null,
        event_name: eventName || null,
        event_date: eventDate || null,
        location: location || null,
        attendee_count: attendeeCount ? parseInt(attendeeCount, 10) : null,
        platform: platform || null,
        answer_count: answerCount ? parseInt(answerCount, 10) : null,
        points,
        request_amplification: requestAmplification,
        amplification_url: requestAmplification ? amplificationUrl || null : null,
      }

      if (isMockAuth) {
        // For mock auth, just simulate success
        console.log('Mock activity submission:', activityData)
        if (onSuccess) {
          onSuccess()
        } else {
          alert('Activity submitted successfully! (Mock mode)')
          router.push('/feed')
        }
        return
      }

      const { error: insertError } = await supabase
        .from('activities')
        .insert(activityData)

      if (insertError) throw insertError

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/feed')
        router.refresh()
      }
    } catch (err) {
      console.error('Error submitting activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activityOptions = ACTIVITY_TYPES.map((a) => ({
    value: a.type,
    label: `${a.label} (+${a.points} pts)`,
  }))

  const platformOptions = [
    { value: '', label: 'Select platform' },
    { value: 'discord', label: 'Discord' },
    { value: 'github', label: 'GitHub Discussions' },
    { value: 'stackoverflow', label: 'Stack Overflow' },
  ]

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-[var(--foreground)]">{header}</h2>
        <p className="text-sm text-[var(--foreground-lighter)]">
          {subheader || selectedActivity?.description}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity type */}
          <Select
            id="activityType"
            label="Activity type"
            options={activityOptions}
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
          />

          {/* Title - always required */}
          <Input
            id="title"
            label="Title"
            placeholder="What did you do?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* URL - for blog posts, videos, OSS, docs, templates, integrations */}
          {requiredFields.includes('url') && (
            <Input
              id="url"
              label="URL"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          )}

          {/* Event name - for talks, meetups, workshops */}
          {requiredFields.includes('eventName') && (
            <Input
              id="eventName"
              label="Event name"
              placeholder="Event or conference name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          )}

          {/* Event date - for talks, meetups, workshops */}
          {requiredFields.includes('eventDate') && (
            <Input
              id="eventDate"
              label="Event date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          )}

          {/* Location - for hosted meetups */}
          {requiredFields.includes('location') && (
            <Input
              id="location"
              label="Location"
              placeholder="City, Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          )}

          {/* Attendee count - for meetups, workshops */}
          {requiredFields.includes('attendeeCount') && (
            <Input
              id="attendeeCount"
              label="Attendee count"
              type="number"
              min="1"
              placeholder="Number of attendees"
              value={attendeeCount}
              onChange={(e) => setAttendeeCount(e.target.value)}
              required
            />
          )}

          {/* Platform - for community answers */}
          {requiredFields.includes('platform') && (
            <Select
              id="platform"
              label="Platform"
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
            />
          )}

          {/* Answer count - for community answers */}
          {requiredFields.includes('answerCount') && (
            <Input
              id="answerCount"
              label="Number of answers"
              type="number"
              min="1"
              placeholder="How many questions did you answer?"
              value={answerCount}
              onChange={(e) => setAnswerCount(e.target.value)}
              required
            />
          )}

          {/* Description - for support, mentorship, OSS, docs, templates, integrations */}
          {requiredFields.includes('description') && (
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--foreground-light)] mb-1.5"
              >
                Description
              </label>
              <textarea
                id="description"
                className="
                  w-full min-h-[100px] px-3 py-2
                  bg-[var(--surface)]
                  border border-[var(--border)]
                  rounded-md
                  text-[var(--foreground)]
                  placeholder:text-[var(--foreground-muted)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                  resize-y
                "
                placeholder="Describe what you did..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          )}

          {/* Optional description for other activity types */}
          {!requiredFields.includes('description') && (
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--foreground-light)] mb-1.5"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                className="
                  w-full min-h-[80px] px-3 py-2
                  bg-[var(--surface)]
                  border border-[var(--border)]
                  rounded-md
                  text-[var(--foreground)]
                  placeholder:text-[var(--foreground-muted)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                  resize-y
                "
                placeholder="Add any additional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          {/* Amplification request */}
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="requestAmplification"
                checked={requestAmplification}
                onChange={(e) => setRequestAmplification(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--brand)] focus:ring-[var(--brand)] focus:ring-offset-0"
              />
              <div className="flex-1">
                <label
                  htmlFor="requestAmplification"
                  className="block text-sm font-medium text-[var(--foreground)] cursor-pointer"
                >
                  Request community amplification
                </label>
                <p className="mt-1 text-sm text-[var(--foreground-lighter)]">
                  Ask the community to help amplify your content by sharing, liking, or commenting.
                </p>
              </div>
            </div>

            {requestAmplification && (
              <div className="mt-4">
                <Input
                  id="amplificationUrl"
                  label="Content URL to amplify"
                  type="url"
                  placeholder="https://linkedin.com/... or https://twitter.com/..."
                  value={amplificationUrl}
                  onChange={(e) => setAmplificationUrl(e.target.value)}
                  required={requestAmplification}
                />
                <p className="mt-1.5 text-xs text-[var(--foreground-lighter)]">
                  Link to your LinkedIn post, tweet, blog post, or repository
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-md">
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <div className={`pt-2 ${onCancel ? 'flex gap-2' : ''}`}>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" isLoading={isSubmitting} className={onCancel ? 'flex-1' : 'w-full'}>
              {submitLabel || `Submit activity (+${getActivityPoints(activityType)} pts)`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
