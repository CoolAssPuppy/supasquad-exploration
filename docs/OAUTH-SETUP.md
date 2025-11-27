# OAuth Setup Guide

This guide walks you through setting up OAuth applications for SupaSquad social connections.

## Prerequisites

- A Supabase project with the SupaSquad schema deployed
- Access to developer portals for each platform
- Your app's production URL (or `http://localhost:3000` for development)

## Environment Variables

After creating each OAuth app, add the credentials to your `.env.local` file:

```bash
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Twitter/X OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

Also add these to your Supabase project's Edge Function secrets.

---

## 1. Discord

### Create Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter name: `SupaSquad` and click "Create"
4. Go to the "OAuth2" section in the left sidebar

### Configure OAuth2

1. Click "Add Redirect" and enter:
   - Development: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://yourdomain.com/api/auth/callback/discord`

2. Under "OAuth2 URL Generator":
   - Scopes: `identify`, `email`, `guilds`
   - Note: These scopes allow reading user info and Discord server memberships

3. Copy your credentials:
   - Client ID: Found at the top of the OAuth2 page
   - Client Secret: Click "Reset Secret" to generate

### Token Details

- Access tokens expire after 7 days
- Refresh tokens do not expire but can be revoked
- Token refresh endpoint: `https://discord.com/api/oauth2/token`

---

## 2. LinkedIn

### Create LinkedIn Application

1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in:
   - App name: `SupaSquad`
   - LinkedIn Page: Select or create a company page
   - App logo: Upload your logo
   - Legal agreement: Accept terms
4. Click "Create app"

### Configure OAuth2

1. Go to the "Auth" tab
2. Under "OAuth 2.0 settings", add Authorized redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback/linkedin`
   - Production: `https://yourdomain.com/api/auth/callback/linkedin`

3. Request Products (in Products tab):
   - "Share on LinkedIn" - For posting capabilities
   - "Sign In with LinkedIn using OpenID Connect" - For authentication

4. Copy your credentials from the Auth tab:
   - Client ID
   - Client Secret (click eye icon to reveal)

### Required Scopes

```
openid
profile
email
w_member_social  # For posting/sharing
```

### Token Details

- Access tokens expire after 60 days
- Refresh tokens expire after 365 days
- Token refresh endpoint: `https://www.linkedin.com/oauth/v2/accessToken`

---

## 3. GitHub

### Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" in the sidebar
3. Click "New OAuth App"
4. Fill in:
   - Application name: `SupaSquad`
   - Homepage URL: `https://yourdomain.com` (or `http://localhost:3000`)
   - Authorization callback URL:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://yourdomain.com/api/auth/callback/github`
5. Click "Register application"

### Generate Client Secret

1. On the app page, click "Generate a new client secret"
2. Copy the secret immediately (it won't be shown again)
3. Copy the Client ID from the same page

### Required Scopes

```
read:user       # Read user profile
user:email      # Access email addresses
public_repo     # Read public repositories (for OSS contributions)
```

### Token Details

- Access tokens do not expire by default
- Tokens can be set to expire after a configured period
- No refresh token mechanism - users re-authenticate when token expires

---

## 4. Twitter/X

### Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign up for a developer account if you haven't already
3. Complete the application process (may take a few days for approval)

### Create Project and App

1. Click "Create Project"
2. Fill in project details:
   - Name: `SupaSquad`
   - Use case: Select appropriate option
3. Create an App within the project

### Configure OAuth 2.0

1. Go to your App's settings
2. Click "Edit" under "User authentication settings"
3. Configure:
   - App permissions: "Read and write"
   - Type of App: "Web App, Automated App or Bot"
   - Callback URLs:
     - Development: `http://localhost:3000/api/auth/callback/twitter`
     - Production: `https://yourdomain.com/api/auth/callback/twitter`
   - Website URL: Your app's URL

### Get Credentials

1. Go to "Keys and tokens" tab
2. Under "OAuth 2.0 Client ID and Client Secret":
   - Copy Client ID
   - Click "Regenerate" to get Client Secret

### Required Scopes

```
tweet.read
tweet.write
users.read
offline.access  # For refresh tokens
```

### Token Details

- Access tokens expire after 2 hours
- Refresh tokens expire after 6 months (if offline.access scope is granted)
- Token refresh endpoint: `https://api.twitter.com/2/oauth2/token`

---

## Supabase Edge Function Secrets

Add all OAuth credentials as secrets in your Supabase project:

```bash
# Using Supabase CLI
supabase secrets set DISCORD_CLIENT_ID=xxx
supabase secrets set DISCORD_CLIENT_SECRET=xxx
supabase secrets set LINKEDIN_CLIENT_ID=xxx
supabase secrets set LINKEDIN_CLIENT_SECRET=xxx
supabase secrets set GITHUB_CLIENT_ID=xxx
supabase secrets set GITHUB_CLIENT_SECRET=xxx
supabase secrets set TWITTER_CLIENT_ID=xxx
supabase secrets set TWITTER_CLIENT_SECRET=xxx
```

Or via the Supabase Dashboard:
1. Go to Project Settings > Edge Functions
2. Add each secret under "Edge Function Secrets"

---

## Token Storage Security

Tokens are stored in the `social_connections` table with the following security measures:

1. **Row Level Security (RLS)**: Users can only access their own connections
2. **Encrypted at rest**: Supabase encrypts all data at rest
3. **Secure transmission**: All API calls use HTTPS

### Token Refresh Strategy

The `refresh-tokens` Edge Function runs on a schedule to:

1. Check for tokens expiring within 24 hours
2. Refresh tokens using the provider's refresh endpoint
3. Update the `social_connections` table with new tokens
4. Log any failures for monitoring

To set up the scheduled refresh:

```sql
-- In Supabase SQL Editor, create a pg_cron job
select cron.schedule(
  'refresh-social-tokens',
  '0 */6 * * *',  -- Every 6 hours
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/refresh-tokens',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);
```

---

## Testing OAuth Flows

1. Start your development server: `npm run dev`
2. Navigate to the Profile page
3. Click "Connect" on any social platform
4. Complete the OAuth flow
5. Verify the connection appears with your username

### Troubleshooting

**Invalid redirect URI**: Ensure your callback URLs match exactly (including trailing slashes)

**Scope errors**: Verify you've requested the correct products/scopes in each developer portal

**Token refresh failures**: Check Edge Function logs in Supabase Dashboard

---

## Production Checklist

- [ ] All OAuth apps created with production URLs
- [ ] Environment variables set in Vercel/hosting platform
- [ ] Supabase Edge Function secrets configured
- [ ] Token refresh cron job scheduled
- [ ] RLS policies verified on `social_connections` table
- [ ] Error monitoring configured for OAuth failures
