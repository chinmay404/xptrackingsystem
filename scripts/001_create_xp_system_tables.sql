-- Create profiles table for user data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  total_xp integer default 0,
  level integer default 1,
  streak_days integer default 0,
  last_active_date date,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create quests table (predefined daily quests)
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  xp_value integer not null,
  category text not null,
  description text,
  icon text,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.quests enable row level security;

create policy "quests_select_all"
  on public.quests for select
  to authenticated
  using (true);

-- Create daily_logs table (tracks daily XP totals)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  total_xp integer default 0,
  quests_completed integer default 0,
  created_at timestamp with time zone default now(),
  unique(user_id, log_date)
);

alter table public.daily_logs enable row level security;

create policy "daily_logs_select_own"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "daily_logs_insert_own"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "daily_logs_update_own"
  on public.daily_logs for update
  using (auth.uid() = user_id);

-- Create quest_completions table (tracks individual quest completions)
create table if not exists public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  completed_at timestamp with time zone default now(),
  completion_date date not null,
  xp_earned integer not null,
  unique(user_id, quest_id, completion_date)
);

alter table public.quest_completions enable row level security;

create policy "quest_completions_select_own"
  on public.quest_completions for select
  using (auth.uid() = user_id);

create policy "quest_completions_insert_own"
  on public.quest_completions for insert
  with check (auth.uid() = user_id);

create policy "quest_completions_delete_own"
  on public.quest_completions for delete
  using (auth.uid() = user_id);

-- Insert default quests
insert into public.quests (name, xp_value, category, icon, sort_order) values
  ('Complete Workout', 30, 'fitness', '💪', 1),
  ('Hit Macros (160g Protein)', 20, 'nutrition', '🥗', 2),
  ('0 Minutes Porn', 20, 'wellness', '🚫', 3),
  ('4 Hours Deep Coding', 10, 'productivity', '💻', 4),
  ('7+ Hours Sleep', 10, 'wellness', '😴', 5),
  ('Cold Shower', 5, 'wellness', '🚿', 6),
  ('Grooming (Face/Beard)', 5, 'wellness', '✨', 7)
on conflict do nothing;
