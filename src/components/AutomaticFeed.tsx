'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ActivityForm, type ActivityFormInitialValues } from '@/components/ActivityForm'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { formatRelativeTime } from '@/lib/utils/formatDate'
import { getActivityLabel, type ActivityType } from '@/lib/constants/activityPoints'
import type { PendingActivity, SocialConnection } from '@/types/database'

export function AutomaticFeed() {
  const { user, isMockAuth } = useAuth()
  const supabase = createClient()
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([])
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // Fetch connections and pending activities in parallel
      const [connectionsResult, pendingResult] = await Promise.all([
        supabase.from('social_connections').select('*').eq('user_id', user.id),
        supabase
          .from('pending_activities')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('ingested_at', { ascending: false }),
      ])

      setConnections(connectionsResult.data || [])
      setPendingActivities(pendingResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (activity: PendingActivity) => {
    // Show the inline edit form
    setEditingId(activity.id)
  }

  const handleApproveSubmit = async (activityId: string) => {
    if (!user || isMockAuth) {
      // For mock, just remove from list
      setPendingActivities((prev) => prev.filter((a) => a.id !== activityId))
      setEditingId(null)
      return
    }

    try {
      // Mark the pending activity as approved
      await supabase
        .from('pending_activities')
        .update({ status: 'approved' })
        .eq('id', activityId)

      // Remove from local state
      setPendingActivities((prev) => prev.filter((a) => a.id !== activityId))
      setEditingId(null)
    } catch (error) {
      console.error('Error approving activity:', error)
    }
  }

  const handleDecline = async (activityId: string) => {
    setDeclinedIds((prev) => new Set(prev).add(activityId))

    if (!isMockAuth && user) {
      // Mark as declined in the database
      await supabase
        .from('pending_activities')
        .update({ status: 'declined' })
        .eq('id', activityId)
    }
  }

  const handleUndoDecline = async (activityId: string) => {
    setDeclinedIds((prev) => {
      const next = new Set(prev)
      next.delete(activityId)
      return next
    })

    if (!isMockAuth && user) {
      // Revert to pending in the database
      await supabase
        .from('pending_activities')
        .update({ status: 'pending' })
        .eq('id', activityId)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const hasConnections = connections.length > 0
  const visibleActivities = pendingActivities.filter((a) => !declinedIds.has(a.id))

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        )
      case 'discord':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        )
      case 'twitter':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        )
    }
  }

  const getInitialValuesForActivity = (activity: PendingActivity): ActivityFormInitialValues => {
    return {
      activityType: activity.activity_type as ActivityType,
      title: activity.title,
      description: activity.description || '',
      url: activity.url || '',
      eventName: activity.event_name || '',
      eventDate: activity.event_date || '',
      location: activity.location || '',
      attendeeCount: activity.attendee_count?.toString() || '',
      platform: activity.platform || '',
      answerCount: activity.answer_count?.toString() || '',
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-[var(--surface-200)] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[var(--surface-200)] rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-[var(--surface-200)] rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-[var(--foreground)]">Automatically shared</h2>
        <p className="text-sm text-[var(--foreground-lighter)]">
          Your contributions to the community, automatically pulled from your connected services
        </p>
      </CardHeader>
      <CardContent>
        {!hasConnections ? (
          // Empty state - no connected services
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface-200)] mb-4">
              <svg
                className="w-8 h-8 text-[var(--foreground-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
              Connect your accounts
            </h3>
            <p className="text-sm text-[var(--foreground-lighter)] max-w-sm mx-auto">
              Link your GitHub, Discord, and other services to automatically discover your contributions.
              You will always have the opportunity to review and approve items before they appear in the community feed.
            </p>
            <Button
              variant="outline"
              size="small"
              className="mt-4"
              onClick={() => window.location.href = '/profile'}
            >
              Connect services
            </Button>
          </div>
        ) : visibleActivities.length === 0 ? (
          // Empty state - connected but no pending contributions
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface-200)] mb-4">
              <svg
                className="w-8 h-8 text-[var(--foreground-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
              All caught up
            </h3>
            <p className="text-sm text-[var(--foreground-lighter)] max-w-sm mx-auto">
              No new contributions found. Keep doing great work and check back later.
            </p>
          </div>
        ) : (
          // List of pending contributions
          <div className="space-y-3">
            {pendingActivities.map((activity) => {
              const isDeclined = declinedIds.has(activity.id)
              const isEditing = editingId === activity.id

              if (isEditing) {
                const providerName = activity.provider.charAt(0).toUpperCase() + activity.provider.slice(1)
                return (
                  <div key={activity.id} className="border border-[var(--brand)] rounded-lg">
                    <ActivityForm
                      initialValues={getInitialValuesForActivity(activity)}
                      onSuccess={() => handleApproveSubmit(activity.id)}
                      onCancel={handleCancelEdit}
                      submitLabel={`Approve (+${activity.suggested_points} pts)`}
                      header={`Ingested from ${providerName}`}
                      subheader="Review and edit the details before approving this activity"
                    />
                  </div>
                )
              }

              return (
                <div
                  key={activity.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border transition-all
                    ${
                      isDeclined
                        ? 'bg-[var(--surface-100)] border-[var(--border-muted)] opacity-50'
                        : 'bg-[var(--surface)] border-[var(--border)]'
                    }
                  `}
                >
                  {/* Provider icon */}
                  <div className="flex-shrink-0 mt-0.5 text-[var(--foreground-lighter)]">
                    {getProviderIcon(activity.provider)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="text-xs">
                        {getActivityLabel(activity.activity_type as ActivityType)}
                      </Badge>
                      <span className="text-xs text-[var(--foreground-lighter)]">
                        {formatRelativeTime(activity.ingested_at || activity.created_at || '')}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${isDeclined ? 'line-through' : ''} text-[var(--foreground)]`}>
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-[var(--foreground-lighter)] mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-[var(--brand)] mt-1">
                      +{activity.suggested_points} pts
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {isDeclined ? (
                      <Button
                        variant="text"
                        size="tiny"
                        onClick={() => handleUndoDecline(activity.id)}
                      >
                        Undo
                      </Button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(activity)}
                          className="p-1.5 rounded-md text-[var(--brand)] hover:bg-[var(--brand)]/10 transition-colors"
                          title="Review and approve"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDecline(activity.id)}
                          className="p-1.5 rounded-md text-[var(--foreground-lighter)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
                          title="Decline"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
