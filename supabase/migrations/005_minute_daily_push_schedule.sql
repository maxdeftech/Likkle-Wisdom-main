-- Run daily push checks every minute so user-selected notification minutes work.
-- The send-log table prevents duplicate quote/verse/wisdom sends for a user on the same local day.

CREATE TABLE IF NOT EXISTS public.push_notification_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('quote', 'verse', 'wisdom')),
  notification_date date NOT NULL,
  scheduled_time time NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, notification_type, notification_date, scheduled_time)
);

CREATE INDEX IF NOT EXISTS idx_push_notification_sends_user_id
  ON public.push_notification_sends(user_id);

CREATE INDEX IF NOT EXISTS idx_push_notification_sends_date
  ON public.push_notification_sends(notification_date);

ALTER TABLE public.push_notification_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification sends" ON public.push_notification_sends;
CREATE POLICY "Users can view own notification sends" ON public.push_notification_sends
  FOR SELECT USING ((select auth.uid()) = user_id);

do $$
begin
  perform cron.unschedule('invoke-send-daily-push');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'invoke-send-daily-push',
  '* * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-daily-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
