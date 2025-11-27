'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

// Mock user for development - will be replaced with real Supabase auth
const MOCK_USER_EMAIL = 'prashant_sridharan@hotmail.com'
const MOCK_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isMockAuth: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMockAuth, setIsMockAuth] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession) {
          setSession(existingSession)
          setUser(existingSession.user)
          await fetchProfile(existingSession.user.id)
        } else {
          // Check for mock auth in localStorage
          const mockAuth = localStorage.getItem('supasquad_mock_auth')
          if (mockAuth === 'true') {
            setIsMockAuth(true)
            // Create a mock user object
            const mockUser = {
              id: MOCK_USER_ID,
              email: MOCK_USER_EMAIL,
              created_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
            } as User
            setUser(mockUser)
            // Fetch real profile from database
            await fetchProfile(MOCK_USER_ID)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
          setIsMockAuth(false)
          localStorage.removeItem('supasquad_mock_auth')
        } else if (!isMockAuth) {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signIn = async () => {
    // For now, use mock auth
    // Later, this will be replaced with real Supabase OAuth
    setIsLoading(true)
    try {
      // Mock authentication
      localStorage.setItem('supasquad_mock_auth', 'true')
      const mockUser = {
        id: MOCK_USER_ID,
        email: MOCK_USER_EMAIL,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
      } as User
      setUser(mockUser)
      setIsMockAuth(true)
      // Fetch real profile from database
      await fetchProfile(MOCK_USER_ID)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      if (isMockAuth) {
        localStorage.removeItem('supasquad_mock_auth')
        setUser(null)
        setProfile(null)
        setIsMockAuth(false)
      } else {
        await supabase.auth.signOut()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isMockAuth,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
