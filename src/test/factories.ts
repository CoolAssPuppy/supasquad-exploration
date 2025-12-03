import type {
  Profile,
  Activity,
  SocialConnection,
  PendingActivity,
  ActivityWithProfile,
  LeaderboardEntry,
  ActivityTypeEnum,
} from '@/types/database'

/**
 * Factory functions for creating test data.
 * All factories return complete, valid objects with sensible defaults.
 * Use overrides to customize specific fields for test cases.
 */

// Unique ID generator for test data
let idCounter = 0
const generateId = (): string => `test-id-${++idCounter}`
const generateUUID = (): string =>
  `${generateId()}-${Math.random().toString(36).substring(2, 9)}`

// Reset counter between test files if needed
export const resetIdCounter = (): void => {
  idCounter = 0
}

/**
 * Creates a mock Profile with sensible defaults
 */
export const createProfile = (overrides?: Partial<Profile>): Profile => {
  const id = overrides?.id ?? generateUUID()
  return {
    id,
    email: `user-${id.substring(0, 8)}@example.com`,
    first_name: 'Test',
    last_name: 'User',
    avatar_url: null,
    city: 'San Francisco',
    country: 'United States',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Creates a mock Activity with sensible defaults
 */
export const createActivity = (overrides?: Partial<Activity>): Activity => {
  const id = overrides?.id ?? generateUUID()
  return {
    id,
    user_id: overrides?.user_id ?? generateUUID(),
    activity_type: 'blog_post',
    title: 'Test Activity',
    description: 'A test activity description',
    url: 'https://example.com/activity',
    event_name: null,
    event_date: null,
    location: null,
    attendee_count: null,
    platform: null,
    answer_count: null,
    points: 50,
    request_amplification: false,
    amplification_url: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Creates a mock SocialConnection with sensible defaults
 */
export const createSocialConnection = (
  overrides?: Partial<SocialConnection>
): SocialConnection => {
  const id = overrides?.id ?? generateUUID()
  const provider = overrides?.provider ?? 'github'
  return {
    id,
    user_id: overrides?.user_id ?? generateUUID(),
    provider,
    provider_user_id: `${provider}-user-123`,
    provider_username: `${provider}user`,
    access_token: 'encrypted-access-token',
    refresh_token: 'encrypted-refresh-token',
    token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Creates a mock PendingActivity with sensible defaults
 */
export const createPendingActivity = (
  overrides?: Partial<PendingActivity>
): PendingActivity => {
  const id = overrides?.id ?? generateUUID()
  return {
    id,
    user_id: overrides?.user_id ?? generateUUID(),
    provider: 'github',
    provider_activity_id: `gh-activity-${id.substring(0, 8)}`,
    activity_type: 'oss_contribution',
    title: 'Pending Activity',
    description: 'A pending activity from automated ingestion',
    url: 'https://github.com/example/repo/pull/1',
    event_name: null,
    event_date: null,
    location: null,
    attendee_count: null,
    platform: 'GitHub',
    answer_count: null,
    suggested_points: 50,
    status: 'pending',
    ingested_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Creates a mock ActivityWithProfile (activity joined with profile data)
 */
export const createActivityWithProfile = (
  overrides?: Partial<ActivityWithProfile>
): ActivityWithProfile => {
  const profile = createProfile()
  const activity = createActivity({ user_id: profile.id })

  return {
    ...activity,
    profiles: {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
    },
    ...overrides,
  }
}

/**
 * Creates a mock LeaderboardEntry
 */
export const createLeaderboardEntry = (
  overrides?: Partial<LeaderboardEntry>
): LeaderboardEntry => {
  return {
    user_id: generateUUID(),
    email: 'leader@example.com',
    first_name: 'Top',
    last_name: 'Contributor',
    avatar_url: null,
    total_points: 500,
    rank: 1,
    ...overrides,
  }
}

/**
 * Creates multiple leaderboard entries with proper ranking
 */
export const createLeaderboard = (count: number): LeaderboardEntry[] => {
  return Array.from({ length: count }, (_, i) =>
    createLeaderboardEntry({
      rank: i + 1,
      total_points: 1000 - i * 100,
      first_name: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
    })
  )
}

/**
 * Valid activity types for testing
 */
export const VALID_ACTIVITY_TYPES: ActivityTypeEnum[] = [
  'blog_post',
  'cfp_submission',
  'conference_talk',
  'meetup_talk',
  'hosted_meetup',
  'customer_support',
  'oss_contribution',
  'video_tutorial',
  'documentation',
  'workshop',
  'mentorship',
  'starter_template',
  'integration',
  'community_answers',
]

/**
 * Valid OAuth providers
 */
export const VALID_PROVIDERS = ['discord', 'linkedin', 'github', 'twitter'] as const
export type Provider = (typeof VALID_PROVIDERS)[number]

/**
 * Creates mock OAuth state payload
 */
export const createOAuthStatePayload = (
  overrides?: Partial<{
    userId: string
    redirectUrl: string
    provider: Provider
    csrf: string
    exp: number
    codeVerifier?: string
  }>
) => {
  return {
    userId: generateUUID(),
    redirectUrl: '/profile',
    provider: 'github' as Provider,
    csrf: 'test-csrf-token-base64url',
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    ...overrides,
  }
}

/**
 * Creates mock Supabase user object
 */
export const createSupabaseUser = (
  overrides?: Partial<{
    id: string
    email: string
    created_at: string
  }>
) => {
  const id = overrides?.id ?? generateUUID()
  return {
    id,
    email: overrides?.email ?? `${id.substring(0, 8)}@example.com`,
    created_at: overrides?.created_at ?? new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  }
}

/**
 * Creates mock Supabase session object
 */
export const createSupabaseSession = (
  overrides?: Partial<{
    access_token: string
    refresh_token: string
    expires_at: number
  }>
) => {
  const user = createSupabaseUser()
  return {
    access_token: overrides?.access_token ?? 'test-access-token',
    refresh_token: overrides?.refresh_token ?? 'test-refresh-token',
    expires_at: overrides?.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  }
}
