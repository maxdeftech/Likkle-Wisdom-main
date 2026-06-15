import { supabase } from './supabase';

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase client is not configured');
  return supabase;
};

export async function fetchFavourites(userId: string): Promise<string[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('travel_favourites')
    .select('place_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(row => row.place_id as string);
}

export async function addFavourite(userId: string, placeId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_favourites')
    .upsert({ user_id: userId, place_id: placeId }, { onConflict: 'user_id,place_id' });
  if (error) throw error;
}

export async function removeFavourite(userId: string, placeId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_favourites')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);
  if (error) throw error;
}
