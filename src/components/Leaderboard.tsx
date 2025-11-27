'use client'

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import type { LeaderboardEntry } from '@/types/database'

export type TimePeriod = 'all' | '30d' | '7d'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
  { value: 'all', label: 'All Time' },
]

export function Leaderboard({ entries, currentUserId, timePeriod, onTimePeriodChange }: LeaderboardProps) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400'
      case 2:
        return 'text-gray-300'
      case 3:
        return 'text-amber-600'
      default:
        return 'text-[var(--foreground-lighter)]'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '1st'
      case 2:
        return '2nd'
      case 3:
        return '3rd'
      default:
        return `${rank}th`
    }
  }

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case '7d':
        return 'Top contributors this week'
      case '30d':
        return 'Top contributors this month'
      case 'all':
        return 'Top contributors of all time'
    }
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--foreground)]">Leaderboard</h2>
        </div>
        <p className="text-sm text-[var(--foreground-lighter)]">
          {getPeriodLabel()}
        </p>
        {/* Time period tabs */}
        <div className="mt-3 flex gap-1 p-1 rounded-lg bg-[var(--background)]">
          {TIME_PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => onTimePeriodChange(period.value)}
              className={`
                flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${
                  timePeriod === period.value
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--foreground-lighter)] hover:text-[var(--foreground)]'
                }
              `}
            >
              {period.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <LayoutGroup>
          <div className="divide-y divide-[var(--border)]">
            {entries.length === 0 ? (
              <div className="p-4 text-center text-[var(--foreground-lighter)]">
                No activities yet. Be the first!
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {entries.map((entry) => {
                  const isCurrentUser = entry.user_id === currentUserId
                  const displayName = entry.first_name
                    ? `${entry.first_name} ${entry.last_name || ''}`
                    : entry.email.split('@')[0]

                  return (
                    <motion.div
                      key={entry.user_id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 500, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className={`
                        flex items-center gap-3 p-4
                        ${isCurrentUser ? 'bg-[var(--brand)]/5' : ''}
                      `}
                    >
                      {/* Rank */}
                      <motion.span
                        layout="position"
                        className={`
                          w-8 font-bold text-sm
                          ${getRankStyle(entry.rank)}
                        `}
                      >
                        {getRankIcon(entry.rank)}
                      </motion.span>

                      {/* Avatar */}
                      <Avatar
                        src={entry.avatar_url}
                        alt={displayName}
                        fallback={displayName}
                        size="sm"
                      />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                            text-sm font-medium truncate
                            ${isCurrentUser ? 'text-[var(--brand)]' : 'text-[var(--foreground)]'}
                          `}
                        >
                          {displayName}
                          {isCurrentUser && ' (you)'}
                        </p>
                      </div>

                      {/* Points */}
                      <motion.span
                        layout="position"
                        className="text-sm font-medium text-[var(--foreground-light)]"
                      >
                        {entry.total_points.toLocaleString()} pts
                      </motion.span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </LayoutGroup>
      </CardContent>
    </Card>
  )
}
