'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Avatar } from '@/components/ui/Avatar'

const navItems = [
  { href: '/feed', label: 'Feed' },
  { href: '/share', label: 'Share' },
  { href: '/program', label: 'Program' },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut, isLoading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const getDisplayName = () => {
    if (profile?.first_name) {
      return profile.first_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2">
            <svg
              className="w-8 h-8"
              viewBox="0 0 109 113"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                fill="url(#nav_paint0_linear)"
              />
              <path
                d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                fill="#3ECF8E"
              />
              <defs>
                <linearGradient
                  id="nav_paint0_linear"
                  x1="53.9738"
                  y1="54.974"
                  x2="94.1635"
                  y2="71.8295"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#249361" />
                  <stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-lg text-[var(--foreground)]">
              SupaSquad
            </span>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'text-[var(--foreground)] bg-[var(--surface)]'
                        : 'text-[var(--foreground-light)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                    }
                  `}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[var(--surface)] transition-colors"
            >
              <Avatar
                src={profile?.avatar_url}
                alt={getDisplayName()}
                fallback={getDisplayName()}
                size="sm"
              />
              <span className="text-sm text-[var(--foreground-light)] hidden sm:block">
                {getDisplayName()}
              </span>
              <svg
                className={`w-4 h-4 text-[var(--foreground-lighter)] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-1 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground-light)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signOut()
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--foreground-light)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {isLoading ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
