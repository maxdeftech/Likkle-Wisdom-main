-- Store which notification topics each registered device/browser token accepts.
-- Existing tokens keep daily reminders enabled so current users do not lose them.

ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS enabled_types text[] NOT NULL DEFAULT ARRAY['daily']::text[];

UPDATE public.push_tokens
SET enabled_types = ARRAY['daily']::text[]
WHERE enabled_types IS NULL OR array_length(enabled_types, 1) IS NULL;

ALTER TABLE public.push_tokens
  DROP CONSTRAINT IF EXISTS push_tokens_enabled_types_check;

ALTER TABLE public.push_tokens
  ADD CONSTRAINT push_tokens_enabled_types_check
  CHECK (enabled_types <@ ARRAY['daily', 'updates']::text[]);
