-- Fix Posts RLS policies: auth.uid() → (select auth.uid())
-- This completes the RLS InitPlan fixes for posts table
-- Run in Supabase SQL Editor

-- Posts: Users can insert their own posts
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Posts: Users can delete their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Note: "Anyone can read posts" already uses USING (true), so no fix needed for SELECT policy
