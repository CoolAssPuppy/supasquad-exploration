'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import type { SocialConnection } from '@/types/database'

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface SocialConfig {
  provider: Provider
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const socialConfigs: SocialConfig[] = [
  {
    provider: 'discord',
    label: 'Discord',
    color: 'bg-[#5865F2] hover:bg-[#4752C4]',
    description: 'Track your Discord community engagement',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    provider: 'linkedin',
    label: 'LinkedIn',
    color: 'bg-[#0A66C2] hover:bg-[#004182]',
    description: 'Share your professional activities',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    provider: 'github',
    label: 'GitHub',
    color: 'bg-[#24292e] hover:bg-[#1b1f23]',
    description: 'Track your open source contributions',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    provider: 'twitter',
    label: 'Twitter',
    color: 'bg-[#1DA1F2] hover:bg-[#0c85d0]',
    description: 'Monitor your Twitter engagement',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
      </svg>
    ),
  },
]

function formatTokenExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiration'

  const expiry = new Date(expiresAt)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs < 0) return 'Expired'

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays > 7) return `Expires in ${diffDays} days`
  if (diffDays > 0) return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`

  return 'Expires soon'
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

export function SocialButtons() {
  const { user, isMockAuth } = useAuth()
  const supabase = createClient()
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState<Provider | null>(null)
  const [disconnectDialog, setDisconnectDialog] = useState<{
    isOpen: boolean
    provider: Provider | null
    label: string
  }>({ isOpen: false, provider: null, label: '' })
  const [error, setError] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Error fetching connections:', fetchError)
      return
    }

    setConnections(data || [])
  }, [user, supabase])

  useEffect(() => {
    if (user && !isMockAuth) {
      fetchConnections()
    }
  }, [user, isMockAuth, fetchConnections])

  const handleConnect = async (provider: Provider) => {
    if (isMockAuth) {
      alert(`OAuth flow for ${provider} would start here. (Mock mode)`)
      return
    }

    setLoading(provider)
    setError(null)

    // Redirect to the OAuth connect endpoint
    window.location.href = `/api/auth/connect?provider=${provider}&redirect=/profile`
  }

  const openDisconnectDialog = (provider: Provider, label: string) => {
    setDisconnectDialog({ isOpen: true, provider, label })
  }

  const closeDisconnectDialog = () => {
    setDisconnectDialog({ isOpen: false, provider: null, label: '' })
  }

  const handleDisconnect = async () => {
    const { provider } = disconnectDialog
    if (!user || isMockAuth || !provider) return

    setLoading(provider)
    setError(null)

    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      setConnections((prev) => prev.filter((c) => c.provider !== provider))
      closeDisconnectDialog()
    } catch (err) {
      console.error(`Error disconnecting ${provider}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setLoading(null)
    }
  }

  const handleReconnect = (provider: Provider) => {
    // Re-use the connect flow to refresh tokens
    handleConnect(provider)
  }

  const isConnected = (provider: Provider) => {
    return connections.some((c) => c.provider === provider)
  }

  const getConnection = (provider: Provider) => {
    return connections.find((c) => c.provider === provider)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">Social connections</h2>
          <p className="text-sm text-[var(--foreground-lighter)]">
            Link your accounts to automatically track your community activities
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {socialConfigs.map((social) => {
              const connected = isConnected(social.provider)
              const connection = getConnection(social.provider)
              const isLoading = loading === social.provider
              const expired = connection && isTokenExpired(connection.token_expires_at)

              return (
                <div
                  key={social.provider}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${social.color} text-white`}>{social.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--foreground)]">{social.label}</p>
                        {connected && (
                          <span
                            className={`
                              text-xs px-1.5 py-0.5 rounded-full
                              ${
                                expired
                                  ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                                  : 'bg-[var(--success)]/10 text-[var(--success)]'
                              }
                            `}
                          >
                            {expired ? 'Expired' : 'Connected'}
                          </span>
                        )}
                      </div>
                      {connected && connection?.provider_username ? (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-[var(--foreground-lighter)]">
                            @{connection.provider_username}
                          </p>
                          {connection.token_expires_at && (
                            <span className="text-xs text-[var(--foreground-muted)]">
                              {formatTokenExpiry(connection.token_expires_at)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {social.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {connected ? (
                      <>
                        {expired && (
                          <Button
                            variant="warning"
                            size="small"
                            onClick={() => handleReconnect(social.provider)}
                            isLoading={isLoading}
                          >
                            Reconnect
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => openDisconnectDialog(social.provider, social.label)}
                          disabled={isLoading}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleConnect(social.provider)}
                        isLoading={isLoading}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-[var(--foreground-lighter)]">
            Connected accounts are used to automatically sync your activity data. Your tokens are
            encrypted and stored securely.
          </p>
        </CardContent>
      </Card>

      <Dialog
        isOpen={disconnectDialog.isOpen}
        onClose={closeDisconnectDialog}
        title={`Disconnect ${disconnectDialog.label}?`}
        description={`This will remove your ${disconnectDialog.label} connection and stop syncing activity data from this account. You can reconnect at any time.`}
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        onConfirm={handleDisconnect}
        isLoading={loading === disconnectDialog.provider}
        variant="danger"
      />
    </>
  )
}
