-- SupaSquad Database Schema: Activities
-- This file is part of the declarative schema for SupaSquad

-- Create activity_type enum
do $$ begin
  create type public.activity_type as enum (
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
    'community_answers'
  );
exception
  when duplicate_object then null;
end $$;

-- Create activities table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type public.activity_type not null,
  title text not null,
  description text,
  url text,
  event_name text,
  event_date date,
  location text,
  attendee_count integer,
  platform text,
  answer_count integer,
  points integer not null,
  request_amplification boolean default false,
  amplification_url text,
  created_at timestamptz default now() not null
);

-- Add comments for documentation
comment on column public.activities.request_amplification is 'Whether the user is requesting community amplification';
comment on column public.activities.amplification_url is 'URL to the content that needs amplification (LinkedIn, Twitter, blog, repo)';

-- Create indexes for efficient querying
create index if not exists activities_created_at_idx on public.activities(created_at desc);
create index if not exists activities_user_id_idx on public.activities(user_id);

-- Enable Row Level Security
alter table public.activities enable row level security;

-- RLS Policies for activities
create policy "Anyone can view activities"
  on public.activities for select
  using (true);

create policy "Users can insert own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activities"
  on public.activities for update
  using (auth.uid() = user_id);

create policy "Users can delete own activities"
  on public.activities for delete
  using (auth.uid() = user_id);
