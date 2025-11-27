'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { useFeedFilters } from '@/lib/feed/FeedContext'
import { ActivityCard } from '@/components/ActivityCard'
import { Leaderboard } from '@/components/Leaderboard'
import { CountryFilter } from '@/components/CountryFilter'
import type { ActivityWithProfile, LeaderboardEntry, Profile } from '@/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface ActivityRow {
  id: string
  user_id: string
  activity_type: string
  title: string
  description: string | null
  url: string | null
  event_name: string | null
  event_date: string | null
  location: string | null
  attendee_count: number | null
  platform: string | null
  answer_count: number | null
  points: number
  request_amplification: boolean | null
  amplification_url: string | null
  created_at: string
}

function getDateFilter(period: '7d' | '30d' | 'all'): Date | null {
  if (period === 'all') return null
  const now = new Date()
  const days = period === '7d' ? 7 : 30
  now.setDate(now.getDate() - days)
  return now
}

export function ActivityFeed() {
  const { user } = useAuth()
  const { filters, setTimePeriod, setAvailableCountries } = useFeedFilters()
  const supabase = createClient()
  const [activities, setActivities] = useState<ActivityWithProfile[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCountries = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('country')
      .not('country', 'is', null)

    if (data) {
      const uniqueCountries = [...new Set(data.map((p) => p.country as string))].sort()
      setAvailableCountries(uniqueCountries)
    }
  }, [supabase, setAvailableCountries])

  const fetchActivities = useCallback(async () => {
    const query = supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          country
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    // Feed shows all recent activities (no time filter - that's only for leaderboard)

    const { data, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching activities:', fetchError)
      setError('Failed to load activities')
      return
    }

    // Filter by country if selected
    let filteredData = data as (ActivityWithProfile & { profiles: Profile })[]
    if (filters.selectedCountries.length > 0) {
      filteredData = filteredData.filter((activity) => {
        const profile = activity.profiles as Profile
        return profile.country && filters.selectedCountries.includes(profile.country)
      })
    }

    setActivities(filteredData)
  }, [supabase, filters.selectedCountries])

  const calculateLeaderboard = useCallback(async () => {
    let query = supabase
      .from('activities')
      .select(`
        user_id,
        points,
        created_at,
        profiles:user_id (
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          country
        )
      `)

    // Apply time filter
    const dateFilter = getDateFilter(filters.timePeriod)
    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString())
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching leaderboard data:', fetchError)
      return
    }

    // Filter by country if selected
    let filteredData = data || []
    if (filters.selectedCountries.length > 0) {
      filteredData = filteredData.filter((activity) => {
        const profile = activity.profiles as Profile
        return profile.country && filters.selectedCountries.includes(profile.country)
      })
    }

    // Aggregate points by user
    const userPoints = new Map<string, {
      user_id: string
      email: string
      first_name: string | null
      last_name: string | null
      avatar_url: string | null
      total_points: number
    }>()

    for (const activity of filteredData) {
      const profile = activity.profiles as {
        id: string
        email: string
        first_name: string | null
        last_name: string | null
        avatar_url: string | null
      }

      const existing = userPoints.get(activity.user_id)
      if (existing) {
        existing.total_points += activity.points
      } else {
        userPoints.set(activity.user_id, {
          user_id: activity.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          total_points: activity.points,
        })
      }
    }

    // Sort by points and add rank
    const sorted = Array.from(userPoints.values())
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 10)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    setLeaderboard(sorted)
  }, [supabase, filters.timePeriod, filters.selectedCountries])

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // Initial fetch and Realtime subscription
  useEffect(() => {
    const initialFetch = async () => {
      setError(null)
      await Promise.all([fetchActivities(), calculateLeaderboard()])
      setIsInitialLoading(false)
    }
    initialFetch()

    // Set up Realtime subscription for new activities
    const channel = supabase
      .channel('activities-realtime')
      .on<ActivityRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
        },
        (payload: RealtimePostgresChangesPayload<ActivityRow>) => {
          console.log('[Realtime] Change received:', payload)
          fetchActivities()
          calculateLeaderboard()
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status)
        if (err) console.error('[Realtime] Error:', err)
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // Only run on mount - individual effects handle filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // Re-fetch activities when country filter changes (not on initial mount)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    fetchActivities()
    calculateLeaderboard()
  }, [filters.selectedCountries, fetchActivities, calculateLeaderboard])

  // Re-calculate leaderboard when time period changes (not activities)
  const isTimePeriodInitialMount = useRef(true)
  useEffect(() => {
    if (isTimePeriodInitialMount.current) {
      isTimePeriodInitialMount.current = false
      return
    }
    calculateLeaderboard()
  }, [filters.timePeriod, calculateLeaderboard])

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 rounded-lg bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-[var(--surface)] animate-pulse"
              />
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="h-96 rounded-lg bg-[var(--surface)] animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20">
        <p className="text-[var(--destructive)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <CountryFilter />
        {filters.selectedCountries.length > 0 && (
          <span className="text-sm text-[var(--foreground-lighter)]">
            Showing results for {filters.selectedCountries.join(', ')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-[var(--foreground-lighter)]">
              <p className="text-lg">No activities yet</p>
              <p className="mt-2 text-sm">
                {filters.selectedCountries.length > 0
                  ? 'No activities from the selected countries. Try adjusting your filters.'
                  : 'Be the first to report your community contribution!'}
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <Leaderboard
            entries={leaderboard}
            currentUserId={user?.id}
            timePeriod={filters.timePeriod}
            onTimePeriodChange={setTimePeriod}
          />
        </div>
      </div>
    </div>
  )
}
