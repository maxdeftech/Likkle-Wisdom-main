-- Allow PWA Web Push subscriptions in the existing push_tokens table.
-- Run after 002_push_tokens.sql if that migration was already applied.

ALTER TABLE public.push_tokens
  DROP CONSTRAINT IF EXISTS push_tokens_platform_check;

ALTER TABLE public.push_tokens
  ADD CONSTRAINT push_tokens_platform_check
  CHECK (platform IN ('ios', 'android', 'web'));
