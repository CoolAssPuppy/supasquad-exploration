# Social Connections Implementation Plan

## Current State Assessment

After thorough exploration, the OAuth implementation is **85% complete** with solid security fundamentals:

### What's Already Working
- OAuth connect flow with CSRF protection (HMAC-SHA256 signed state)
- PKCE implementation for Twitter (S256 method)
- Token encryption with AES-256-GCM
- All 4 provider configurations (Discord, LinkedIn, GitHub, Twitter)
- Callback handling with proper token exchange
- Token revocation on disconnect
- Database schema with RLS policies
- Comprehensive test coverage

### Critical Gaps for Production

1. **No .env.example file** - Vercel deployment requires knowing all env vars
2. **Silent encryption fallback** - `encryptTokenSafe()` falls back to plaintext without failing
3. **No startup validation** - App starts even with missing critical env vars
4. **PKCE verifier in state URL** - Minor security concern (signed, but visible in URL)

## Implementation Plan

### Phase 1: Environment Configuration (Critical)

**1.1 Create .env.example file**
- Document all required environment variables
- Include generation commands for security keys
- Separate required vs optional variables

**1.2 Add environment validation utility**
- Create `/src/lib/config/env.ts`
- Validate all required OAuth variables at import time
- Fail fast with clear error messages in production
- Allow graceful degradation in development only

### Phase 2: Security Hardening

**2.1 Store PKCE verifier in HttpOnly cookie** (instead of state URL)
- Modify `/src/app/api/auth/connect/route.ts`
- Modify `/src/lib/oauth/handleCallback.ts`
- Create `setPkceVerifierCookie` and `getPkceVerifierCookie` helpers
- More secure than passing in URL (even though signed)

**2.2 Enforce token encryption in production**
- Modify `encryptTokenSafe()` to throw in production without key
- Keep development fallback for local testing

### Phase 3: UI Polish

**3.1 Improve error handling in SocialButtons**
- Parse OAuth error parameters from URL
- Display user-friendly error messages
- Auto-clear error parameters from URL after displaying

**3.2 Add success notifications**
- Toast/notification for successful connection
- Auto-clear success parameters from URL

### Phase 4: Testing and Validation

**4.1 Add integration tests for OAuth flows**
- Test connect route with mock auth
- Test callback handling with mock tokens
- Test disconnect flow

**4.2 Add environment validation tests**
- Test that validation fails correctly with missing vars
- Test that app starts correctly with all vars

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OAuth Providers (all 4 required for full functionality)
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Security Keys (REQUIRED in production)
TOKEN_ENCRYPTION_KEY=   # openssl rand -base64 32
OAUTH_STATE_SECRET=     # openssl rand -hex 32

# App Configuration
NEXT_PUBLIC_APP_URL=    # https://your-domain.com
```

## Files to Create/Modify

### New Files
- `.env.example` - Environment variable template
- `src/lib/config/env.ts` - Environment validation

### Modified Files
- `src/app/api/auth/connect/route.ts` - PKCE cookie storage
- `src/lib/oauth/handleCallback.ts` - PKCE cookie retrieval
- `src/lib/oauth/state.ts` - Add PKCE cookie helpers
- `src/lib/crypto/tokens.ts` - Production enforcement
- `src/components/SocialButtons.tsx` - Error display improvements

## Risk Mitigation

1. **Backward compatibility** - All changes are additive, no breaking changes
2. **Graceful degradation** - Development mode still works without all vars
3. **Clear errors** - Any misconfiguration shows actionable error message
4. **Tested flows** - Existing test suite validates core functionality

## Success Criteria

1. App starts successfully on Vercel with all env vars configured
2. OAuth flow completes for all 4 providers without errors
3. Tokens are encrypted in database
4. Error states are handled gracefully with user feedback
5. Disconnect flow revokes tokens and cleans up database
