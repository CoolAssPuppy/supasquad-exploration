import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime, formatDate } from './formatDate'

describe('Date formatting utilities', () => {
  beforeEach(() => {
    // Fix the current time for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('when formatting relative time', () => {
    describe('for times less than a minute ago', () => {
      it('should show "just now" for times within the last 60 seconds', () => {
        const thirtySecondsAgo = new Date('2024-06-15T11:59:30Z').toISOString()

        expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now')
      })

      it('should show "just now" for exactly now', () => {
        const now = new Date('2024-06-15T12:00:00Z').toISOString()

        expect(formatRelativeTime(now)).toBe('just now')
      })
    })

    describe('for times in minutes', () => {
      it('should show "1 minute ago" for singular minute', () => {
        const oneMinuteAgo = new Date('2024-06-15T11:59:00Z').toISOString()

        expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago')
      })

      it('should show plural minutes for multiple minutes', () => {
        const fiveMinutesAgo = new Date('2024-06-15T11:55:00Z').toISOString()

        expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago')
      })

      it('should show "59 minutes ago" at the boundary', () => {
        const fiftyNineMinutesAgo = new Date('2024-06-15T11:01:00Z').toISOString()

        expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59 minutes ago')
      })
    })

    describe('for times in hours', () => {
      it('should show "1 hour ago" for singular hour', () => {
        const oneHourAgo = new Date('2024-06-15T11:00:00Z').toISOString()

        expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')
      })

      it('should show plural hours for multiple hours', () => {
        const threeHoursAgo = new Date('2024-06-15T09:00:00Z').toISOString()

        expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago')
      })

      it('should show "23 hours ago" at the boundary', () => {
        const twentyThreeHoursAgo = new Date('2024-06-14T13:00:00Z').toISOString()

        expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23 hours ago')
      })
    })

    describe('for times in days', () => {
      it('should show "1 day ago" for singular day', () => {
        const oneDayAgo = new Date('2024-06-14T12:00:00Z').toISOString()

        expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago')
      })

      it('should show plural days for multiple days', () => {
        const threeDaysAgo = new Date('2024-06-12T12:00:00Z').toISOString()

        expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago')
      })

      it('should show "6 days ago" at the boundary before weeks', () => {
        const sixDaysAgo = new Date('2024-06-09T12:00:00Z').toISOString()

        expect(formatRelativeTime(sixDaysAgo)).toBe('6 days ago')
      })
    })

    describe('for times in weeks', () => {
      it('should show "1 week ago" for singular week', () => {
        const oneWeekAgo = new Date('2024-06-08T12:00:00Z').toISOString()

        expect(formatRelativeTime(oneWeekAgo)).toBe('1 week ago')
      })

      it('should show plural weeks for multiple weeks', () => {
        const threeWeeksAgo = new Date('2024-05-25T12:00:00Z').toISOString()

        expect(formatRelativeTime(threeWeeksAgo)).toBe('3 weeks ago')
      })
    })

    describe('for times in months', () => {
      it('should show "1 month ago" for singular month', () => {
        const oneMonthAgo = new Date('2024-05-15T12:00:00Z').toISOString()

        expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago')
      })

      it('should show plural months for multiple months', () => {
        const threeMonthsAgo = new Date('2024-03-15T12:00:00Z').toISOString()

        expect(formatRelativeTime(threeMonthsAgo)).toBe('3 months ago')
      })
    })

    describe('for times in years', () => {
      it('should show "1 year ago" for singular year', () => {
        const oneYearAgo = new Date('2023-06-15T12:00:00Z').toISOString()

        expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago')
      })

      it('should show plural years for multiple years', () => {
        const twoYearsAgo = new Date('2022-06-15T12:00:00Z').toISOString()

        expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago')
      })
    })
  })

  describe('when formatting dates', () => {
    it('should format date in readable format', () => {
      const date = new Date('2024-06-15T12:00:00Z').toISOString()

      const formatted = formatDate(date)

      // Format should be like "Jun 15, 2024"
      expect(formatted).toContain('Jun')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should handle different months correctly', () => {
      const january = formatDate('2024-01-01T00:00:00Z')
      const december = formatDate('2024-12-31T00:00:00Z')

      expect(january).toContain('Jan')
      expect(december).toContain('Dec')
    })

    it('should handle single-digit days', () => {
      const date = formatDate('2024-06-05T00:00:00Z')

      expect(date).toContain('5')
    })
  })
})
