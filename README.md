# SupaSquad

A community engagement platform built with Next.js and Supabase. Track and reward community contributions across Discord, LinkedIn, GitHub, and Twitter.

## Features

- **Activity tracking**: Log community contributions like blog posts, OSS commits, Discord help, and social engagement
- **Points system**: Earn points for different types of community activities
- **Leaderboard**: See top contributors and compete with other community members
- **Social connections**: Link your Discord, LinkedIn, GitHub, and Twitter accounts
- **Activity feed**: View recent community activity from all members

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest with React Testing Library
- **Language**: TypeScript

## Getting started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/coolasspuppy/supasquad.git
cd supasquad
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
# ============================================
# SupaSquad Environment Variables
# ============================================

# Supabase Configuration (REQUIRED)
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Security Keys (REQUIRED for production)
# Generate with: openssl rand -base64 32
TOKEN_ENCRYPTION_KEY=your-32-byte-base64-encoded-key

# Generate with: openssl rand -hex 32
OAUTH_STATE_SECRET=your-random-secret-string

# App Configuration
# Set to your production URL (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Provider Credentials (optional for local development)
# See docs/OAUTH-SETUP.md for detailed setup instructions
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
```

### 4. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations (schema setup)
3. Enable Row Level Security policies

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project structure

```
src/
  app/                    # Next.js App Router pages
    (authenticated)/      # Protected routes
      feed/               # Activity feed page
      profile/            # User profile page
      program/            # Program information
      share/              # Share activity page
    api/                  # API routes
      auth/               # OAuth endpoints
  components/             # React components
    ui/                   # Reusable UI components
  lib/                    # Utilities and business logic
    auth/                 # Authentication context
    config/               # Environment configuration
    crypto/               # Token encryption
    oauth/                # OAuth flow handlers
  types/                  # TypeScript type definitions
  utils/                  # Supabase client utilities
docs/                     # Documentation
  OAUTH-SETUP.md          # OAuth provider setup guide
```

## OAuth setup

To enable social connections, you need to create OAuth applications with each provider:

1. **Discord**: [Developer Portal](https://discord.com/developers/applications)
2. **LinkedIn**: [Developer Portal](https://www.linkedin.com/developers/apps)
3. **GitHub**: [Developer Settings](https://github.com/settings/developers)
4. **Twitter**: [Developer Portal](https://developer.twitter.com/en/portal/dashboard)

See [docs/OAUTH-SETUP.md](docs/OAUTH-SETUP.md) for detailed setup instructions.

### Callback URLs

Register these callback URLs with each provider:

| Provider | Development | Production |
|----------|-------------|------------|
| Discord | `http://localhost:3000/api/auth/callback/discord` | `https://yourdomain.com/api/auth/callback/discord` |
| LinkedIn | `http://localhost:3000/api/auth/callback/linkedin` | `https://yourdomain.com/api/auth/callback/linkedin` |
| GitHub | `http://localhost:3000/api/auth/callback/github` | `https://yourdomain.com/api/auth/callback/github` |
| Twitter | `http://localhost:3000/api/auth/callback/twitter` | `https://yourdomain.com/api/auth/callback/twitter` |

## Security

The application implements several security measures:

- **Token encryption**: OAuth tokens are encrypted with AES-256-GCM before storage
- **CSRF protection**: OAuth state is signed with HMAC-SHA256 and validated with cookies
- **PKCE**: Twitter OAuth uses S256 PKCE for enhanced security
- **RLS policies**: Database access is controlled by Supabase Row Level Security

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

### Required environment variables for production

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
TOKEN_ENCRYPTION_KEY          # Required - will fail without it
OAUTH_STATE_SECRET            # Required for OAuth flows
NEXT_PUBLIC_APP_URL           # Your production domain
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
TWITTER_CLIENT_ID
TWITTER_CLIENT_SECRET
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

The project uses Vitest with React Testing Library. Test files are colocated with their source files using the `.test.ts` or `.test.tsx` extension.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit your changes: `git commit -m "Add my feature"`
7. Push to the branch: `git push origin feature/my-feature`
8. Open a pull request

## License

This project is private and proprietary.
