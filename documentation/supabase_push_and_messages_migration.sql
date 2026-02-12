-- Push notifications + Messages reply/reactions/pin/star
-- Run in Supabase SQL Editor

-- Push tokens for native notifications
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Notification preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_quote_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS notify_verse_time TIME DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS notify_wisdom_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT true;

-- Messages: reply reference
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Message reactions (e.g. like)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Pinned message per conversation (one per user pair)
CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, other_user_id)
);

-- Starred messages (for favourites)
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push_tokens" ON public.push_tokens;
CREATE POLICY "Users manage own push_tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own message_reactions" ON public.message_reactions;
CREATE POLICY "Users manage own message_reactions" ON public.message_reactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own chat_pinned_messages" ON public.chat_pinned_messages;
CREATE POLICY "Users manage own chat_pinned_messages" ON public.chat_pinned_messages FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own starred_messages" ON public.starred_messages;
CREATE POLICY "Users manage own starred_messages" ON public.starred_messages FOR ALL USING (auth.uid() = user_id);

-- Allow reading others' reactions (to show likes on messages)
DROP POLICY IF EXISTS "Anyone can read message_reactions" ON public.message_reactions;
CREATE POLICY "Anyone can read message_reactions" ON public.message_reactions FOR SELECT USING (true);
