'use client'

import { useState, useRef, useEffect } from 'react'
import { useFeedFilters } from '@/lib/feed/FeedContext'

export function CountryFilter() {
  const { filters, availableCountries, toggleCountry, clearCountryFilter } = useFeedFilters()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCount = filters.selectedCountries.length

  if (availableCountries.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          border transition-colors
          ${
            selectedCount > 0
              ? 'bg-[var(--brand)]/10 border-[var(--brand)]/30 text-[var(--brand)]'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-light)] hover:border-[var(--border-light)]'
          }
        `}
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
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {selectedCount > 0 ? `${selectedCount} ${selectedCount === 1 ? 'country' : 'countries'}` : 'Filter by country'}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-72 overflow-auto rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-lg z-50">
          <div className="p-2 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Countries
              </span>
              {selectedCount > 0 && (
                <button
                  onClick={clearCountryFilter}
                  className="text-xs text-[var(--brand)] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="py-1">
            {availableCountries.map((country) => {
              const isSelected = filters.selectedCountries.includes(country)
              return (
                <button
                  key={country}
                  onClick={() => toggleCountry(country)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors
                    ${isSelected ? 'bg-[var(--brand)]/10' : 'hover:bg-[var(--surface-hover)]'}
                  `}
                >
                  <span
                    className={`
                      w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                      ${
                        isSelected
                          ? 'bg-[var(--brand)] border-[var(--brand)]'
                          : 'border-[var(--border)]'
                      }
                    `}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className={isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground-light)]'}>
                    {country}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
