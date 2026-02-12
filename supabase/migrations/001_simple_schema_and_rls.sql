-- =============================================================================
-- Likkle Wisdom — Simplified schema (no messaging, friends, or feed)
-- Run once in Supabase SQL Editor. Uses (select auth.uid()) for RLS InitPlan.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  avatar_url text,
  is_premium boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  is_public boolean DEFAULT true,
  status_note text,
  status_note_at timestamptz DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  notify_quote_time time DEFAULT '08:00',
  notify_verse_time time DEFAULT '12:00',
  notify_wisdom_time time DEFAULT '08:00'
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_public') THEN
    ALTER TABLE public.profiles ADD COLUMN is_public boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notify_quote_time') THEN
    ALTER TABLE public.profiles ADD COLUMN notify_quote_time time DEFAULT '08:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notify_verse_time') THEN
    ALTER TABLE public.profiles ADD COLUMN notify_verse_time time DEFAULT '12:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notify_wisdom_time') THEN
    ALTER TABLE public.profiles ADD COLUMN notify_wisdom_time time DEFAULT '08:00';
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by owner or if public" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Profiles viewable by owner or if public" ON public.profiles
  FOR SELECT USING (
    (select auth.uid()) = id
    OR (is_public = true OR is_public IS NULL)
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- =============================================================================
-- 2. BOOKMARKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own or public users' bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own or public users' bookmarks" ON public.bookmarks
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = bookmarks.user_id AND (p.is_public = true OR p.is_public IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 3. JOURNAL ENTRIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  text text NOT NULL,
  mood text NOT NULL,
  date text NOT NULL,
  timestamp bigint NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own entries" ON public.journal_entries;
CREATE POLICY "Users can manage their own entries" ON public.journal_entries
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- =============================================================================
-- 4. SUBSCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  payment_method text,
  amount numeric DEFAULT 5.00,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscription" ON public.subscriptions;
CREATE POLICY "Users can manage own subscription" ON public.subscriptions
  FOR ALL USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 5. MY_WISDOM
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.my_wisdom (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.my_wisdom ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own or public users' wisdoms" ON public.my_wisdom;
CREATE POLICY "Users can view own or public users' wisdoms" ON public.my_wisdom
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = my_wisdom.user_id AND (p.is_public = true OR p.is_public IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can create their own wisdom" ON public.my_wisdom;
CREATE POLICY "Users can create their own wisdom" ON public.my_wisdom
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owners can update their own wisdom" ON public.my_wisdom;
CREATE POLICY "Owners can update their own wisdom" ON public.my_wisdom
  FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owners can delete their own wisdom" ON public.my_wisdom;
CREATE POLICY "Owners can delete their own wisdom" ON public.my_wisdom
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 6. ALERTS & ALERT_READS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'update', 'event')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.alert_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(alert_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_reads_user_id ON public.alert_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_reads_alert_id ON public.alert_reads(alert_id);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read alerts" ON public.alerts;
CREATE POLICY "Anyone can read alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (expires_at IS NULL OR expires_at > now());

DROP POLICY IF EXISTS "Admins can create alerts" ON public.alerts;
CREATE POLICY "Admins can create alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
CREATE POLICY "Admins can update alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
CREATE POLICY "Admins can delete alerts" ON public.alerts
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "Users can read own alert reads" ON public.alert_reads;
CREATE POLICY "Users can read own alert reads" ON public.alert_reads
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark alerts as read" ON public.alert_reads;
CREATE POLICY "Users can mark alerts as read" ON public.alert_reads
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

-- =============================================================================
-- FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Seeker'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_unread_alert_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.alerts a
    WHERE (a.expires_at IS NULL OR a.expires_at > now())
      AND NOT EXISTS (
        SELECT 1 FROM public.alert_reads ar
        WHERE ar.alert_id = a.id AND ar.user_id = p_user_id
      )
  );
END;
$$;

-- =============================================================================
-- BACKFILL PROFILES
-- =============================================================================
INSERT INTO public.profiles (id, username, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'username', 'Seeker'), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- REALTIME (profiles only, for future use)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime registration skipped: %', SQLERRM;
END $$;
