'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { getActivityLabel, type ActivityType } from '@/lib/constants/activityPoints'

type TimePeriod = '7d' | '30d' | 'all'

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
  { value: 'all', label: 'All Time' },
]

interface MonthlyData {
  month: string
  count: number
  points: number
}

interface ActivityTypeData {
  type: string
  label: string
  count: number
  points: number
}

interface RankData {
  month: string
  rank: number
}

function getMonthsForPeriod(period: TimePeriod): number {
  switch (period) {
    case '7d':
      return 1 // Show current month for 7d
    case '30d':
      return 2 // Show 2 months for 30d
    case 'all':
      return 6 // Show 6 months for all time
  }
}

function getDateFilter(period: TimePeriod): Date | null {
  if (period === 'all') return null
  const now = new Date()
  const days = period === '7d' ? 7 : 30
  now.setDate(now.getDate() - days)
  return now
}

export function ProfileCharts() {
  const { user } = useAuth()
  const supabase = createClient()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [contributionsOverTime, setContributionsOverTime] = useState<MonthlyData[]>([])
  const [rankOverTime, setRankOverTime] = useState<RankData[]>([])
  const [contributionsByType, setContributionsByType] = useState<ActivityTypeData[]>([])
  const [pointsOverTime, setPointsOverTime] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchChartData = useCallback(async () => {
    if (!user) return

    try {
      const dateFilter = getDateFilter(timePeriod)
      const monthCount = getMonthsForPeriod(timePeriod)

      // Build user activities query with optional date filter
      let userQuery = supabase
        .from('activities')
        .select('activity_type, points, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (dateFilter) {
        userQuery = userQuery.gte('created_at', dateFilter.toISOString())
      }

      const { data: userActivities, error: userError } = await userQuery

      if (userError) throw userError

      // Build all activities query with optional date filter for rank calculation
      let allQuery = supabase
        .from('activities')
        .select('user_id, points, created_at')
        .order('created_at', { ascending: true })

      if (dateFilter) {
        allQuery = allQuery.gte('created_at', dateFilter.toISOString())
      }

      const { data: allActivities, error: allError } = await allQuery

      if (allError) throw allError

      // Process user activities by month
      const monthlyMap = new Map<string, { count: number; points: number }>()
      const typeMap = new Map<string, { count: number; points: number }>()

      // Get months based on time period
      const months: string[] = []
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        months.push(monthKey)
        monthlyMap.set(monthKey, { count: 0, points: 0 })
      }

      // Process user's activities
      for (const activity of userActivities || []) {
        const date = new Date(activity.created_at)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

        // Monthly data
        if (monthlyMap.has(monthKey)) {
          const existing = monthlyMap.get(monthKey)!
          existing.count++
          existing.points += activity.points
        }

        // Type data
        const typeKey = activity.activity_type
        const existing = typeMap.get(typeKey) || { count: 0, points: 0 }
        existing.count++
        existing.points += activity.points
        typeMap.set(typeKey, existing)
      }

      // Calculate rank over time
      const userPointsByMonth = new Map<string, number>()
      const allUserPointsByMonth = new Map<string, Map<string, number>>()

      // Initialize months for all users
      for (const month of months) {
        allUserPointsByMonth.set(month, new Map())
      }

      // Accumulate points by month for all users
      let userCumulativePoints = 0
      const allUsersCumulative = new Map<string, number>()

      for (const activity of allActivities || []) {
        const date = new Date(activity.created_at)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

        // Track cumulative points
        const currentUserPoints = allUsersCumulative.get(activity.user_id) || 0
        allUsersCumulative.set(activity.user_id, currentUserPoints + activity.points)

        if (activity.user_id === user.id) {
          userCumulativePoints += activity.points
        }

        // Store snapshot at end of each month we care about
        if (months.includes(monthKey)) {
          const monthUsers = allUserPointsByMonth.get(monthKey)!
          for (const [userId, points] of allUsersCumulative) {
            monthUsers.set(userId, points)
          }
          userPointsByMonth.set(monthKey, userCumulativePoints)
        }
      }

      // Calculate rank for each month
      const rankData: RankData[] = []
      for (const month of months) {
        const monthUsers = allUserPointsByMonth.get(month)!
        const userPoints = userPointsByMonth.get(month) || 0

        if (userPoints === 0) {
          rankData.push({ month, rank: 0 })
          continue
        }

        // Count users with more points
        let rank = 1
        for (const [, points] of monthUsers) {
          if (points > userPoints) {
            rank++
          }
        }
        rankData.push({ month, rank })
      }

      // Convert maps to arrays
      const contributionsData = months.map((month) => ({
        month,
        count: monthlyMap.get(month)?.count || 0,
        points: monthlyMap.get(month)?.points || 0,
      }))

      const typeData = Array.from(typeMap.entries())
        .map(([type, data]) => ({
          type,
          label: getActivityLabel(type as ActivityType),
          count: data.count,
          points: data.points,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6) // Top 6 types

      setContributionsOverTime(contributionsData)
      setPointsOverTime(contributionsData)
      setRankOverTime(rankData)
      setContributionsByType(typeData)
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase, timePeriod])

  useEffect(() => {
    fetchChartData()
  }, [fetchChartData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[160px] bg-[var(--surface-200)] rounded animate-pulse" />
        ))}
      </div>
    )
  }

  const hasData = contributionsOverTime.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--foreground-lighter)]">
          No activity data yet. Start contributing to see your stats!
        </p>
      </div>
    )
  }

  // Supabase color scheme
  const colors = {
    brand: 'hsl(152.9, 60%, 52.9%)', // --brand-default (Supabase green)
    brandLight: 'hsl(151.3, 66.9%, 66.9%)', // --brand-400
    warning: 'hsl(39, 100%, 50%)', // --warning (amber)
    grid: 'hsl(0, 0%, 18%)', // --border
    text: 'hsl(0, 0%, 54%)', // --foreground-lighter
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(0, 0%, 12%)', // --surface
    border: '1px solid hsl(0, 0%, 18%)', // --border
    borderRadius: '8px',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6">
      {/* Time period filter */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--background)] w-fit">
        {TIME_PERIODS.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => setTimePeriod(period.value)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${
                timePeriod === period.value
                  ? 'bg-[var(--surface-300)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--foreground-lighter)] hover:text-[var(--foreground)]'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Charts - stacked vertically, full width */}
      <div className="space-y-6">
        {/* Activity - Contributions over time */}
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">Activity</h3>
          <p className="text-xs text-[var(--foreground-lighter)] mb-3">Contributions per month</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contributionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Contributions']} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={colors.brand}
                  strokeWidth={2}
                  dot={{ fill: colors.brand, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: colors.brand }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact - Points over time */}
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">Impact</h3>
          <p className="text-xs text-[var(--foreground-lighter)] mb-3">Points earned per month</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Points']} />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke={colors.warning}
                  strokeWidth={2}
                  dot={{ fill: colors.warning, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: colors.warning }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown - Contributions by type */}
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">Breakdown</h3>
          <p className="text-xs text-[var(--foreground-lighter)] mb-3">Contributions by type</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionsByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Count']} />
                <Bar dataKey="count" fill={colors.brand} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking - Position over time */}
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">Ranking</h3>
          <p className="text-xs text-[var(--foreground-lighter)] mb-3">Your position over time</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rankOverTime.filter((d) => d.rank > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: colors.text }}
                  tickLine={false}
                  axisLine={false}
                  reversed
                  domain={[1, 'auto']}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`#${value}`, 'Rank']} />
                <Line
                  type="monotone"
                  dataKey="rank"
                  stroke={colors.brandLight}
                  strokeWidth={2}
                  dot={{ fill: colors.brandLight, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: colors.brandLight }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
