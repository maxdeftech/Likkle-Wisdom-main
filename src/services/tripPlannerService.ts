import { supabase } from './supabase';

export interface TripPlan {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  created_at: string;
}

export interface TripStop {
  id: string;
  plan_id: string;
  place_id: string;
  day_number: number;
  stop_order: number;
  notes: string | null;
}

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase client is not configured');
  return supabase;
};

export async function fetchOrCreateActivePlan(userId: string): Promise<TripPlan> {
  const client = requireSupabase();
  const { data: existing, error: existingError } = await client
    .from('travel_trip_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing as TripPlan;

  const { data: created, error } = await client
    .from('travel_trip_plans')
    .insert({ user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return created as TripPlan;
}

export async function fetchStopsForPlan(planId: string): Promise<TripStop[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('travel_trip_stops')
    .select('*')
    .eq('plan_id', planId)
    .order('day_number')
    .order('stop_order');
  if (error) throw error;
  return (data ?? []) as TripStop[];
}

export async function addStopToPlan(planId: string, placeId: string, dayNumber: number, stopOrder: number) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_trip_stops')
    .upsert(
      { plan_id: planId, place_id: placeId, day_number: dayNumber, stop_order: stopOrder },
      { onConflict: 'plan_id,place_id' }
    );
  if (error) throw error;
}

export async function removeStopFromPlan(stopId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_trip_stops')
    .delete()
    .eq('id', stopId);
  if (error) throw error;
}

export async function updatePlanName(planId: string, name: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_trip_plans')
    .update({ name })
    .eq('id', planId);
  if (error) throw error;
}
