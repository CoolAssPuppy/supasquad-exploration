import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revokeAllTokens } from '@/lib/oauth/revoke'
import { decryptTokenSafe } from '@/lib/crypto/tokens'

type Provider = 'discord' | 'linkedin' | 'github' | 'twitter'

const VALID_PROVIDERS = new Set<Provider>(['discord', 'linkedin', 'github', 'twitter'])

function isValidProvider(provider: string): provider is Provider {
  return VALID_PROVIDERS.has(provider as Provider)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body as { provider: string }

    // Validate provider
    if (!provider || !isValidProvider(provider)) {
      return NextResponse.json({ error: 'Invalid or missing provider' }, { status: 400 })
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the connection to get tokens for revocation
    const { data: connection, error: fetchError } = await supabase
      .from('social_connections')
      .select('id, access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Decrypt tokens for revocation
    const accessToken = connection.access_token
      ? decryptTokenSafe(connection.access_token)
      : null
    const refreshToken = connection.refresh_token
      ? decryptTokenSafe(connection.refresh_token)
      : null

    // Attempt to revoke tokens at the provider
    // We do this before deleting from DB so we have the tokens available
    const revokeResult = await revokeAllTokens(provider, accessToken, refreshToken)

    if (!revokeResult.success) {
      // Log the error but continue with deletion
      // The user wants to disconnect, and the tokens will become invalid
      // when we delete them from our DB anyway
      console.warn(`Token revocation failed for ${provider}:`, revokeResult.error)
    }

    // Delete the connection from the database
    const { error: deleteError } = await supabase
      .from('social_connections')
      .delete()
      .eq('id', connection.id)

    if (deleteError) {
      console.error(`Failed to delete connection for ${provider}:`, deleteError)
      return NextResponse.json(
        { error: 'Failed to disconnect. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${provider}`,
      tokenRevoked: revokeResult.success,
    })
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
