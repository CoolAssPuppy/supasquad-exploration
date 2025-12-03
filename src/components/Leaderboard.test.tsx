import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Leaderboard, type TimePeriod } from './Leaderboard'
import { createLeaderboard, createLeaderboardEntry } from '@/test/factories'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Leaderboard component', () => {
  const defaultProps = {
    entries: createLeaderboard(5),
    timePeriod: 'all' as TimePeriod,
    onTimePeriodChange: vi.fn(),
  }

  describe('when rendering with entries', () => {
    it('should display leaderboard title', () => {
      render(<Leaderboard {...defaultProps} />)

      expect(screen.getByText('Leaderboard')).toBeInTheDocument()
    })

    it('should display all entries', () => {
      const entries = [
        createLeaderboardEntry({ first_name: 'Alice', last_name: 'Smith', rank: 1 }),
        createLeaderboardEntry({ first_name: 'Bob', last_name: 'Jones', rank: 2 }),
        createLeaderboardEntry({ first_name: 'Carol', last_name: 'White', rank: 3 }),
      ]
      render(<Leaderboard {...defaultProps} entries={entries} />)

      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      expect(screen.getByText('Carol White')).toBeInTheDocument()
    })

    it('should display rank indicators', () => {
      render(<Leaderboard {...defaultProps} />)

      expect(screen.getByText('1st')).toBeInTheDocument()
      expect(screen.getByText('2nd')).toBeInTheDocument()
      expect(screen.getByText('3rd')).toBeInTheDocument()
      expect(screen.getByText('4th')).toBeInTheDocument()
      expect(screen.getByText('5th')).toBeInTheDocument()
    })

    it('should display points with formatting', () => {
      const entries = [createLeaderboardEntry({ total_points: 1500, rank: 1 })]
      render(<Leaderboard {...defaultProps} entries={entries} />)

      expect(screen.getByText('1,500 pts')).toBeInTheDocument()
    })

    it('should highlight current user', () => {
      const entries = [
        createLeaderboardEntry({ user_id: 'user-1', rank: 1 }),
        createLeaderboardEntry({ user_id: 'user-2', rank: 2 }),
      ]
      render(<Leaderboard {...defaultProps} entries={entries} currentUserId="user-2" />)

      expect(screen.getByText(/\(you\)/)).toBeInTheDocument()
    })
  })

  describe('when entries are empty', () => {
    it('should display empty state message', () => {
      render(<Leaderboard {...defaultProps} entries={[]} />)

      expect(screen.getByText('No activities yet. Be the first!')).toBeInTheDocument()
    })
  })

  describe('when using time period filters', () => {
    it('should display all time period options', () => {
      render(<Leaderboard {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Last 7d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Last 30d' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument()
    })

    it('should show correct label for 7d period', () => {
      render(<Leaderboard {...defaultProps} timePeriod="7d" />)

      expect(screen.getByText('Top contributors this week')).toBeInTheDocument()
    })

    it('should show correct label for 30d period', () => {
      render(<Leaderboard {...defaultProps} timePeriod="30d" />)

      expect(screen.getByText('Top contributors this month')).toBeInTheDocument()
    })

    it('should show correct label for all time period', () => {
      render(<Leaderboard {...defaultProps} timePeriod="all" />)

      expect(screen.getByText('Top contributors of all time')).toBeInTheDocument()
    })

    it('should call onTimePeriodChange when clicking time period button', () => {
      const onTimePeriodChange = vi.fn()
      render(<Leaderboard {...defaultProps} onTimePeriodChange={onTimePeriodChange} />)

      fireEvent.click(screen.getByRole('button', { name: 'Last 7d' }))

      expect(onTimePeriodChange).toHaveBeenCalledWith('7d')
    })

    it('should call onTimePeriodChange with 30d', () => {
      const onTimePeriodChange = vi.fn()
      render(<Leaderboard {...defaultProps} onTimePeriodChange={onTimePeriodChange} />)

      fireEvent.click(screen.getByRole('button', { name: 'Last 30d' }))

      expect(onTimePeriodChange).toHaveBeenCalledWith('30d')
    })
  })

  describe('when displaying user names', () => {
    it('should show full name when first_name exists', () => {
      const entries = [
        createLeaderboardEntry({ first_name: 'John', last_name: 'Doe', rank: 1 }),
      ]
      render(<Leaderboard {...defaultProps} entries={entries} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should show first name only when last_name is empty', () => {
      const entries = [
        createLeaderboardEntry({ first_name: 'Alice', last_name: '', rank: 1 }),
      ]
      render(<Leaderboard {...defaultProps} entries={entries} />)

      expect(screen.getByText(/Alice/)).toBeInTheDocument()
    })

    it('should show email prefix when first_name is empty', () => {
      const entries = [
        createLeaderboardEntry({ first_name: '', email: 'bob@example.com', rank: 1 }),
      ]
      render(<Leaderboard {...defaultProps} entries={entries} />)

      expect(screen.getByText('bob')).toBeInTheDocument()
    })
  })
})
