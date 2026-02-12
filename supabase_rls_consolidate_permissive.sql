-- Consolidate multiple permissive RLS policies (SELECT) into one per table
-- to avoid per-row evaluation of multiple policies.
-- Run this AFTER supabase_rls_initplan_fix.sql in Supabase SQL Editor.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- =============================================================================
-- BOOKMARKS: one SELECT policy (own OR public profile owner)
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can view public users' bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own or public users' bookmarks" ON public.bookmarks
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = bookmarks.user_id
      AND (p.is_public = true OR p.is_public IS NULL)
    )
  );

-- =============================================================================
-- MESSAGE_REACTIONS: one SELECT policy (keep "Anyone can read"), restrict
-- "Users manage own message_reactions" to INSERT, UPDATE, DELETE only
-- =============================================================================
DROP POLICY IF EXISTS "Users manage own message_reactions" ON public.message_reactions;
CREATE POLICY "Users manage own message_reactions" ON public.message_reactions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own message_reactions" ON public.message_reactions
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own message_reactions" ON public.message_reactions
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ("Anyone can read message_reactions" FOR SELECT USING (true) remains as the single SELECT policy)

-- =============================================================================
-- MY_WISDOM: one SELECT policy (own OR public profile owner)
-- If you had a third policy "Everyone can view wisdoms" (USING true), it is
-- replaced by this; to allow everyone, use USING (true) instead of the expression below.
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own wisdoms" ON public.my_wisdom;
DROP POLICY IF EXISTS "Users can view public users' wisdoms" ON public.my_wisdom;
-- If "Everyone can view wisdoms" exists in Dashboard, drop it: DROP POLICY IF EXISTS "Everyone can view wisdoms" ON public.my_wisdom;
CREATE POLICY "Users can view own or public users' wisdoms" ON public.my_wisdom
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = my_wisdom.user_id
      AND (p.is_public = true OR p.is_public IS NULL)
    )
  );

-- =============================================================================
-- PROFILES: merge the two SELECT policies in Dashboard
-- In Supabase: Table profiles > RLS. Drop "Profiles are partially viewable by everyone"
-- and "Profiles are viewable if public". Create one policy, e.g.:
--   CREATE POLICY "Profiles viewable by owner or if public" ON public.profiles
--   FOR SELECT USING (
--     (select auth.uid()) = id
--     OR (is_public = true OR is_public IS NULL)
--   );
-- Adjust the expression to match your current two policies (OR their USING expressions).
-- =============================================================================
-- Manual step: see comment above.
