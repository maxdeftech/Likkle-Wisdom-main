-- =============================================================================
-- Schedule Likkle Wisdom daily push Edge Function
--
-- Before running this migration in Supabase SQL Editor, create these Vault
-- secrets in the same project:
--
--   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
--   select vault.create_secret('YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY', 'publishable_key');
--
-- The Edge Function itself must also have SUPABASE_SERVICE_ROLE_KEY plus FCM/APNs
-- secrets configured through Supabase function secrets.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

do $$
begin
  perform cron.unschedule('invoke-send-daily-push');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'invoke-send-daily-push',
  '0 * * * *',
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
