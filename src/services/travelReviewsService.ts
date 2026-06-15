import { supabase } from './supabase';

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  visited_on: string | null;
  created_at: string;
  author_name: string;
  author_initials: string;
}

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase client is not configured');
  return supabase;
};

export async function fetchReviewsForPlace(placeId: string): Promise<PlaceReview[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('travel_place_reviews_with_author')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlaceReview[];
}

export async function fetchMyReviewForPlace(placeId: string, userId: string): Promise<PlaceReview | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('travel_place_reviews_with_author')
    .select('*')
    .eq('place_id', placeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as PlaceReview | null;
}

export async function upsertReview(params: {
  place_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  visited_on?: string;
}) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_place_reviews')
    .upsert({ ...params }, { onConflict: 'place_id,user_id' });
  if (error) throw error;
}

export async function deleteReview(placeId: string, userId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from('travel_place_reviews')
    .delete()
    .eq('place_id', placeId)
    .eq('user_id', userId);
  if (error) throw error;
}
