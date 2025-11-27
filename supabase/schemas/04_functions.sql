-- SupaSquad Database Schema: Functions and Triggers
-- This file is part of the declarative schema for SupaSquad

-- Function to handle new user signups (creates profile automatically)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Trigger for social_connections updated_at
drop trigger if exists update_social_connections_updated_at on public.social_connections;
create trigger update_social_connections_updated_at
  before update on public.social_connections
  for each row execute function public.update_updated_at_column();

-- Function to get user's total points
create or replace function public.get_user_total_points(user_uuid uuid)
returns integer as $$
  select coalesce(sum(points), 0)::integer
  from public.activities
  where user_id = user_uuid;
$$ language sql stable;

-- Function to get leaderboard
create or replace function public.get_leaderboard(limit_count integer default 10)
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  total_points bigint,
  rank bigint
) as $$
  select
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.avatar_url,
    coalesce(sum(a.points), 0) as total_points,
    row_number() over (order by coalesce(sum(a.points), 0) desc) as rank
  from public.profiles p
  left join public.activities a on a.user_id = p.id
  group by p.id, p.email, p.first_name, p.last_name, p.avatar_url
  order by total_points desc
  limit limit_count;
$$ language sql stable;
