'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils/formatDate'
import { getActivityLabel } from '@/lib/constants/activityPoints'
import type { ActivityWithProfile } from '@/types/database'

interface ActivityCardProps {
  activity: ActivityWithProfile
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const displayName = activity.profiles.first_name
    ? `${activity.profiles.first_name} ${activity.profiles.last_name || ''}`
    : activity.profiles.email.split('@')[0]

  return (
    <Card className="hover:border-[var(--border-light)] transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar
            src={activity.profiles.avatar_url}
            alt={displayName}
            fallback={displayName}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-[var(--foreground)]">
                  {displayName}
                </span>
                <span className="text-[var(--foreground-lighter)] mx-2">
                  reported
                </span>
                <Badge variant="brand">
                  {getActivityLabel(activity.activity_type)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-medium text-[var(--brand)]">
                  +{activity.points} pts
                </span>
              </div>
            </div>

            <h3 className="mt-2 font-medium text-[var(--foreground)]">
              {activity.title}
            </h3>

            {activity.description && (
              <p className="mt-1 text-sm text-[var(--foreground-light)] line-clamp-2">
                {activity.description}
              </p>
            )}

            {activity.request_amplification && activity.amplification_url && (
              <div className="mt-3 p-2 rounded-md bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                <a
                  href={activity.amplification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--warning)] hover:underline"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Please Amplify
                </a>
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-sm text-[var(--foreground-lighter)]">
              <span>{formatRelativeTime(activity.created_at)}</span>
              {activity.url && (
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand)] hover:underline"
                >
                  View link
                </a>
              )}
              {activity.event_name && (
                <span>{activity.event_name}</span>
              )}
              {activity.location && (
                <span>{activity.location}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
