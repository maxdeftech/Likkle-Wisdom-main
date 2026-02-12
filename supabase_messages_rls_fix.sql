-- Messages RLS InitPlan fix: auth.uid() → (select auth.uid())
-- For messages table policies (apply after supabase_push_and_messages_migration.sql)
-- Run in Supabase SQL Editor

-- "Users can update read status on received messages" - UPDATE policy
-- When available in Supabase, find the exact policy and ensure it uses (select auth.uid())
-- Example update:
-- DROP POLICY IF EXISTS "Users can update read status on received messages" ON public.messages;
-- CREATE POLICY "Users can update read status on received messages" ON public.messages
--   FOR UPDATE TO authenticated
--   USING (receiver_id = (select auth.uid()))
--   WITH CHECK (receiver_id = (select auth.uid()));

-- "Users can view their own messages" - SELECT policy
-- DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
-- CREATE POLICY "Users can view their own messages" ON public.messages
--   FOR SELECT
--   USING (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()));

-- "Users can send messages" - INSERT policy  
-- DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
-- CREATE POLICY "Users can send messages" ON public.messages
--   FOR INSERT
--   WITH CHECK (sender_id = (select auth.uid()));

-- Note: Run each DROP POLICY + CREATE POLICY in Supabase SQL Editor after copying
-- the exact policy definitions from Dashboard > Database > messages > RLS
-- Only replace auth.uid() with (select auth.uid()) in the expressions.
