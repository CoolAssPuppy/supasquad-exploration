# OAuth setup guide

This guide walks you through setting up OAuth applications for SupaSquad social connections.

## Prerequisites

- A Supabase project with the SupaSquad schema deployed
- Access to developer portals for each platform
- Your app's production URL (or `http://localhost:3000` for development)

## Security architecture

The OAuth implementation includes multiple layers of security:

### CSRF protection
- State parameter is signed with HMAC-SHA256
- Double-submit cookie pattern validates the state on callback
- State tokens expire after 5 minutes

### Token encryption
- Access and refresh tokens are encrypted using AES-256-GCM before database storage
- Encryption is enforced in production (fails if `TOKEN_ENCRYPTION_KEY` is missing)
- Development mode falls back to plaintext for local testing convenience

### PKCE (Proof Key for Code Exchange)
- Twitter uses S256 PKCE code challenge/verifier
- PKCE verifier is stored in an HttpOnly cookie (not in URL) for security
- Cookie is cleared after use during the callback

### Additional security measures
- Token revocation at provider when disconnecting
- Open redirect prevention with URL validation
- Row Level Security (RLS) policies on database

## Environment variables

After creating each OAuth app, add the credentials to your `.env.local` file:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Security Keys (REQUIRED for production)
# Generate with: openssl rand -base64 32
TOKEN_ENCRYPTION_KEY=your-32-byte-base64-encoded-key

# Generate with: openssl rand -hex 32
OAUTH_STATE_SECRET=your-random-secret-string

# App URL (REQUIRED for production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# OAuth Provider Credentials
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### Security key requirements

**TOKEN_ENCRYPTION_KEY**
- Must be exactly 32 bytes when decoded from base64
- Required in production (app will throw error if missing)
- Generate with: `openssl rand -base64 32`

**OAUTH_STATE_SECRET**
- Used for signing OAuth state parameters
- Required for OAuth flows to work
- Generate with: `openssl rand -hex 32`

## Provider setup

### 1. Discord

#### Create Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter name: `SupaSquad` and click "Create"
4. Go to the "OAuth2" section in the left sidebar

#### Configure OAuth2

1. Click "Add Redirect" and enter:
   - Development: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://yourdomain.com/api/auth/callback/discord`

2. Required scopes: `identify`, `email`, `guilds`

3. Copy your credentials:
   - Client ID: Found at the top of the OAuth2 page
   - Client Secret: Click "Reset Secret" to generate

#### Token details

- Access tokens expire after 7 days
- Refresh tokens do not expire but can be revoked

### 2. LinkedIn

#### Create LinkedIn application

1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in app details and create

#### Configure OAuth2

1. Go to the "Auth" tab
2. Add Authorized redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback/linkedin`
   - Production: `https://yourdomain.com/api/auth/callback/linkedin`

3. Request Products (in Products tab):
   - "Share on LinkedIn" - For posting capabilities
   - "Sign In with LinkedIn using OpenID Connect" - For authentication

4. Required scopes: `openid`, `profile`, `email`, `w_member_social`

#### Token details

- Access tokens expire after 60 days
- Refresh tokens expire after 365 days

### 3. GitHub

#### Create GitHub OAuth app

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" > "New OAuth App"
3. Fill in:
   - Application name: `SupaSquad`
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://yourdomain.com/api/auth/callback/github`

4. Generate client secret after creation

#### Required scopes

`read:user`, `user:email`, `public_repo`

#### Token details

- Access tokens do not expire by default
- No refresh token mechanism

### 4. Twitter/X

#### Create Twitter developer account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign up for a developer account (may take a few days for approval)
3. Create a Project and App

#### Configure OAuth 2.0

1. Go to your App's settings
2. Click "Edit" under "User authentication settings"
3. Configure:
   - App permissions: "Read and write"
   - Type of App: "Web App, Automated App or Bot"
   - Callback URLs:
     - Development: `http://localhost:3000/api/auth/callback/twitter`
     - Production: `https://yourdomain.com/api/auth/callback/twitter`

#### Required scopes

`tweet.read`, `tweet.write`, `users.read`, `offline.access`

#### Token details

- Access tokens expire after 2 hours
- Refresh tokens expire after 6 months

## Testing OAuth flows

1. Start your development server: `npm run dev`
2. Navigate to the Profile page
3. Click "Connect" on any social platform
4. Complete the OAuth flow
5. Verify the connection appears with your username

### Troubleshooting

**Invalid redirect URI**: Ensure your callback URLs match exactly (including trailing slashes)

**Scope errors**: Verify you've requested the correct products/scopes in each developer portal

**"Security validation failed"**: The CSRF cookie may have expired. Try again.

**"TOKEN_ENCRYPTION_KEY is required"**: Set the environment variable in production

## Production checklist

- [ ] All OAuth apps created with production callback URLs
- [ ] `TOKEN_ENCRYPTION_KEY` generated and set
- [ ] `OAUTH_STATE_SECRET` generated and set
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] All provider credentials added to hosting platform
- [ ] RLS policies verified on `social_connections` table
