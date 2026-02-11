-- Public cabinet & wisdom visibility
-- Run in Supabase SQL Editor after BOOKMARKS_FIX.sql
--
-- Ensures users whose profile is public (profiles.is_public = true) have their
-- bookmarks (cabinet) and my_wisdom rows readable by other authenticated users.

-- 1. Ensure profiles has is_public (used by Settings toggle)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Bookmarks: allow SELECT for rows whose owner has a public profile
DROP POLICY IF EXISTS "Users can view public users' bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view public users' bookmarks" ON public.bookmarks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = bookmarks.user_id
      AND (p.is_public = true OR p.is_public IS NULL)
    )
  );

-- 3. my_wisdom: allow others to read when the wisdom owner's profile is public
--    (If my_wisdom has no RLS yet, we enable it and add both "own" and "public" policies.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'my_wisdom') THEN
    ALTER TABLE public.my_wisdom ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own wisdoms" ON public.my_wisdom;
    CREATE POLICY "Users can view their own wisdoms" ON public.my_wisdom
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view public users' wisdoms" ON public.my_wisdom;
    CREATE POLICY "Users can view public users' wisdoms" ON public.my_wisdom
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = my_wisdom.user_id
          AND (p.is_public = true OR p.is_public IS NULL)
        )
      );
  END IF;
END $$;
