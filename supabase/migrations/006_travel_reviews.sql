CREATE TABLE IF NOT EXISTS public.travel_place_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  visited_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS travel_place_reviews_place_id_idx ON public.travel_place_reviews (place_id);
CREATE INDEX IF NOT EXISTS travel_place_reviews_user_id_idx ON public.travel_place_reviews (user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.travel_place_reviews;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.travel_place_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.travel_place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.travel_place_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own review"
  ON public.travel_place_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own review"
  ON public.travel_place_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own review"
  ON public.travel_place_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.travel_place_reviews_with_author AS
SELECT
  r.*,
  COALESCE(p.username, 'Likkle Traveller') AS author_name,
  LEFT(COALESCE(p.username, 'LT'), 2) AS author_initials
FROM public.travel_place_reviews r
LEFT JOIN public.profiles p ON p.id = r.user_id;

GRANT SELECT ON public.travel_place_reviews_with_author TO anon, authenticated;
