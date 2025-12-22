-- Drop existing policies that require authentication
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "quests_select_all" on public.quests;
drop policy if exists "daily_logs_select_own" on public.daily_logs;
drop policy if exists "daily_logs_insert_own" on public.daily_logs;
drop policy if exists "daily_logs_update_own" on public.daily_logs;
drop policy if exists "quest_completions_select_own" on public.quest_completions;
drop policy if exists "quest_completions_insert_own" on public.quest_completions;
drop policy if exists "quest_completions_delete_own" on public.quest_completions;

-- Personal app user ID
-- We'll allow operations on this specific user ID without authentication

-- Profiles: Allow public access for personal user
create policy "profiles_public_access"
  on public.profiles for all
  using (true)
  with check (true);

-- Quests: Allow public read access
create policy "quests_public_read"
  on public.quests for select
  using (true);

-- Daily logs: Allow public access
create policy "daily_logs_public_access"
  on public.daily_logs for all
  using (true)
  with check (true);

-- Quest completions: Allow public access  
create policy "quest_completions_public_access"
  on public.quest_completions for all
  using (true)
  with check (true);

-- Remove foreign key constraint to auth.users for personal app
-- First, we need to recreate the profiles table without the auth.users reference

-- Create a new profiles table without foreign key
create table if not exists public.profiles_new (
  id uuid primary key default gen_random_uuid(),
  username text,
  email text,
  total_xp integer default 0,
  level integer default 1,
  streak_days integer default 0,
  last_active_date date,
  created_at timestamp with time zone default now()
);

-- Copy existing data if any
insert into public.profiles_new (id, username, total_xp, level, streak_days, last_active_date, created_at)
select id, username, total_xp, level, streak_days, last_active_date, created_at
from public.profiles
on conflict do nothing;

-- Insert the personal user
insert into public.profiles_new (id, username, email, total_xp, level, streak_days)
values ('00000000-0000-0000-0000-000000000001', 'Player One', 'your@email.com', 0, 1, 0)
on conflict (id) do nothing;

-- Create timer_sessions table to track deep work sessions
create table if not exists public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_date date not null,
  duration_seconds integer default 0,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.timer_sessions enable row level security;

create policy "timer_sessions_public_access"
  on public.timer_sessions for all
  using (true)
  with check (true);

-- Create activity_log table for detailed tracking
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action_type text not null,
  action_details jsonb,
  xp_change integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.activity_log enable row level security;

create policy "activity_log_public_access"
  on public.activity_log for all
  using (true)
  with check (true);

-- Create notifications table for email tracking
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  notification_type text not null,
  sent_at timestamp with time zone,
  scheduled_for timestamp with time zone,
  email_content jsonb,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;

create policy "notifications_public_access"
  on public.notifications for all
  using (true)
  with check (true);

-- Add penalty quest if not exists
insert into public.quests (name, xp_value, category, icon, sort_order, description) values
  ('Fail: Fapping / Skipping Gym', -50, 'penalty', '⚠️', 99, 'Major setback to physical and mental momentum')
on conflict do nothing;
