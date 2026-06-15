CREATE TABLE IF NOT EXISTS public.travel_trip_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Jamaica Trip',
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_trip_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.travel_trip_plans(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  day_number smallint NOT NULL DEFAULT 1,
  stop_order smallint NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, place_id)
);

CREATE INDEX IF NOT EXISTS trip_plans_user_idx ON public.travel_trip_plans (user_id);
CREATE INDEX IF NOT EXISTS trip_stops_plan_idx ON public.travel_trip_stops (plan_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.travel_trip_plans;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.travel_trip_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.travel_trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_trip_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own plans"
  ON public.travel_trip_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans"
  ON public.travel_trip_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans"
  ON public.travel_trip_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plans"
  ON public.travel_trip_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own stops" ON public.travel_trip_stops FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.travel_trip_plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users insert own stops" ON public.travel_trip_stops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.travel_trip_plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users update own stops" ON public.travel_trip_stops FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.travel_trip_plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users delete own stops" ON public.travel_trip_stops FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.travel_trip_plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
);
