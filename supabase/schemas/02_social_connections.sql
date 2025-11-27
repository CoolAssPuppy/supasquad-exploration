-- SupaSquad Database Schema: Social Connections
-- This file is part of the declarative schema for SupaSquad

-- Create social_connections table
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('discord', 'linkedin', 'github', 'twitter')),
  provider_user_id text not null,
  provider_username text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, provider)
);

-- Enable Row Level Security
alter table public.social_connections enable row level security;

-- RLS Policies for social_connections
create policy "Users can view own social connections"
  on public.social_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own social connections"
  on public.social_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own social connections"
  on public.social_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own social connections"
  on public.social_connections for delete
  using (auth.uid() = user_id);
