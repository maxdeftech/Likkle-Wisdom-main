-- Remove donations: drop is_donor from profiles
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS is_premium;
