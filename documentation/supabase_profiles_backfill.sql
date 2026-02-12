-- Backfill profiles for iOS debug fixes (add friend list + "days as member").
-- Run once in Supabase SQL Editor.

DO $$
BEGIN
  -- 1. Ensure all profiles are discoverable in "add friend"
  UPDATE public.profiles
  SET is_public = true
  WHERE is_public IS NULL;

  -- 2. Ensure created_at is set so "days in wisdom" / "Joining..." works
  UPDATE public.profiles
  SET created_at = COALESCE(created_at, updated_at, timezone('utc'::text, now()))
  WHERE created_at IS NULL;
END $$;
