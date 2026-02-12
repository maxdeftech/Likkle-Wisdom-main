-- Posts table for 24h ephemeral feed
CREATE TABLE IF NOT EXISTS posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'scripture', 'wisdom')),
  text_content text,
  media_url text,
  scripture_ref jsonb,
  wisdom_ref jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Index for fast time-based queries
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

-- The app already filters out posts older than 24h client-side.
-- To clean up old rows, run this manually from time to time:
--   DELETE FROM posts WHERE created_at < now() - interval '24 hours';
--
-- If you want automatic cleanup, enable the pg_cron extension first:
--   Supabase Dashboard > Database > Extensions > search "pg_cron" > Enable
-- Then run:
--   SELECT cron.schedule(
--     'delete-expired-posts',
--     '*/15 * * * *',
--     $$ DELETE FROM posts WHERE created_at < now() - interval '24 hours' $$
--   );

-- IMPORTANT: Also create a storage bucket via Supabase Dashboard:
-- Storage > New Bucket > "post-media" (set to public)
