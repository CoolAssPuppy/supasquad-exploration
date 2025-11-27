'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Hero } from '@/components/Hero'
import { useAuth } from '@/lib/auth/AuthContext'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is logged in, redirect to feed
    if (!isLoading && user) {
      router.push('/feed')
    }
  }, [user, isLoading, router])

  // Show hero for logged out users
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <Hero />
}
