'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { TimePeriod } from '@/components/Leaderboard'

interface FeedFilters {
  timePeriod: TimePeriod
  selectedCountries: string[]
}

interface FeedContextType {
  filters: FeedFilters
  setTimePeriod: (period: TimePeriod) => void
  setSelectedCountries: (countries: string[]) => void
  toggleCountry: (country: string) => void
  clearCountryFilter: () => void
  availableCountries: string[]
  setAvailableCountries: (countries: string[]) => void
}

const FeedContext = createContext<FeedContextType | undefined>(undefined)

interface FeedProviderProps {
  children: ReactNode
}

export function FeedProvider({ children }: FeedProviderProps) {
  const [filters, setFilters] = useState<FeedFilters>({
    timePeriod: '30d',
    selectedCountries: [],
  })
  const [availableCountries, setAvailableCountries] = useState<string[]>([])

  const setTimePeriod = useCallback((period: TimePeriod) => {
    setFilters((prev) => ({ ...prev, timePeriod: period }))
  }, [])

  const setSelectedCountries = useCallback((countries: string[]) => {
    setFilters((prev) => ({ ...prev, selectedCountries: countries }))
  }, [])

  const toggleCountry = useCallback((country: string) => {
    setFilters((prev) => {
      const isSelected = prev.selectedCountries.includes(country)
      return {
        ...prev,
        selectedCountries: isSelected
          ? prev.selectedCountries.filter((c) => c !== country)
          : [...prev.selectedCountries, country],
      }
    })
  }, [])

  const clearCountryFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, selectedCountries: [] }))
  }, [])

  return (
    <FeedContext.Provider
      value={{
        filters,
        setTimePeriod,
        setSelectedCountries,
        toggleCountry,
        clearCountryFilter,
        availableCountries,
        setAvailableCountries,
      }}
    >
      {children}
    </FeedContext.Provider>
  )
}

export function useFeedFilters() {
  const context = useContext(FeedContext)
  if (context === undefined) {
    throw new Error('useFeedFilters must be used within a FeedProvider')
  }
  return context
}
