-- SupaSquad Database Schema: Extensions
-- This file is part of the declarative schema for SupaSquad
-- Run `supabase db diff -f <migration_name>` to generate migrations

-- Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;
