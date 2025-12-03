import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FeedProvider, useFeedFilters } from './FeedContext'

// Test component that uses the feed context
function TestConsumer() {
  const {
    filters,
    setTimePeriod,
    setSelectedCountries,
    toggleCountry,
    clearCountryFilter,
    availableCountries,
    setAvailableCountries,
  } = useFeedFilters()

  return (
    <div>
      <span data-testid="time-period">{filters.timePeriod}</span>
      <span data-testid="selected-countries">{filters.selectedCountries.join(',')}</span>
      <span data-testid="available-countries">{availableCountries.join(',')}</span>
      <button onClick={() => setTimePeriod('7d')}>Set 7d</button>
      <button onClick={() => setTimePeriod('30d')}>Set 30d</button>
      <button onClick={() => setTimePeriod('all')}>Set all</button>
      <button onClick={() => setSelectedCountries(['USA', 'UK'])}>Set Countries</button>
      <button onClick={() => toggleCountry('Germany')}>Toggle Germany</button>
      <button onClick={clearCountryFilter}>Clear Countries</button>
      <button onClick={() => setAvailableCountries(['USA', 'UK', 'Germany'])}>
        Set Available
      </button>
    </div>
  )
}

describe('FeedContext', () => {
  describe('FeedProvider', () => {
    it('should provide default time period of 30d', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      expect(screen.getByTestId('time-period').textContent).toBe('30d')
    })

    it('should provide empty selected countries by default', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      expect(screen.getByTestId('selected-countries').textContent).toBe('')
    })

    it('should provide empty available countries by default', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      expect(screen.getByTestId('available-countries').textContent).toBe('')
    })
  })

  describe('setTimePeriod', () => {
    it('should update time period to 7d', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set 7d'))

      expect(screen.getByTestId('time-period').textContent).toBe('7d')
    })

    it('should update time period to 30d', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set 7d'))
      fireEvent.click(screen.getByText('Set 30d'))

      expect(screen.getByTestId('time-period').textContent).toBe('30d')
    })

    it('should update time period to all', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set all'))

      expect(screen.getByTestId('time-period').textContent).toBe('all')
    })
  })

  describe('setSelectedCountries', () => {
    it('should set selected countries', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set Countries'))

      expect(screen.getByTestId('selected-countries').textContent).toBe('USA,UK')
    })
  })

  describe('toggleCountry', () => {
    it('should add country when not selected', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Toggle Germany'))

      expect(screen.getByTestId('selected-countries').textContent).toBe('Germany')
    })

    it('should remove country when already selected', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Toggle Germany'))
      fireEvent.click(screen.getByText('Toggle Germany'))

      expect(screen.getByTestId('selected-countries').textContent).toBe('')
    })

    it('should add to existing countries', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set Countries'))
      fireEvent.click(screen.getByText('Toggle Germany'))

      expect(screen.getByTestId('selected-countries').textContent).toBe('USA,UK,Germany')
    })
  })

  describe('clearCountryFilter', () => {
    it('should clear all selected countries', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set Countries'))
      expect(screen.getByTestId('selected-countries').textContent).toBe('USA,UK')

      fireEvent.click(screen.getByText('Clear Countries'))
      expect(screen.getByTestId('selected-countries').textContent).toBe('')
    })
  })

  describe('setAvailableCountries', () => {
    it('should set available countries', () => {
      render(
        <FeedProvider>
          <TestConsumer />
        </FeedProvider>
      )

      fireEvent.click(screen.getByText('Set Available'))

      expect(screen.getByTestId('available-countries').textContent).toBe('USA,UK,Germany')
    })
  })

  describe('useFeedFilters hook', () => {
    it('should throw error when used outside FeedProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useFeedFilters must be used within a FeedProvider')

      consoleSpy.mockRestore()
    })
  })
})
