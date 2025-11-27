create type "public"."activity_type" as enum ('blog_post', 'cfp_submission', 'conference_talk', 'meetup_talk', 'hosted_meetup', 'customer_support', 'oss_contribution', 'video_tutorial', 'documentation', 'workshop', 'mentorship', 'starter_template', 'integration', 'community_answers');


  create table "public"."activities" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "activity_type" public.activity_type not null,
    "title" text not null,
    "description" text,
    "url" text,
    "event_name" text,
    "event_date" date,
    "location" text,
    "attendee_count" integer,
    "platform" text,
    "answer_count" integer,
    "points" integer not null,
    "request_amplification" boolean default false,
    "amplification_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."activities" enable row level security;


  create table "public"."pending_activities" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "provider" text not null,
    "provider_activity_id" text,
    "activity_type" public.activity_type not null,
    "title" text not null,
    "description" text,
    "url" text,
    "event_name" text,
    "event_date" date,
    "location" text,
    "attendee_count" integer,
    "platform" text,
    "answer_count" integer,
    "suggested_points" integer not null,
    "status" text not null default 'pending'::text,
    "ingested_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."pending_activities" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "first_name" text,
    "last_name" text,
    "avatar_url" text,
    "city" text,
    "country" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."social_connections" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "provider" text not null,
    "provider_user_id" text not null,
    "provider_username" text,
    "access_token" text,
    "refresh_token" text,
    "token_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."social_connections" enable row level security;

CREATE INDEX activities_created_at_idx ON public.activities USING btree (created_at DESC);

CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);

CREATE INDEX activities_user_id_idx ON public.activities USING btree (user_id);

CREATE INDEX idx_pending_activities_provider ON public.pending_activities USING btree (user_id, provider);

CREATE INDEX idx_pending_activities_user_status ON public.pending_activities USING btree (user_id, status);

CREATE UNIQUE INDEX pending_activities_pkey ON public.pending_activities USING btree (id);

CREATE UNIQUE INDEX pending_activities_user_id_provider_provider_activity_id_key ON public.pending_activities USING btree (user_id, provider, provider_activity_id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX social_connections_pkey ON public.social_connections USING btree (id);

CREATE UNIQUE INDEX social_connections_user_id_provider_key ON public.social_connections USING btree (user_id, provider);

alter table "public"."activities" add constraint "activities_pkey" PRIMARY KEY using index "activities_pkey";

alter table "public"."pending_activities" add constraint "pending_activities_pkey" PRIMARY KEY using index "pending_activities_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."social_connections" add constraint "social_connections_pkey" PRIMARY KEY using index "social_connections_pkey";

alter table "public"."activities" add constraint "activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."activities" validate constraint "activities_user_id_fkey";

alter table "public"."pending_activities" add constraint "pending_activities_provider_check" CHECK ((provider = ANY (ARRAY['discord'::text, 'linkedin'::text, 'github'::text, 'twitter'::text]))) not valid;

alter table "public"."pending_activities" validate constraint "pending_activities_provider_check";

alter table "public"."pending_activities" add constraint "pending_activities_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text]))) not valid;

alter table "public"."pending_activities" validate constraint "pending_activities_status_check";

alter table "public"."pending_activities" add constraint "pending_activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."pending_activities" validate constraint "pending_activities_user_id_fkey";

alter table "public"."pending_activities" add constraint "pending_activities_user_id_provider_provider_activity_id_key" UNIQUE using index "pending_activities_user_id_provider_provider_activity_id_key";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."social_connections" add constraint "social_connections_provider_check" CHECK ((provider = ANY (ARRAY['discord'::text, 'linkedin'::text, 'github'::text, 'twitter'::text]))) not valid;

alter table "public"."social_connections" validate constraint "social_connections_provider_check";

alter table "public"."social_connections" add constraint "social_connections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."social_connections" validate constraint "social_connections_user_id_fkey";

alter table "public"."social_connections" add constraint "social_connections_user_id_provider_key" UNIQUE using index "social_connections_user_id_provider_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, avatar_url text, total_points bigint, rank bigint)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_total_points(user_uuid uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(sum(points), 0)::integer
  from public.activities
  where user_id = user_uuid;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."activities" to "anon";

grant insert on table "public"."activities" to "anon";

grant references on table "public"."activities" to "anon";

grant select on table "public"."activities" to "anon";

grant trigger on table "public"."activities" to "anon";

grant truncate on table "public"."activities" to "anon";

grant update on table "public"."activities" to "anon";

grant delete on table "public"."activities" to "authenticated";

grant insert on table "public"."activities" to "authenticated";

grant references on table "public"."activities" to "authenticated";

grant select on table "public"."activities" to "authenticated";

grant trigger on table "public"."activities" to "authenticated";

grant truncate on table "public"."activities" to "authenticated";

grant update on table "public"."activities" to "authenticated";

grant delete on table "public"."activities" to "service_role";

grant insert on table "public"."activities" to "service_role";

grant references on table "public"."activities" to "service_role";

grant select on table "public"."activities" to "service_role";

grant trigger on table "public"."activities" to "service_role";

grant truncate on table "public"."activities" to "service_role";

grant update on table "public"."activities" to "service_role";

grant delete on table "public"."pending_activities" to "anon";

grant insert on table "public"."pending_activities" to "anon";

grant references on table "public"."pending_activities" to "anon";

grant select on table "public"."pending_activities" to "anon";

grant trigger on table "public"."pending_activities" to "anon";

grant truncate on table "public"."pending_activities" to "anon";

grant update on table "public"."pending_activities" to "anon";

grant delete on table "public"."pending_activities" to "authenticated";

grant insert on table "public"."pending_activities" to "authenticated";

grant references on table "public"."pending_activities" to "authenticated";

grant select on table "public"."pending_activities" to "authenticated";

grant trigger on table "public"."pending_activities" to "authenticated";

grant truncate on table "public"."pending_activities" to "authenticated";

grant update on table "public"."pending_activities" to "authenticated";

grant delete on table "public"."pending_activities" to "service_role";

grant insert on table "public"."pending_activities" to "service_role";

grant references on table "public"."pending_activities" to "service_role";

grant select on table "public"."pending_activities" to "service_role";

grant trigger on table "public"."pending_activities" to "service_role";

grant truncate on table "public"."pending_activities" to "service_role";

grant update on table "public"."pending_activities" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."social_connections" to "anon";

grant insert on table "public"."social_connections" to "anon";

grant references on table "public"."social_connections" to "anon";

grant select on table "public"."social_connections" to "anon";

grant trigger on table "public"."social_connections" to "anon";

grant truncate on table "public"."social_connections" to "anon";

grant update on table "public"."social_connections" to "anon";

grant delete on table "public"."social_connections" to "authenticated";

grant insert on table "public"."social_connections" to "authenticated";

grant references on table "public"."social_connections" to "authenticated";

grant select on table "public"."social_connections" to "authenticated";

grant trigger on table "public"."social_connections" to "authenticated";

grant truncate on table "public"."social_connections" to "authenticated";

grant update on table "public"."social_connections" to "authenticated";

grant delete on table "public"."social_connections" to "service_role";

grant insert on table "public"."social_connections" to "service_role";

grant references on table "public"."social_connections" to "service_role";

grant select on table "public"."social_connections" to "service_role";

grant trigger on table "public"."social_connections" to "service_role";

grant truncate on table "public"."social_connections" to "service_role";

grant update on table "public"."social_connections" to "service_role";


  create policy "Anyone can view activities"
  on "public"."activities"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete own activities"
  on "public"."activities"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own activities"
  on "public"."activities"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own activities"
  on "public"."activities"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Service role can insert pending activities"
  on "public"."pending_activities"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can delete own pending activities"
  on "public"."pending_activities"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own pending activities"
  on "public"."pending_activities"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own pending activities"
  on "public"."pending_activities"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete own social connections"
  on "public"."social_connections"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own social connections"
  on "public"."social_connections"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own social connections"
  on "public"."social_connections"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own social connections"
  on "public"."social_connections"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));

-- Development policies for mock auth (no real Supabase session)
create policy "Dev: Allow select all"
  on "public"."activities"
  as permissive
  for select
  to public
using (true);

create policy "Dev: Allow select all"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);

create policy "Dev: Allow select all"
  on "public"."pending_activities"
  as permissive
  for select
  to public
using (true);

create policy "Dev: Allow select all"
  on "public"."social_connections"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON public.social_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for activities table
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
