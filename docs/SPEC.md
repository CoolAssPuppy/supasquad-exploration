# SupaSquad - Community Management Tool

## Overview

SupaSquad is a community management platform for Supabase advocates and contributors. It enables community members to report their activities, earn points, and compete on leaderboards while building the Supabase community.

## User stories

### Authentication

- As a visitor, I can see a hero page with the tagline "Build the Supabase community. Earn prizes and recognition."
- As a visitor, I can click "Login with Supabase" to authenticate
- As an authenticated user, I can access the Feed, Report, and Profile sections

### Feed

- As an authenticated user, I can view a reverse-chronological list of all community activities
- As an authenticated user, I can see who reported each activity, what they did, and when
- As an authenticated user, I can see a leaderboard in the right 1/3 of the screen showing top contributors by points

### Report

- As an authenticated user, I can submit a new activity from a predefined list
- As an authenticated user, I can fill out minimal required details for each activity type
- As an authenticated user, I see my activity appear in the feed after submission

### Profile

- As an authenticated user, I can update my avatar, first name, last name, city, and country
- As an authenticated user, I can link my Discord, LinkedIn, GitHub, and Twitter accounts via OAuth
- As an authenticated user, I can see which social accounts are currently linked

## Activity types and points

| Activity | Points | Required fields |
|----------|--------|-----------------|
| Published a blog post | 50 | URL, title |
| Submitted a CFP | 25 | Conference name, talk title |
| Spoke at a conference | 100 | Event name, talk title, date |
| Spoke at a meetup | 75 | Event name, talk title, date |
| Hosted a meetup | 100 | Event name, location, date, attendee count |
| Supported a customer | 25 | Description |
| Contributed to Supabase OSS | 75 | PR URL, description |
| Created a video tutorial | 75 | URL, title |
| Wrote documentation | 50 | URL or PR link, description |
| Organized a workshop | 100 | Event name, date, attendee count |
| Mentored a developer | 50 | Description |
| Created a starter template | 50 | Repository URL, description |
| Built an integration | 75 | Repository URL, description |
| Answered community questions | 25 | Platform (Discord/GitHub/StackOverflow), count |

## Database schema

### Tables

#### profiles

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| email | text | User email |
| first_name | text | User first name |
| last_name | text | User last name |
| avatar_url | text | Avatar image URL |
| city | text | User city |
| country | text | User country |
| created_at | timestamptz | Profile creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### social_connections

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles.id |
| provider | text | OAuth provider (discord, linkedin, github, twitter) |
| provider_user_id | text | User ID from the provider |
| access_token | text | Encrypted OAuth access token |
| refresh_token | text | Encrypted OAuth refresh token |
| token_expires_at | timestamptz | Token expiration timestamp |
| created_at | timestamptz | Connection creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### activities

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles.id |
| activity_type | text | Type of activity from predefined list |
| title | text | Activity title |
| description | text | Activity description |
| url | text | Related URL (optional) |
| event_name | text | Event name (for talks/meetups) |
| event_date | date | Event date (for talks/meetups) |
| location | text | Location (for meetups) |
| attendee_count | integer | Number of attendees |
| points | integer | Points earned for this activity |
| created_at | timestamptz | Activity submission timestamp |

### Row Level Security policies

- Users can read all activities (for the feed)
- Users can only create activities for themselves
- Users can only update/delete their own activities
- Users can only read/update their own profile
- Users can only manage their own social connections

## UI components

### Hero section

- Full-width hero with dark gradient background
- SupaSquad shield logo (Superman shield with Supabase lightning bolt)
- Headline: "Build the Supabase community. Earn prizes and recognition."
- Left-aligned "Login with Supabase" button with Supabase brand green color
- Supabase-style typography and spacing

### Navigation (authenticated state)

- Top navigation bar with SupaSquad logo
- Three nav items: Feed, Report, Profile
- User avatar/name in the right corner
- Logout option

### Feed page

- Two-column layout (2/3 + 1/3)
- Left: Reverse-chronological activity cards
  - User avatar, name
  - Activity type badge
  - Activity details
  - Points earned
  - Relative timestamp
- Right: Leaderboard panel
  - Top 10 users by total points
  - Rank, avatar, name, total points
  - Current user highlighted if in top 10

### Report page

- Activity type selector (cards or dropdown)
- Dynamic form based on activity type
- Minimal required fields per activity
- Submit button with loading state
- Success/error feedback

### Profile page

- Avatar upload with preview
- Form fields: first name, last name, city, country
- Social connections section
  - Four buttons: Discord, LinkedIn, GitHub, Twitter
  - Shows connected/not connected state
  - OAuth flow on click

## Design system

### Colors (matching Supabase)

- Brand green: hsl(153, 60%, 53%)
- Background: hsl(0, 0%, 7%)
- Surface: hsl(0, 0%, 12%)
- Border: hsl(0, 0%, 18%)
- Foreground: hsl(0, 0%, 98%)
- Foreground light: hsl(0, 0%, 71%)
- Foreground lighter: hsl(0, 0%, 54%)

### Typography

- Font family: System fonts (Inter or similar)
- Headings: Bold, varying sizes
- Body: Regular, 14-16px

### Spacing

- Consistent 4px grid
- Section padding: 24-48px
- Card padding: 16-24px
- Gap between elements: 8-16px

## Technical implementation

### Stack

- Next.js 14+ with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Supabase for database, auth, and storage
- React context for auth state

### File structure

```
src/
  app/
    page.tsx              # Hero/landing page
    (authenticated)/
      layout.tsx          # Auth-protected layout with nav
      feed/
        page.tsx          # Feed page
      report/
        page.tsx          # Report page
      profile/
        page.tsx          # Profile page
  components/
    ui/                   # Reusable UI components (Button, Card, etc.)
    Hero.tsx              # Landing page hero section
    Navigation.tsx        # Main navigation component
    ActivityCard.tsx      # Activity feed card
    Leaderboard.tsx       # Points leaderboard
    ActivityForm.tsx      # Activity submission form
    ProfileForm.tsx       # Profile edit form
    SocialButtons.tsx     # OAuth social connection buttons
  lib/
    supabase/
      client.ts           # Supabase browser client
      server.ts           # Supabase server client
      middleware.ts       # Auth middleware
    constants/
      activityPoints.ts   # Activity types and points
    utils/
      formatDate.ts       # Date formatting utilities
  types/
    database.ts           # Generated Supabase types
    index.ts              # Shared type definitions
```

## Mock authentication

For initial development, use a mock authentication flow:
- Hardcoded user: dev@supasquad.local
- Login button sets authenticated state in context
- Real Supabase OAuth will be implemented later

## Future enhancements

- Edge Functions for automated point calculation from linked accounts
- Weekly/monthly leaderboards
- Achievement badges
- Activity verification by admins
- Export activity history
- Team/organization support
