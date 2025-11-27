import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/oauth/handleCallback'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    const errorUrl = new URL('/profile', request.nextUrl.origin)
    errorUrl.searchParams.set('oauth', 'error')
    errorUrl.searchParams.set('message', error)
    return NextResponse.redirect(errorUrl)
  }

  if (!code || !state) {
    const errorUrl = new URL('/profile', request.nextUrl.origin)
    errorUrl.searchParams.set('oauth', 'error')
    errorUrl.searchParams.set('message', 'Missing code or state')
    return NextResponse.redirect(errorUrl)
  }

  const result = await handleOAuthCallback(
    'linkedin',
    code,
    state,
    request.nextUrl.origin
  )

  return NextResponse.redirect(result.redirectUrl)
}
