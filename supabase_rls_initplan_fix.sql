-- Supabase RLS InitPlan fix: use (select auth.uid()) instead of auth.uid()
-- so the value is computed once per query, not per row.
-- Run this entire script in Supabase SQL Editor.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- =============================================================================
-- POSTS
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING ((select auth.uid()) = user_id);

-- =============================================================================
-- PUSH_TOKENS
-- =============================================================================
DROP POLICY IF EXISTS "Users manage own push_tokens" ON public.push_tokens;
CREATE POLICY "Users manage own push_tokens" ON public.push_tokens FOR ALL USING ((select auth.uid()) = user_id);

-- =============================================================================
-- MESSAGE_REACTIONS
-- =============================================================================
DROP POLICY IF EXISTS "Users manage own message_reactions" ON public.message_reactions;
CREATE POLICY "Users manage own message_reactions" ON public.message_reactions FOR ALL USING ((select auth.uid()) = user_id);

-- =============================================================================
-- CHAT_PINNED_MESSAGES
-- =============================================================================
DROP POLICY IF EXISTS "Users manage own chat_pinned_messages" ON public.chat_pinned_messages;
CREATE POLICY "Users manage own chat_pinned_messages" ON public.chat_pinned_messages FOR ALL USING ((select auth.uid()) = user_id);

-- =============================================================================
-- STARRED_MESSAGES
-- =============================================================================
DROP POLICY IF EXISTS "Users manage own starred_messages" ON public.starred_messages;
CREATE POLICY "Users manage own starred_messages" ON public.starred_messages FOR ALL USING ((select auth.uid()) = user_id);

-- =============================================================================
-- BOOKMARKS
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks FOR DELETE USING ((select auth.uid()) = user_id);

-- =============================================================================
-- MY_WISDOM (policies defined in supabase_public_cabinet_migration.sql)
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own wisdoms" ON public.my_wisdom;
CREATE POLICY "Users can view their own wisdoms" ON public.my_wisdom FOR SELECT USING ((select auth.uid()) = user_id);

-- =============================================================================
-- ALERTS (auth.uid() inside EXISTS subquery)
-- =============================================================================
DROP POLICY IF EXISTS "Admins can create alerts" ON public.alerts;
CREATE POLICY "Admins can create alerts" ON public.alerts FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
CREATE POLICY "Admins can update alerts" ON public.alerts FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
CREATE POLICY "Admins can delete alerts" ON public.alerts FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true
  )
);

-- =============================================================================
-- ALERT_READS (linter: "Users can read own alert reads", "Users can mark alerts as read")
-- =============================================================================
DROP POLICY IF EXISTS "Users can read own alert reads" ON public.alert_reads;
CREATE POLICY "Users can read own alert reads" ON public.alert_reads FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark alerts as read" ON public.alert_reads;
CREATE POLICY "Users can mark alerts as read" ON public.alert_reads FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

-- =============================================================================
-- POLICIES NOT DEFINED IN REPO (messages, profiles, friendships, journal_entries,
-- and remaining my_wisdom policies). Apply the same pattern in Supabase SQL Editor:
-- Replace every auth.uid() with (select auth.uid()) in the policy expression,
-- then DROP POLICY "policy_name" ON table; and CREATE POLICY ... with the new expression.
-- =============================================================================
-- MESSAGES: "Users can update read status on received messages",
--           "Users can view their own messages", "Users can send messages"
-- PROFILES: "Users can update own profile",
--           "Profiles are partially viewable by everyone", "Profiles are viewable if public"
-- FRIENDSHIPS: "Enable select for users part of friendship",
--              "Enable insert for authenticated users as requester",
--              "Enable update for users part of friendship", "Enable delete for users part of friendship"
-- JOURNAL_ENTRIES: "Users can manage their own entries"
-- MY_WISDOM: "Owners can update their own wisdom", "Users can create their own wisdom",
--            "Owners can delete their own wisdom"
--
-- Example for a simple policy (e.g. messages view own):
--   DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
--   CREATE POLICY "Users can view their own messages" ON public.messages
--     FOR SELECT USING (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()));
-- (Adjust column names to match your schema.)
--
-- To get exact definitions: Supabase Dashboard > Database > Tables > table > RLS >
-- copy the policy definition, replace auth.uid() with (select auth.uid()), then DROP + CREATE.
