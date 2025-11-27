'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProfileForm } from '@/components/ProfileForm'
import { SocialButtons } from '@/components/SocialButtons'

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = useState(false)

  const notification = useMemo(() => {
    if (dismissed) return null

    const oauth = searchParams.get('oauth')
    const provider = searchParams.get('provider')
    const message = searchParams.get('message')

    if (oauth === 'success' && provider) {
      return {
        type: 'success' as const,
        message: `Successfully connected your ${provider} account!`,
      }
    } else if (oauth === 'error') {
      return {
        type: 'error' as const,
        message: message || 'Failed to connect account. Please try again.',
      }
    }
    return null
  }, [searchParams, dismissed])

  const dismissNotification = useCallback(() => {
    setDismissed(true)
  }, [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(dismissNotification, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, dismissNotification])

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Profile settings
        </h1>
        <p className="mt-1 text-[var(--foreground-lighter)]">
          Manage your account and connected services
        </p>
      </div>

      {notification && (
        <div
          className={`
            mb-6 p-4 rounded-lg
            ${
              notification.type === 'success'
                ? 'bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]'
                : 'bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)]'
            }
          `}
        >
          {notification.message}
        </div>
      )}

      <div className="space-y-6">
        <ProfileForm />
        <SocialButtons />
      </div>
    </div>
  )
}
