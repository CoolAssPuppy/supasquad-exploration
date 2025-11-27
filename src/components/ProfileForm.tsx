'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

export function ProfileForm() {
  const { user, profile, isMockAuth } = useAuth()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setCity(profile.city || '')
      setCountry(profile.country || '')
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (!user) {
        throw new Error('You must be logged in to update your profile')
      }

      if (isMockAuth) {
        setMessage({ type: 'success', text: 'Profile updated successfully! (Mock mode)' })
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          city,
          country,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      console.error('Error updating profile:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (isMockAuth) {
      // For mock auth, create a local URL
      const localUrl = URL.createObjectURL(file)
      setAvatarUrl(localUrl)
      return
    }

    try {
      setIsLoading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setMessage({
        type: 'error',
        text: 'Failed to upload avatar',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = firstName || user?.email?.split('@')[0] || 'User'

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-[var(--foreground)]">Profile settings</h2>
        <p className="text-sm text-[var(--foreground-lighter)]">
          Update your profile information
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarUrl}
              alt={displayName}
              fallback={displayName}
              size="xl"
            />
            <div>
              <label
                htmlFor="avatar"
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Upload avatar
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                />
              </label>
              <p className="mt-1 text-xs text-[var(--foreground-lighter)]">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          <Input
            id="email"
            label="Email"
            value={user?.email || ''}
            disabled
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="firstName"
              label="First name"
              placeholder="Your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              id="lastName"
              label="Last name"
              placeholder="Your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="city"
              label="City"
              placeholder="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              id="country"
              label="Country"
              placeholder="Your country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {message && (
            <div
              className={`
                p-3 rounded-md
                ${
                  message.type === 'success'
                    ? 'bg-[var(--success)]/10 border border-[var(--success)]/20'
                    : 'bg-[var(--destructive)]/10 border border-[var(--destructive)]/20'
                }
              `}
            >
              <p
                className={`
                  text-sm
                  ${message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}
                `}
              >
                {message.text}
              </p>
            </div>
          )}

          <Button type="submit" isLoading={isLoading}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
