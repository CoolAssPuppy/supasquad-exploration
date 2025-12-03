import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  decodeBase64,
  encodeBase64,
} from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

const PROVIDER_CONFIGS: Record<
  Provider,
  {
    tokenUrl: string
    clientIdEnv: string
    clientSecretEnv: string
    supportsRefresh: boolean
  }
> = {
  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    clientIdEnv: 'DISCORD_CLIENT_ID',
    clientSecretEnv: 'DISCORD_CLIENT_SECRET',
    supportsRefresh: true,
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    supportsRefresh: true,
  },
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    supportsRefresh: false,
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientIdEnv: 'TWITTER_CLIENT_ID',
    clientSecretEnv: 'TWITTER_CLIENT_SECRET',
    supportsRefresh: true,
  },
}

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Uint8Array | null {
  const key = Deno.env.get('TOKEN_ENCRYPTION_KEY')
  if (!key) {
    return null
  }
  return decodeBase64(key)
}

async function decryptToken(encryptedData: string): Promise<string> {
  const keyData = getEncryptionKey()
  if (!keyData) {
    // No encryption key configured, return as-is
    return encryptedData
  }

  try {
    const combined = decodeBase64(encryptedData)

    const iv = combined.slice(0, IV_LENGTH)
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH)

    // Combine ciphertext and authTag for WebCrypto API
    const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length)
    ciphertextWithTag.set(ciphertext)
    ciphertextWithTag.set(authTag, ciphertext.length)

    const key = await crypto.subtle.importKey('raw', keyData, { name: ALGORITHM }, false, [
      'decrypt',
    ])

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
      key,
      ciphertextWithTag
    )

    return new TextDecoder().decode(decrypted)
  } catch {
    // Token might be plaintext (pre-migration), return as-is
    console.warn('Failed to decrypt token - may be plaintext from before encryption was enabled')
    return encryptedData
  }
}

async function encryptToken(plaintext: string): Promise<string> {
  const keyData = getEncryptionKey()
  if (!keyData) {
    // No encryption key configured, return as-is
    return plaintext
  }

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const key = await crypto.subtle.importKey('raw', keyData, { name: ALGORITHM }, false, ['encrypt'])

  const encoded = new TextEncoder().encode(plaintext)

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    encoded
  )

  // WebCrypto returns ciphertext + authTag combined
  const encryptedArray = new Uint8Array(encrypted)
  const ciphertext = encryptedArray.slice(0, -AUTH_TAG_LENGTH)
  const authTag = encryptedArray.slice(-AUTH_TAG_LENGTH)

  // Combine IV + AuthTag + Ciphertext
  const combined = new Uint8Array(IV_LENGTH + AUTH_TAG_LENGTH + ciphertext.length)
  combined.set(iv)
  combined.set(authTag, IV_LENGTH)
  combined.set(ciphertext, IV_LENGTH + AUTH_TAG_LENGTH)

  return encodeBase64(combined)
}

async function refreshProviderToken(
  provider: Provider,
  refreshToken: string
): Promise<TokenResponse | null> {
  const config = PROVIDER_CONFIGS[provider]

  if (!config.supportsRefresh) {
    return null
  }

  const clientId = Deno.env.get(config.clientIdEnv)
  const clientSecret = Deno.env.get(config.clientSecretEnv)

  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${provider}`)
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (provider === 'twitter') {
    const credentials = btoa(`${clientId}:${clientSecret}`)
    headers['Authorization'] = `Basic ${credentials}`
  } else {
    params.set('client_id', clientId)
    params.set('client_secret', clientSecret)
  }

  if (provider === 'github') {
    headers['Accept'] = 'application/json'
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Token refresh failed for ${provider}:`, error)
    return null
  }

  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!authHeader?.includes(expectedKey || '')) {
      console.warn('Refresh tokens called without service role key')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find tokens that are expiring within 24 hours
    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: connections, error: fetchError } = await supabase
      .from('social_connections')
      .select('*')
      .not('refresh_token', 'is', null)
      .not('token_expires_at', 'is', null)
      .lt('token_expires_at', expirationThreshold)

    if (fetchError) {
      throw new Error(`Failed to fetch connections: ${fetchError.message}`)
    }

    console.log(`Found ${connections?.length || 0} tokens to refresh`)

    const results = {
      refreshed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const connection of connections || []) {
      const provider = connection.provider as Provider

      if (!PROVIDER_CONFIGS[provider]?.supportsRefresh) {
        results.skipped++
        continue
      }

      try {
        // Decrypt the refresh token
        const decryptedRefreshToken = await decryptToken(connection.refresh_token)

        const newTokens = await refreshProviderToken(provider, decryptedRefreshToken)

        if (!newTokens) {
          results.failed++
          results.errors.push(`${provider}:${connection.user_id} - No tokens returned`)
          continue
        }

        // Encrypt the new tokens
        const encryptedAccessToken = await encryptToken(newTokens.access_token)
        const encryptedRefreshToken = newTokens.refresh_token
          ? await encryptToken(newTokens.refresh_token)
          : connection.refresh_token

        const tokenExpiresAt = newTokens.expires_in
          ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          : null

        const { error: updateError } = await supabase
          .from('social_connections')
          .update({
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
            token_expires_at: tokenExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)

        if (updateError) {
          results.failed++
          results.errors.push(`${provider}:${connection.user_id} - ${updateError.message}`)
        } else {
          results.refreshed++
          console.log(`Refreshed token for ${provider}:${connection.user_id}`)
        }
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`${provider}:${connection.user_id} - ${errorMessage}`)
      }
    }

    console.log('Token refresh complete:', results)

    return new Response(JSON.stringify(results), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})
