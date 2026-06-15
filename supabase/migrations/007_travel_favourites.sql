CREATE TABLE IF NOT EXISTS public.travel_favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS travel_favourites_user_idx ON public.travel_favourites (user_id);

ALTER TABLE public.travel_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own favourites"
  ON public.travel_favourites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own favourites"
  ON public.travel_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favourites"
  ON public.travel_favourites FOR DELETE USING (auth.uid() = user_id);
