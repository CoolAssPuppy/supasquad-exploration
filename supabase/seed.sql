-- Seed data for SupaSquad
-- Uses DC Comics characters with realistic activity patterns

-- First, create users in auth.users (required for foreign key)
-- Using deterministic UUIDs based on character names for reproducibility

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  -- US-based characters
  ('11111111-1111-1111-1111-111111111111', 'bruce.wayne@waynetech.com', crypt('password123', gen_salt('bf')), now(), now() - interval '8 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('22222222-2222-2222-2222-222222222222', 'clark.kent@dailyplanet.com', crypt('password123', gen_salt('bf')), now(), now() - interval '7 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('33333333-3333-3333-3333-333333333333', 'diana.prince@themyscira.gov', crypt('password123', gen_salt('bf')), now(), now() - interval '6 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('44444444-4444-4444-4444-444444444444', 'barry.allen@ccpd.gov', crypt('password123', gen_salt('bf')), now(), now() - interval '5 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('55555555-5555-5555-5555-555555555555', 'arthur.curry@atlantis.gov', crypt('password123', gen_salt('bf')), now(), now() - interval '4 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('66666666-6666-6666-6666-666666666666', 'victor.stone@startech.io', crypt('password123', gen_salt('bf')), now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('77777777-7777-7777-7777-777777777777', 'hal.jordan@ferrisair.com', crypt('password123', gen_salt('bf')), now(), now() - interval '2 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('88888888-8888-8888-8888-888888888888', 'dinah.lance@birdsofprey.org', crypt('password123', gen_salt('bf')), now(), now() - interval '6 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('99999999-9999-9999-9999-999999999999', 'oliver.queen@queenind.com', crypt('password123', gen_salt('bf')), now(), now() - interval '5 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'kara.danvers@catco.media', crypt('password123', gen_salt('bf')), now(), now() - interval '4 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  -- EU-based characters
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'john.constantine@hellblazer.uk', crypt('password123', gen_salt('bf')), now(), now() - interval '5 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'zatanna.zatara@shadowcrest.it', crypt('password123', gen_salt('bf')), now(), now() - interval '4 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'jaime.reyes@kord.es', crypt('password123', gen_salt('bf')), now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'renee.montoya@gcpd.fr', crypt('password123', gen_salt('bf')), now(), now() - interval '6 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('12121212-1212-1212-1212-121212121212', 'kate.kane@kane.de', crypt('password123', gen_salt('bf')), now(), now() - interval '4 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('13131313-1313-1313-1313-131313131313', 'garfield.logan@doom.nl', crypt('password123', gen_salt('bf')), now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{}'),
  -- Mock user for development
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dev@supasquad.local', crypt('password123', gen_salt('bf')), now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

-- Create profiles for each user
INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, city, country, created_at, updated_at)
VALUES
  -- US-based characters
  ('11111111-1111-1111-1111-111111111111', 'bruce.wayne@waynetech.com', 'Bruce', 'Wayne', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruce', 'Gotham City', 'USA', now() - interval '8 months', now()),
  ('22222222-2222-2222-2222-222222222222', 'clark.kent@dailyplanet.com', 'Clark', 'Kent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=clark', 'Metropolis', 'USA', now() - interval '7 months', now()),
  ('33333333-3333-3333-3333-333333333333', 'diana.prince@themyscira.gov', 'Diana', 'Prince', 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', 'Washington DC', 'USA', now() - interval '6 months', now()),
  ('44444444-4444-4444-4444-444444444444', 'barry.allen@ccpd.gov', 'Barry', 'Allen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=barry', 'Central City', 'USA', now() - interval '5 months', now()),
  ('55555555-5555-5555-5555-555555555555', 'arthur.curry@atlantis.gov', 'Arthur', 'Curry', 'https://api.dicebear.com/7.x/avataaars/svg?seed=arthur', 'Amnesty Bay', 'USA', now() - interval '4 months', now()),
  ('66666666-6666-6666-6666-666666666666', 'victor.stone@startech.io', 'Victor', 'Stone', 'https://api.dicebear.com/7.x/avataaars/svg?seed=victor', 'Detroit', 'USA', now() - interval '3 months', now()),
  ('77777777-7777-7777-7777-777777777777', 'hal.jordan@ferrisair.com', 'Hal', 'Jordan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hal', 'Coast City', 'USA', now() - interval '2 months', now()),
  ('88888888-8888-8888-8888-888888888888', 'dinah.lance@birdsofprey.org', 'Dinah', 'Lance', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dinah', 'Star City', 'USA', now() - interval '6 months', now()),
  ('99999999-9999-9999-9999-999999999999', 'oliver.queen@queenind.com', 'Oliver', 'Queen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=oliver', 'Star City', 'USA', now() - interval '5 months', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'kara.danvers@catco.media', 'Kara', 'Danvers', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kara', 'National City', 'USA', now() - interval '4 months', now()),
  -- EU-based characters
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'john.constantine@hellblazer.uk', 'John', 'Constantine', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 'London', 'United Kingdom', now() - interval '5 months', now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'zatanna.zatara@shadowcrest.it', 'Zatanna', 'Zatara', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zatanna', 'Rome', 'Italy', now() - interval '4 months', now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'jaime.reyes@kord.es', 'Jaime', 'Reyes', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jaime', 'Barcelona', 'Spain', now() - interval '3 months', now()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'renee.montoya@gcpd.fr', 'Renee', 'Montoya', 'https://api.dicebear.com/7.x/avataaars/svg?seed=renee', 'Paris', 'France', now() - interval '6 months', now()),
  ('12121212-1212-1212-1212-121212121212', 'kate.kane@kane.de', 'Kate', 'Kane', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate', 'Berlin', 'Germany', now() - interval '4 months', now()),
  ('13131313-1313-1313-1313-131313131313', 'garfield.logan@doom.nl', 'Garfield', 'Logan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=garfield', 'Amsterdam', 'Netherlands', now() - interval '3 months', now()),
  -- Mock user for development
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dev@supasquad.local', 'Prashant', 'Sridharan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=prashant', 'San Francisco', 'USA', now() - interval '3 months', now())
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  avatar_url = EXCLUDED.avatar_url,
  city = EXCLUDED.city,
  country = EXCLUDED.country;

-- Activities for Bruce Wayne (power user - lots of OSS and technical content)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 6 months ago
  ('11111111-1111-1111-1111-111111111111', 'oss_contribution', 'Added dark mode support to supabase-js', 'Implemented comprehensive dark mode theming for the Supabase JavaScript client', 'https://github.com/supabase/supabase-js/pull/842', null, null, null, null, null, null, 75, now() - interval '6 months' - interval '12 days', false, null),
  ('11111111-1111-1111-1111-111111111111', 'blog_post', 'Building real-time dashboards with Supabase', 'Deep dive into using Supabase Realtime for live analytics dashboards', 'https://dev.to/brucewayne/realtime-dashboards-supabase', null, null, null, null, null, null, 50, now() - interval '6 months' - interval '3 days', true, 'https://twitter.com/brucewayne/status/123456'),
  -- 5 months ago
  ('11111111-1111-1111-1111-111111111111', 'conference_talk', 'Securing Your Supabase Application', 'Presented best practices for Row Level Security at GothamJS', 'https://gothamjs.com/talks/supabase-security', 'GothamJS 2024', (now() - interval '5 months')::date, 'Gotham City', 450, null, null, 100, now() - interval '5 months' - interval '8 days', false, null),
  ('11111111-1111-1111-1111-111111111111', 'community_answers', 'Discord support session', 'Answered questions about RLS policies and auth flows', null, null, null, null, null, 'discord', 15, 25, now() - interval '5 months' - interval '20 days', false, null),
  -- 4 months ago
  ('11111111-1111-1111-1111-111111111111', 'starter_template', 'Supabase + Next.js Enterprise Template', 'Production-ready template with auth, RLS, and CI/CD', 'https://github.com/brucewayne/supabase-enterprise-starter', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '5 days', true, 'https://twitter.com/brucewayne/status/234567'),
  ('11111111-1111-1111-1111-111111111111', 'oss_contribution', 'Fixed edge function timeout handling', 'Improved error handling for long-running edge functions', 'https://github.com/supabase/supabase/pull/1234', null, null, null, null, null, null, 75, now() - interval '4 months' - interval '18 days', false, null),
  -- 3 months ago
  ('11111111-1111-1111-1111-111111111111', 'video_tutorial', 'Supabase Auth Deep Dive', 'Comprehensive video tutorial covering all auth methods', 'https://youtube.com/watch?v=abc123', null, null, null, null, null, null, 75, now() - interval '3 months' - interval '7 days', true, 'https://linkedin.com/posts/brucewayne-123'),
  ('11111111-1111-1111-1111-111111111111', 'mentorship', 'Mentored junior developer on Supabase', 'Weekly sessions helping a bootcamp grad build their first Supabase app', null, null, null, null, null, null, null, 50, now() - interval '3 months' - interval '22 days', false, null),
  -- 2 months ago
  ('11111111-1111-1111-1111-111111111111', 'blog_post', 'Migrating from Firebase to Supabase', 'Step-by-step guide with code examples and gotchas', 'https://dev.to/brucewayne/firebase-to-supabase', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '10 days', true, 'https://twitter.com/brucewayne/status/345678'),
  ('11111111-1111-1111-1111-111111111111', 'hosted_meetup', 'Gotham Supabase Meetup #3', 'Monthly meetup with lightning talks and networking', null, 'Gotham Supabase Meetup', (now() - interval '2 months')::date, 'Gotham City, USA', 45, null, null, 100, now() - interval '2 months' - interval '15 days', false, null),
  -- 1 month ago
  ('11111111-1111-1111-1111-111111111111', 'oss_contribution', 'Added TypeScript strict mode support', 'Updated type definitions for better DX', 'https://github.com/supabase/supabase-js/pull/901', null, null, null, null, null, null, 75, now() - interval '1 month' - interval '5 days', false, null),
  ('11111111-1111-1111-1111-111111111111', 'community_answers', 'Stack Overflow contributions', 'Answered Supabase questions on SO', null, null, null, null, null, 'stackoverflow', 8, 25, now() - interval '1 month' - interval '18 days', false, null),
  -- This month
  ('11111111-1111-1111-1111-111111111111', 'documentation', 'Improved RLS documentation', 'Added more examples and common patterns to RLS docs', 'https://github.com/supabase/supabase/pull/2001', null, null, null, null, null, null, 50, now() - interval '5 days', false, null);

-- Activities for Clark Kent (content creator - blogs and videos)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 6 months ago
  ('22222222-2222-2222-2222-222222222222', 'blog_post', 'Why I switched from AWS to Supabase', 'Personal journey and cost comparison', 'https://medium.com/@clarkkent/aws-to-supabase', null, null, null, null, null, null, 50, now() - interval '6 months' - interval '8 days', true, 'https://twitter.com/clarkkent/status/111111'),
  -- 5 months ago
  ('22222222-2222-2222-2222-222222222222', 'video_tutorial', 'Supabase Storage Tutorial', 'Complete guide to file uploads and management', 'https://youtube.com/watch?v=def456', null, null, null, null, null, null, 75, now() - interval '5 months' - interval '15 days', true, 'https://linkedin.com/posts/clarkkent-456'),
  ('22222222-2222-2222-2222-222222222222', 'community_answers', 'Discord help session', 'Helped newcomers with storage questions', null, null, null, null, null, 'discord', 12, 25, now() - interval '5 months' - interval '25 days', false, null),
  -- 4 months ago
  ('22222222-2222-2222-2222-222222222222', 'meetup_talk', 'Supabase for News Applications', 'Talked about real-time features for media apps', null, 'Metropolis Tech Meetup', (now() - interval '4 months')::date, 'Metropolis', 80, null, null, 75, now() - interval '4 months' - interval '10 days', false, null),
  -- 3 months ago
  ('22222222-2222-2222-2222-222222222222', 'blog_post', 'Building a CMS with Supabase', 'Tutorial on creating a headless CMS', 'https://medium.com/@clarkkent/supabase-cms', null, null, null, null, null, null, 50, now() - interval '3 months' - interval '5 days', true, 'https://twitter.com/clarkkent/status/222222'),
  ('22222222-2222-2222-2222-222222222222', 'customer_support', 'Helped Daily Planet migrate to Supabase', 'Assisted the tech team with their migration', null, null, null, null, null, null, null, 25, now() - interval '3 months' - interval '20 days', false, null),
  -- 2 months ago
  ('22222222-2222-2222-2222-222222222222', 'video_tutorial', 'Supabase Edge Functions Explained', 'Beginner-friendly edge functions tutorial', 'https://youtube.com/watch?v=ghi789', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '12 days', true, 'https://linkedin.com/posts/clarkkent-789'),
  -- 1 month ago
  ('22222222-2222-2222-2222-222222222222', 'blog_post', 'Supabase vs PlanetScale: A Fair Comparison', 'Honest comparison of both platforms', 'https://medium.com/@clarkkent/supabase-vs-planetscale', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '8 days', true, 'https://twitter.com/clarkkent/status/333333'),
  -- This month
  ('22222222-2222-2222-2222-222222222222', 'community_answers', 'GitHub Discussions support', 'Answered questions about auth and storage', null, null, null, null, null, 'github', 6, 25, now() - interval '3 days', false, null);

-- Activities for Diana Prince (community builder - meetups and workshops)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 5 months ago
  ('33333333-3333-3333-3333-333333333333', 'hosted_meetup', 'DC Women in Tech: Supabase Workshop', 'Intro workshop for women developers', null, 'Women in Tech DC', (now() - interval '5 months')::date, 'Washington DC, USA', 65, null, null, 100, now() - interval '5 months' - interval '7 days', false, null),
  ('33333333-3333-3333-3333-333333333333', 'blog_post', 'Getting Started with Supabase Auth', 'Beginner guide to authentication', 'https://dev.to/dianaprince/supabase-auth-guide', null, null, null, null, null, null, 50, now() - interval '5 months' - interval '20 days', true, 'https://linkedin.com/posts/dianaprince-111'),
  -- 4 months ago
  ('33333333-3333-3333-3333-333333333333', 'workshop', 'Supabase Fundamentals Workshop', 'Full-day hands-on workshop', null, 'Supabase Fundamentals', (now() - interval '4 months')::date, 'Washington DC', 30, null, null, 100, now() - interval '4 months' - interval '12 days', false, null),
  ('33333333-3333-3333-3333-333333333333', 'mentorship', 'Mentored 3 developers on Supabase', 'Group mentorship program', null, null, null, null, null, null, null, 50, now() - interval '4 months' - interval '25 days', false, null),
  -- 3 months ago
  ('33333333-3333-3333-3333-333333333333', 'conference_talk', 'Building Inclusive Tech Communities', 'Keynote about community building with Supabase as example', null, 'TechForGood Summit', (now() - interval '3 months')::date, 'San Francisco', 800, null, null, 100, now() - interval '3 months' - interval '5 days', true, 'https://twitter.com/dianaprince/status/444444'),
  ('33333333-3333-3333-3333-333333333333', 'community_answers', 'Discord mentorship', 'Guided new community members', null, null, null, null, null, 'discord', 20, 25, now() - interval '3 months' - interval '18 days', false, null),
  -- 2 months ago
  ('33333333-3333-3333-3333-333333333333', 'hosted_meetup', 'Supabase + AI Hackathon', 'Weekend hackathon event', null, 'Supabase AI Hack DC', (now() - interval '2 months')::date, 'Washington DC, USA', 50, null, null, 100, now() - interval '2 months' - interval '8 days', false, null),
  -- 1 month ago
  ('33333333-3333-3333-3333-333333333333', 'blog_post', 'Organizing Your First Tech Meetup', 'Tips for community organizers', 'https://dev.to/dianaprince/tech-meetup-tips', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '10 days', true, 'https://linkedin.com/posts/dianaprince-222'),
  -- This month
  ('33333333-3333-3333-3333-333333333333', 'workshop', 'Supabase for Startups Workshop', 'Workshop for early-stage founders', null, 'Startup Supabase', (now() - interval '4 days')::date, 'Washington DC', 25, null, null, 100, now() - interval '4 days', false, null);

-- Activities for Barry Allen (fast learner - diverse contributions)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 4 months ago
  ('44444444-4444-4444-4444-444444444444', 'oss_contribution', 'Improved query performance in realtime', 'Optimized subscription handling', 'https://github.com/supabase/realtime/pull/567', null, null, null, null, null, null, 75, now() - interval '4 months' - interval '5 days', false, null),
  ('44444444-4444-4444-4444-444444444444', 'blog_post', 'Speed Up Your Supabase Queries', 'Performance optimization tips', 'https://dev.to/barryallen/supabase-performance', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '18 days', true, 'https://twitter.com/barryallen/status/555555'),
  -- 3 months ago
  ('44444444-4444-4444-4444-444444444444', 'meetup_talk', 'Lightning Fast with Supabase', 'Talk about performance optimization', null, 'Central City Dev Meetup', (now() - interval '3 months')::date, 'Central City', 55, null, null, 75, now() - interval '3 months' - interval '10 days', false, null),
  ('44444444-4444-4444-4444-444444444444', 'community_answers', 'Quick responses on Discord', 'Fast answers to community questions', null, null, null, null, null, 'discord', 25, 25, now() - interval '3 months' - interval '22 days', false, null),
  -- 2 months ago
  ('44444444-4444-4444-4444-444444444444', 'integration', 'Supabase + Temporal.io Integration', 'Workflow integration for Supabase', 'https://github.com/barryallen/supabase-temporal', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '8 days', true, 'https://twitter.com/barryallen/status/666666'),
  ('44444444-4444-4444-4444-444444444444', 'video_tutorial', 'Quick Supabase Tips', 'Short-form tips video series', 'https://youtube.com/watch?v=jkl012', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '20 days', false, null),
  -- 1 month ago
  ('44444444-4444-4444-4444-444444444444', 'cfp_submission', 'Submitted to ReactConf', 'CFP about Supabase + React patterns', null, 'ReactConf 2025', null, null, null, null, null, 25, now() - interval '1 month' - interval '5 days', false, null),
  ('44444444-4444-4444-4444-444444444444', 'oss_contribution', 'Added connection pooling docs', 'Documented connection pooling best practices', 'https://github.com/supabase/supabase/pull/3456', null, null, null, null, null, null, 75, now() - interval '1 month' - interval '15 days', false, null),
  -- This month
  ('44444444-4444-4444-4444-444444444444', 'community_answers', 'Stack Overflow sprint', 'Answered many Supabase questions', null, null, null, null, null, 'stackoverflow', 12, 25, now() - interval '2 days', false, null);

-- Activities for Arthur Curry (occasional contributor)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 3 months ago
  ('55555555-5555-5555-5555-555555555555', 'blog_post', 'Supabase for Marine Research', 'Using Supabase to track ocean data', 'https://dev.to/arthurcurry/supabase-marine', null, null, null, null, null, null, 50, now() - interval '3 months' - interval '10 days', true, 'https://linkedin.com/posts/arthurcurry-333'),
  ('55555555-5555-5555-5555-555555555555', 'community_answers', 'Discord support', 'Helped with database design questions', null, null, null, null, null, 'discord', 8, 25, now() - interval '3 months' - interval '25 days', false, null),
  -- 1 month ago
  ('55555555-5555-5555-5555-555555555555', 'meetup_talk', 'Real-time Data in Research', 'Talk about using Supabase for science', null, 'Amnesty Bay Tech', (now() - interval '1 month')::date, 'Amnesty Bay', 30, null, null, 75, now() - interval '1 month' - interval '12 days', false, null),
  -- This month
  ('55555555-5555-5555-5555-555555555555', 'customer_support', 'Helped local research lab', 'Consulted on Supabase setup for lab', null, null, null, null, null, null, null, 25, now() - interval '6 days', false, null);

-- Activities for Victor Stone (technical - integrations and tools)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 2 months ago
  ('66666666-6666-6666-6666-666666666666', 'integration', 'Supabase VS Code Extension', 'Built a VS Code extension for Supabase', 'https://github.com/victorstone/supabase-vscode', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '5 days', true, 'https://twitter.com/victorstone/status/777777'),
  ('66666666-6666-6666-6666-666666666666', 'oss_contribution', 'Fixed CLI bug on Windows', 'Resolved path handling issue', 'https://github.com/supabase/cli/pull/789', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '18 days', false, null),
  -- 1 month ago
  ('66666666-6666-6666-6666-666666666666', 'blog_post', 'Automating Supabase with CI/CD', 'Guide to GitHub Actions integration', 'https://dev.to/victorstone/supabase-cicd', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '8 days', true, 'https://linkedin.com/posts/victorstone-444'),
  ('66666666-6666-6666-6666-666666666666', 'starter_template', 'Supabase + Electron Starter', 'Desktop app template', 'https://github.com/victorstone/supabase-electron', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '22 days', false, null),
  -- This month
  ('66666666-6666-6666-6666-666666666666', 'video_tutorial', 'Building Desktop Apps with Supabase', 'Tutorial on Electron integration', 'https://youtube.com/watch?v=mno345', null, null, null, null, null, null, 75, now() - interval '3 days', true, 'https://twitter.com/victorstone/status/888888');

-- Activities for Hal Jordan (newer member)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 1 month ago
  ('77777777-7777-7777-7777-777777777777', 'blog_post', 'My First Week with Supabase', 'Beginner perspective on getting started', 'https://dev.to/haljordan/first-week-supabase', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '5 days', true, 'https://twitter.com/haljordan/status/999999'),
  ('77777777-7777-7777-7777-777777777777', 'community_answers', 'Discord questions', 'Asked good questions that helped others', null, null, null, null, null, 'discord', 5, 25, now() - interval '1 month' - interval '20 days', false, null),
  -- This month
  ('77777777-7777-7777-7777-777777777777', 'cfp_submission', 'Coast City Tech Talk CFP', 'Submitted talk about learning Supabase', null, 'Coast City Tech', null, null, null, null, null, 25, now() - interval '8 days', false, null);

-- Activities for Dinah Lance (consistent community support)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 5 months ago
  ('88888888-8888-8888-8888-888888888888', 'community_answers', 'Discord moderation and support', 'Active community support', null, null, null, null, null, 'discord', 30, 25, now() - interval '5 months' - interval '10 days', false, null),
  ('88888888-8888-8888-8888-888888888888', 'mentorship', 'Mentored bootcamp graduates', 'Helped 5 new developers', null, null, null, null, null, null, null, 50, now() - interval '5 months' - interval '25 days', false, null),
  -- 4 months ago
  ('88888888-8888-8888-8888-888888888888', 'community_answers', 'GitHub Discussions support', 'Answered auth-related questions', null, null, null, null, null, 'github', 15, 25, now() - interval '4 months' - interval '8 days', false, null),
  ('88888888-8888-8888-8888-888888888888', 'blog_post', 'Supabase Auth Best Practices', 'Security-focused auth guide', 'https://dev.to/dinahlance/supabase-auth-security', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '20 days', true, 'https://twitter.com/dinahlance/status/101010'),
  -- 3 months ago
  ('88888888-8888-8888-8888-888888888888', 'community_answers', 'Stack Overflow contributions', 'Regular SO answers', null, null, null, null, null, 'stackoverflow', 10, 25, now() - interval '3 months' - interval '5 days', false, null),
  ('88888888-8888-8888-8888-888888888888', 'customer_support', 'Helped local startup', 'Consulting on Supabase implementation', null, null, null, null, null, null, null, 25, now() - interval '3 months' - interval '18 days', false, null),
  -- 2 months ago
  ('88888888-8888-8888-8888-888888888888', 'community_answers', 'Discord support month', 'Intensive community help', null, null, null, null, null, 'discord', 35, 25, now() - interval '2 months' - interval '10 days', false, null),
  -- 1 month ago
  ('88888888-8888-8888-8888-888888888888', 'mentorship', 'Women in Tech mentorship', 'Mentored 3 women developers', null, null, null, null, null, null, null, 50, now() - interval '1 month' - interval '12 days', false, null),
  -- This month
  ('88888888-8888-8888-8888-888888888888', 'community_answers', 'Discord support', 'Weekly support sessions', null, null, null, null, null, 'discord', 18, 25, now() - interval '2 days', false, null);

-- Activities for Oliver Queen (business-focused content)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 4 months ago
  ('99999999-9999-9999-9999-999999999999', 'blog_post', 'Supabase for Enterprise', 'Business case for Supabase adoption', 'https://dev.to/oliverqueen/supabase-enterprise', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '7 days', true, 'https://linkedin.com/posts/oliverqueen-555'),
  ('99999999-9999-9999-9999-999999999999', 'conference_talk', 'ROI of Open Source Databases', 'Business talk at StarTech Summit', null, 'StarTech Summit', (now() - interval '4 months')::date, 'Star City', 300, null, null, 100, now() - interval '4 months' - interval '20 days', false, null),
  -- 3 months ago
  ('99999999-9999-9999-9999-999999999999', 'customer_support', 'Helped Queen Industries migrate', 'Led internal migration project', null, null, null, null, null, null, null, 25, now() - interval '3 months' - interval '10 days', false, null),
  -- 2 months ago
  ('99999999-9999-9999-9999-999999999999', 'blog_post', 'Cost Analysis: Supabase vs Traditional DBaaS', 'Detailed cost comparison', 'https://dev.to/oliverqueen/supabase-cost-analysis', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '15 days', true, 'https://linkedin.com/posts/oliverqueen-666'),
  -- This month
  ('99999999-9999-9999-9999-999999999999', 'meetup_talk', 'Supabase in Production', 'Lessons from enterprise deployment', null, 'Star City Startup Meetup', (now() - interval '5 days')::date, 'Star City', 75, null, null, 75, now() - interval '5 days', false, null);

-- Activities for Kara Danvers (media and content focused)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 3 months ago
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'video_tutorial', 'Supabase for Content Creators', 'Building a media platform with Supabase', 'https://youtube.com/watch?v=pqr678', null, null, null, null, null, null, 75, now() - interval '3 months' - interval '8 days', true, 'https://twitter.com/karadanvers/status/121212'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'blog_post', 'Real-time Comments with Supabase', 'Building a comment system', 'https://dev.to/karadanvers/realtime-comments', null, null, null, null, null, null, 50, now() - interval '3 months' - interval '22 days', true, 'https://linkedin.com/posts/karadanvers-777'),
  -- 2 months ago
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'meetup_talk', 'Supabase for Media Apps', 'Talk about media platform architecture', null, 'National City Media Tech', (now() - interval '2 months')::date, 'National City', 60, null, null, 75, now() - interval '2 months' - interval '10 days', false, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'community_answers', 'Twitter support', 'Answered questions on Twitter', null, null, null, null, null, 'discord', 10, 25, now() - interval '2 months' - interval '25 days', false, null),
  -- 1 month ago
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'video_tutorial', 'File Uploads Done Right', 'Comprehensive storage tutorial', 'https://youtube.com/watch?v=stu901', null, null, null, null, null, null, 75, now() - interval '1 month' - interval '5 days', true, 'https://twitter.com/karadanvers/status/131313'),
  -- This month
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'blog_post', 'Building a Newsletter Platform', 'Full tutorial with code', 'https://dev.to/karadanvers/newsletter-supabase', null, null, null, null, null, null, 50, now() - interval '4 days', true, 'https://linkedin.com/posts/karadanvers-888');

-- Activities for John Constantine (UK - dark arts of debugging)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 4 months ago
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'blog_post', 'Debugging the Undead: Zombie Connections in Postgres', 'How to identify and kill zombie database connections', 'https://dev.to/johnconstantine/zombie-connections', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '10 days', true, 'https://twitter.com/hellblazer/status/666666'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'community_answers', 'Discord exorcisms', 'Helped debug complex RLS policy issues', null, null, null, null, null, 'discord', 18, 25, now() - interval '4 months' - interval '20 days', false, null),
  -- 3 months ago
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'meetup_talk', 'Dark Patterns in Database Design', 'Talk about anti-patterns to avoid', null, 'London Postgres Meetup', (now() - interval '3 months')::date, 'London', 85, null, null, 75, now() - interval '3 months' - interval '8 days', false, null),
  -- 2 months ago
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'oss_contribution', 'Fixed memory leak in edge functions runtime', 'Identified and patched a subtle memory leak', 'https://github.com/supabase/edge-runtime/pull/333', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '5 days', false, null),
  -- 1 month ago
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'blog_post', 'Summoning Data: Advanced Postgres Queries', 'Complex query patterns for real-world apps', 'https://dev.to/johnconstantine/advanced-queries', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '12 days', true, 'https://linkedin.com/posts/constantine-777'),
  -- This month
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'community_answers', 'GitHub Discussions help', 'Answered tricky debugging questions', null, null, null, null, null, 'github', 7, 25, now() - interval '3 days', false, null);

-- Activities for Zatanna Zatara (Italy - magical developer experience)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 3 months ago
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'video_tutorial', 'Supabase Magic: Zero to Production', 'Complete tutorial series in Italian', 'https://youtube.com/watch?v=magic123', null, null, null, null, null, null, 75, now() - interval '3 months' - interval '5 days', true, 'https://twitter.com/zatanna/status/111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'workshop', 'Supabase Workshop Roma', 'Hands-on workshop for Italian developers', null, 'Supabase Italia', (now() - interval '3 months')::date, 'Rome', 40, null, null, 100, now() - interval '3 months' - interval '18 days', false, null),
  -- 2 months ago
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'blog_post', 'Trasformare le Query con Supabase', 'Query optimization guide in Italian', 'https://dev.to/zatanna/query-transformation', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '10 days', true, 'https://linkedin.com/posts/zatanna-222'),
  -- 1 month ago
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'starter_template', 'Supabase + Nuxt.js Starter', 'Italian-localized starter template', 'https://github.com/zatanna/supabase-nuxt-it', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '7 days', false, null),
  -- This month
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'community_answers', 'Discord support in Italian', 'Helped Italian-speaking community members', null, null, null, null, null, 'discord', 12, 25, now() - interval '5 days', false, null);

-- Activities for Jaime Reyes (Spain - Blue Beetle tech)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 2 months ago
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'blog_post', 'Supabase para Principiantes', 'Beginner guide in Spanish', 'https://dev.to/jaimereyes/supabase-principiantes', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '8 days', true, 'https://twitter.com/bluebeetle/status/222222'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'community_answers', 'Spanish Discord channel', 'Active support in Spanish-speaking channels', null, null, null, null, null, 'discord', 20, 25, now() - interval '2 months' - interval '20 days', false, null),
  -- 1 month ago
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'meetup_talk', 'Introduccion a Supabase', 'Intro talk at Barcelona tech meetup', null, 'Barcelona Developers', (now() - interval '1 month')::date, 'Barcelona', 65, null, null, 75, now() - interval '1 month' - interval '10 days', false, null),
  -- This month
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'video_tutorial', 'Autenticacion con Supabase', 'Auth tutorial in Spanish', 'https://youtube.com/watch?v=escarabajo', null, null, null, null, null, null, 75, now() - interval '6 days', true, 'https://linkedin.com/posts/jaime-333');

-- Activities for Renee Montoya (France - detective-level debugging)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 5 months ago
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'conference_talk', 'Investigating Performance Issues', 'Detective approach to debugging Supabase apps', null, 'Paris Web', (now() - interval '5 months')::date, 'Paris', 400, null, null, 100, now() - interval '5 months' - interval '5 days', true, 'https://twitter.com/question/status/444444'),
  -- 4 months ago
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'blog_post', 'Le Guide Complet de RLS', 'Comprehensive RLS guide in French', 'https://dev.to/reneemontoya/guide-rls', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '12 days', true, 'https://linkedin.com/posts/renee-444'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'documentation', 'French translation for Supabase docs', 'Contributed French translations', 'https://github.com/supabase/supabase/pull/4567', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '25 days', false, null),
  -- 2 months ago
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'hosted_meetup', 'Supabase Paris Meetup #1', 'First Paris Supabase meetup', null, 'Supabase Paris', (now() - interval '2 months')::date, 'Paris, France', 55, null, null, 100, now() - interval '2 months' - interval '8 days', false, null),
  -- This month
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'community_answers', 'Stack Overflow en francais', 'Answered questions in French SO', null, null, null, null, null, 'stackoverflow', 9, 25, now() - interval '4 days', false, null);

-- Activities for Kate Kane (Germany - precision engineering)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 3 months ago
  ('12121212-1212-1212-1212-121212121212', 'oss_contribution', 'Improved TypeScript types for supabase-js', 'Added stricter type definitions', 'https://github.com/supabase/supabase-js/pull/555', null, null, null, null, null, null, 75, now() - interval '3 months' - interval '7 days', false, null),
  ('12121212-1212-1212-1212-121212121212', 'blog_post', 'Type-Safe Supabase mit TypeScript', 'German guide to type-safe Supabase', 'https://dev.to/katekane/typesafe-supabase', null, null, null, null, null, null, 50, now() - interval '3 months' - interval '20 days', true, 'https://twitter.com/batwoman/status/555555'),
  -- 2 months ago
  ('12121212-1212-1212-1212-121212121212', 'meetup_talk', 'Supabase in der Produktion', 'Production deployment talk', null, 'Berlin JS', (now() - interval '2 months')::date, 'Berlin', 120, null, null, 75, now() - interval '2 months' - interval '12 days', false, null),
  -- 1 month ago
  ('12121212-1212-1212-1212-121212121212', 'integration', 'Supabase + SvelteKit German Starter', 'Production-ready German starter kit', 'https://github.com/katekane/supabase-sveltekit-de', null, null, null, null, null, null, 75, now() - interval '1 month' - interval '5 days', true, 'https://linkedin.com/posts/kate-555'),
  -- This month
  ('12121212-1212-1212-1212-121212121212', 'community_answers', 'Discord precision support', 'Detailed technical answers', null, null, null, null, null, 'discord', 14, 25, now() - interval '2 days', false, null);

-- Activities for Garfield Logan (Netherlands - shapeshifting code)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 2 months ago
  ('13131313-1313-1313-1313-131313131313', 'blog_post', 'Supabase voor Beginners', 'Dutch beginner guide', 'https://dev.to/garfieldlogan/supabase-beginners-nl', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '10 days', true, 'https://twitter.com/beastboy/status/666666'),
  ('13131313-1313-1313-1313-131313131313', 'video_tutorial', 'Realtime Features Tutorial', 'Building realtime apps tutorial', 'https://youtube.com/watch?v=green123', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '22 days', true, 'https://linkedin.com/posts/gar-666'),
  -- 1 month ago
  ('13131313-1313-1313-1313-131313131313', 'meetup_talk', 'Flexible Database Design', 'Talk about adaptable schema patterns', null, 'Amsterdam Tech', (now() - interval '1 month')::date, 'Amsterdam', 70, null, null, 75, now() - interval '1 month' - interval '8 days', false, null),
  -- This month
  ('13131313-1313-1313-1313-131313131313', 'community_answers', 'Discord support', 'Helped with various questions', null, null, null, null, null, 'discord', 16, 25, now() - interval '3 days', false, null),
  ('13131313-1313-1313-1313-131313131313', 'oss_contribution', 'Added Dutch translations', 'Contributed Dutch language support', 'https://github.com/supabase/supabase/pull/6789', null, null, null, null, null, null, 75, now() - interval '1 day', false, null);

-- Create social connections for the current mock user (prashant)
-- This simulates having connected services
INSERT INTO public.social_connections (user_id, provider, provider_user_id, provider_username, created_at, updated_at)
SELECT
  p.id,
  'github',
  'gh_' || p.id,
  split_part(p.email, '@', 1),
  now() - interval '1 month',
  now()
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.social_connections (user_id, provider, provider_user_id, provider_username, created_at, updated_at)
SELECT
  p.id,
  'discord',
  'dc_' || p.id,
  split_part(p.email, '@', 1),
  now() - interval '1 month',
  now()
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.social_connections (user_id, provider, provider_user_id, provider_username, created_at, updated_at)
SELECT
  p.id,
  'twitter',
  'tw_' || p.id,
  split_part(p.email, '@', 1),
  now() - interval '2 weeks',
  now()
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local'
ON CONFLICT DO NOTHING;

-- Activities for Prashant Sridharan (mock user - varied activity types over 6 months)
INSERT INTO public.activities (user_id, activity_type, title, description, url, event_name, event_date, location, attendee_count, platform, answer_count, points, created_at, request_amplification, amplification_url)
VALUES
  -- 6 months ago
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'blog_post', 'Getting Started with Supabase Auth', 'A comprehensive guide to implementing authentication with Supabase', 'https://dev.to/prashant/supabase-auth-guide', null, null, null, null, null, null, 50, now() - interval '6 months' - interval '5 days', true, 'https://twitter.com/prashant/status/100001'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'community_answers', 'Discord support in #help channel', 'Answered questions about auth flows and RLS', null, null, null, null, null, 'discord', 10, 25, now() - interval '6 months' - interval '18 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'oss_contribution', 'Added React hooks for Supabase Realtime', 'Created useRealtime hook for easier subscription management', 'https://github.com/supabase/supabase-js/pull/555', null, null, null, null, null, null, 75, now() - interval '6 months' - interval '25 days', false, null),
  -- 5 months ago
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'meetup_talk', 'Building Real-time Apps with Supabase', 'Presented at SF DevOps Meetup on Supabase Realtime features', null, 'SF DevOps Meetup', (now() - interval '5 months')::date, 'San Francisco', 65, null, null, 75, now() - interval '5 months' - interval '8 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'video_tutorial', 'Supabase Row Level Security Deep Dive', 'YouTube tutorial on implementing secure RLS policies', 'https://youtube.com/watch?v=prashant123', null, null, null, null, null, null, 75, now() - interval '5 months' - interval '15 days', true, 'https://linkedin.com/posts/prashant-rls'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'customer_support', 'Helped startup migrate from Firebase', 'Guided a 3-person startup through their migration journey', null, null, null, null, null, null, null, 25, now() - interval '5 months' - interval '22 days', false, null),
  -- 4 months ago
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'starter_template', 'Supabase + React Native Starter', 'Mobile app template with auth, storage, and offline sync', 'https://github.com/prashant/supabase-rn-starter', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '3 days', true, 'https://twitter.com/prashant/status/200002'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'blog_post', 'Optimizing Supabase Queries for Scale', 'Performance tips for high-traffic applications', 'https://dev.to/prashant/supabase-performance', null, null, null, null, null, null, 50, now() - interval '4 months' - interval '12 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'community_answers', 'Stack Overflow Supabase tag', 'Answered questions about database design and migrations', null, null, null, null, null, 'stackoverflow', 6, 25, now() - interval '4 months' - interval '20 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'oss_contribution', 'Fixed edge function CORS headers', 'Resolved CORS issues in edge function responses', 'https://github.com/supabase/supabase/pull/6789', null, null, null, null, null, null, 75, now() - interval '4 months' - interval '28 days', false, null),
  -- 3 months ago
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'conference_talk', 'Supabase: The Open Source Firebase Alternative', 'Keynote presentation at ReactConf', 'https://reactconf.com/talks/supabase-firebase', 'ReactConf 2024', (now() - interval '3 months')::date, 'San Francisco', 800, null, null, 100, now() - interval '3 months' - interval '5 days', true, 'https://twitter.com/prashant/status/300003'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'hosted_meetup', 'Bay Area Supabase Meetup #1', 'First official Supabase meetup in the Bay Area', null, 'Bay Area Supabase Meetup', (now() - interval '3 months')::date, 'San Francisco, USA', 40, null, null, 100, now() - interval '3 months' - interval '15 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mentorship', 'Mentored bootcamp graduate on Supabase', 'Weekly 1-on-1 sessions helping with full-stack development', null, null, null, null, null, null, null, 50, now() - interval '3 months' - interval '25 days', false, null),
  -- 2 months ago
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'video_tutorial', 'Building a SaaS with Supabase', 'Complete series on building a multi-tenant SaaS app', 'https://youtube.com/watch?v=prashant456', null, null, null, null, null, null, 75, now() - interval '2 months' - interval '7 days', true, 'https://linkedin.com/posts/prashant-saas'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'documentation', 'Improved Supabase Auth docs', 'Added examples for social auth providers', 'https://github.com/supabase/supabase/pull/7890', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '14 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'blog_post', 'Supabase vs Planetscale: A Comparison', 'Detailed comparison of features and pricing', 'https://dev.to/prashant/supabase-vs-planetscale', null, null, null, null, null, null, 50, now() - interval '2 months' - interval '21 days', true, 'https://twitter.com/prashant/status/400004'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'community_answers', 'Reddit r/supabase support', 'Helped users with deployment and scaling questions', null, null, null, null, null, 'reddit', 12, 25, now() - interval '2 months' - interval '28 days', false, null),
  -- 1 month ago
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'oss_contribution', 'Added Python SDK improvements', 'Enhanced type hints and async support', 'https://github.com/supabase/supabase-py/pull/234', null, null, null, null, null, null, 75, now() - interval '1 month' - interval '4 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'meetup_talk', 'Edge Functions: Serverless at the Edge', 'Talk about Supabase Edge Functions at Node.js Meetup', null, 'Node.js SF Meetup', (now() - interval '1 month')::date, 'San Francisco', 55, null, null, 75, now() - interval '1 month' - interval '12 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'customer_support', 'Enterprise consultation', 'Helped enterprise team design their Supabase architecture', null, null, null, null, null, null, null, 25, now() - interval '1 month' - interval '18 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'starter_template', 'Supabase + Astro Blog Template', 'Blog starter with auth and CMS features', 'https://github.com/prashant/supabase-astro-blog', null, null, null, null, null, null, 50, now() - interval '1 month' - interval '25 days', true, 'https://twitter.com/prashant/status/500005'),
  -- This month (recent activities)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'blog_post', 'Supabase Storage: Complete Guide', 'Everything you need to know about file storage', 'https://dev.to/prashant/supabase-storage-guide', null, null, null, null, null, null, 50, now() - interval '10 days', true, 'https://twitter.com/prashant/status/600006'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'community_answers', 'Discord weekend support', 'Answered weekend questions in community channels', null, null, null, null, null, 'discord', 8, 25, now() - interval '5 days', false, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'oss_contribution', 'Fixed TypeScript types in supabase-js', 'Corrected generic types for better inference', 'https://github.com/supabase/supabase-js/pull/999', null, null, null, null, null, null, 75, now() - interval '2 days', false, null);

-- Create pending activities for the current mock user (simulating auto-ingested content)
INSERT INTO public.pending_activities (user_id, provider, provider_activity_id, activity_type, title, description, url, suggested_points, status, ingested_at, created_at)
SELECT
  p.id,
  'github',
  'gh_pr_12345',
  'oss_contribution',
  'Fixed authentication edge case in supabase-js',
  'Resolved an issue where refresh tokens were not being properly rotated in certain edge cases',
  'https://github.com/supabase/supabase-js/pull/12345',
  75,
  'pending',
  now() - interval '2 days',
  now() - interval '2 days'
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local';

INSERT INTO public.pending_activities (user_id, provider, provider_activity_id, activity_type, title, description, url, suggested_points, status, ingested_at, created_at)
SELECT
  p.id,
  'github',
  'gh_pr_12346',
  'documentation',
  'Added examples to RLS documentation',
  'Added practical examples for common RLS patterns including multi-tenant applications',
  'https://github.com/supabase/supabase/pull/12346',
  50,
  'pending',
  now() - interval '1 day',
  now() - interval '1 day'
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local';

INSERT INTO public.pending_activities (user_id, provider, provider_activity_id, activity_type, title, description, url, platform, answer_count, suggested_points, status, ingested_at, created_at)
SELECT
  p.id,
  'discord',
  'dc_msg_98765',
  'community_answers',
  'Answered 8 questions in #help-and-questions',
  'Helped community members with authentication, RLS policies, and edge function deployment',
  null,
  'discord',
  8,
  25,
  'pending',
  now() - interval '12 hours',
  now() - interval '12 hours'
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local';

INSERT INTO public.pending_activities (user_id, provider, provider_activity_id, activity_type, title, description, url, suggested_points, status, ingested_at, created_at)
SELECT
  p.id,
  'twitter',
  'tw_status_456789',
  'blog_post',
  'Thread: 10 Tips for Supabase Performance',
  'Shared a Twitter thread with performance optimization tips that got significant engagement',
  'https://twitter.com/prashant/status/456789',
  50,
  'pending',
  now() - interval '6 hours',
  now() - interval '6 hours'
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local';

INSERT INTO public.pending_activities (user_id, provider, provider_activity_id, activity_type, title, description, url, suggested_points, status, ingested_at, created_at)
SELECT
  p.id,
  'github',
  'gh_issue_comment_789',
  'customer_support',
  'Helped debug production issue in supabase/supabase',
  'Provided detailed debugging steps for a user experiencing connection pooling issues',
  'https://github.com/supabase/supabase/issues/789#issuecomment-123',
  25,
  'pending',
  now() - interval '3 hours',
  now() - interval '3 hours'
FROM public.profiles p
WHERE p.email = 'dev@supasquad.local';
