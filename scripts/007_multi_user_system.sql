-- Multi-user support: extend profiles with customizable fuel plan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_calories INTEGER DEFAULT 2750;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_protein INTEGER DEFAULT 160;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_hydration NUMERIC(3,1) DEFAULT 3.5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_deep_work INTEGER DEFAULT 4;

-- Allow users to create their own quests
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Update quests RLS to allow users to see global quests + their own
DROP POLICY IF EXISTS "quests_select_all" ON public.quests;
CREATE POLICY "quests_select_own_or_global" ON public.quests FOR SELECT TO authenticated
  USING (is_global = true OR user_id = auth.uid());

CREATE POLICY "quests_insert_own" ON public.quests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quests_update_own" ON public.quests FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "quests_delete_own" ON public.quests FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Mark existing quests as global templates
UPDATE public.quests SET is_global = true WHERE user_id IS NULL;

-- Friends table for leaderboard/comparison
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_select_own" ON public.friends FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friends_insert_own" ON public.friends FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "friends_update_own" ON public.friends FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friends_delete_own" ON public.friends FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Make profiles publicly readable for leaderboard (only certain fields)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
