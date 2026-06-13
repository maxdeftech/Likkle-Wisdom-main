-- =============================================================================
-- Push tokens for iOS (APNs) and Android (FCM) — daily verse, quote, wisdom, alerts
-- Run after 001_simple_schema_and_rls.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON public.push_tokens(platform);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
  FOR ALL USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Service role (e.g. Edge Function) needs to read tokens + profiles for sending
-- Use a service-role key in the Edge Function; RLS is bypassed with service role.
