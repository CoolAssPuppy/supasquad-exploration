import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY from: supabase status')
  process.exit(1)
}

// Use service role to bypass RLS for this dev script
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const activities = [
  {
    user_id: '33333333-3333-3333-3333-333333333333', // Diana Prince
    activity_type: 'conference_talk',
    title: 'Keynote: Building Communities with Supabase',
    description: 'Delivered keynote at Women in Tech Summit on community building',
    url: 'https://womenintechsummit.com/talks/diana-prince',
    event_name: 'Women in Tech Summit 2024',
    event_date: new Date().toISOString().split('T')[0],
    location: 'Washington DC',
    attendee_count: 500,
    points: 100,
  },
  {
    user_id: '33333333-3333-3333-3333-333333333333', // Diana Prince
    activity_type: 'hosted_meetup',
    title: 'DC Supabase Meetup #5',
    description: 'Monthly community meetup with hands-on workshops',
    event_name: 'DC Supabase Meetup',
    event_date: new Date().toISOString().split('T')[0],
    location: 'Washington DC, USA',
    attendee_count: 60,
    points: 100,
  },
  {
    user_id: '99999999-9999-9999-9999-999999999999', // Oliver Queen
    activity_type: 'video_tutorial',
    title: 'Supabase for Enterprise: Complete Guide',
    description: 'Comprehensive video series on enterprise Supabase deployment',
    url: 'https://youtube.com/watch?v=queen-enterprise',
    points: 75,
  },
  {
    user_id: '33333333-3333-3333-3333-333333333333', // Diana Prince
    activity_type: 'oss_contribution',
    title: 'Added accessibility improvements to Supabase Dashboard',
    description: 'Implemented WCAG 2.1 AA compliance features',
    url: 'https://github.com/supabase/supabase/pull/9999',
    points: 75,
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222', // Clark Kent
    activity_type: 'blog_post',
    title: 'Breaking: Supabase Announces New AI Features',
    description: 'Exclusive coverage of the latest Supabase AI announcements',
    url: 'https://dailyplanet.com/tech/supabase-ai',
    points: 50,
    request_amplification: true,
    amplification_url: 'https://twitter.com/clarkkent/status/999999',
  },
]

async function insertActivity(activity: typeof activities[0], index: number) {
  console.log(`[${index + 1}/5] Inserting: "${activity.title}"`)

  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...activity,
      created_at: new Date().toISOString(),
    })
    .select()

  if (error) {
    console.error(`  Error: ${error.message}`)
  } else {
    console.log(`  Success! Activity added for user ${activity.user_id.slice(0, 8)}...`)
  }
}

async function main() {
  console.log('Starting Realtime test - inserting 5 activities spaced 20 seconds apart\n')
  console.log('Watch the feed page to see updates appear in real-time!\n')

  for (let i = 0; i < activities.length; i++) {
    await insertActivity(activities[i], i)

    if (i < activities.length - 1) {
      console.log(`  Waiting 20 seconds...\n`)
      await new Promise(resolve => setTimeout(resolve, 20000))
    }
  }

  console.log('\nDone! All 5 activities inserted.')
  console.log('Diana Prince: +275 points (3 activities)')
  console.log('Oliver Queen: +75 points (1 activity)')
  console.log('Clark Kent: +50 points (1 activity)')
}

main().catch(console.error)
