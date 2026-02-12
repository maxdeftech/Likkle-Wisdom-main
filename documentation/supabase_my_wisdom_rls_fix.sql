-- My_wisdom RLS InitPlan fix: auth.uid() → (select auth.uid())
-- Completes the RLS fixes for user wisdoms table
-- Run in Supabase SQL Editor

-- Users can view their own wisdoms
DROP POLICY IF EXISTS "Users can view their own wisdoms" ON public.my_wisdom;
CREATE POLICY "Users can view their own wisdoms" ON public.my_wisdom
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Users can create their own wisdom
DROP POLICY IF EXISTS "Users can create their own wisdom" ON public.my_wisdom;
CREATE POLICY "Users can create their own wisdom" ON public.my_wisdom
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Owners can update their own wisdom
DROP POLICY IF EXISTS "Owners can update their own wisdom" ON public.my_wisdom;
CREATE POLICY "Owners can update their own wisdom" ON public.my_wisdom
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Owners can delete their own wisdom
DROP POLICY IF EXISTS "Owners can delete their own wisdom" ON public.my_wisdom;
CREATE POLICY "Owners can delete their own wisdom" ON public.my_wisdom
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Users can view public users' wisdoms (if profile is public)
-- This one doesn't use auth.uid() directly so no change needed:
-- DROP POLICY IF EXISTS "Users can view public users' wisdoms" ON public.my_wisdom;
-- CREATE POLICY "Users can view public users' wisdoms" ON public.my_wisdom
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles p
--       WHERE p.id = my_wisdom.user_id
--       AND (p.is_public = true OR p.is_public IS NULL)
--     )
--   );
