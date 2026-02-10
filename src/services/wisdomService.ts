
import { supabase } from './supabase';
import { UserWisdom } from '../types';

export const WisdomService = {
    async getUserWisdoms(userId: string): Promise<UserWisdom[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('user_wisdoms')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user wisdoms:', error);
            return [];
        }

        return data.map(d => ({
            id: d.id,
            userId: d.user_id,
            patois: d.patois,
            english: d.english,
            timestamp: new Date(d.created_at).getTime()
        }));
    },

    async createUserWisdom(userId: string, patois: string, english: string): Promise<{ data?: UserWisdom, error?: string }> {
        if (!supabase) return { error: 'Offline' };

        const { data, error } = await supabase
            .from('user_wisdoms')
            .insert({
                user_id: userId,
                patois,
                english
            })
            .select()
            .single();

        if (error) return { error: error.message };

        return {
            data: {
                id: data.id,
                userId: data.user_id,
                patois: data.patois,
                english: data.english,
                timestamp: new Date(data.created_at).getTime()
            }
        };
    },

    async deleteWisdom(id: string) {
        if (!supabase) return { error: 'Offline' };
        const { error } = await supabase.from('user_wisdoms').delete().eq('id', id);
        return { error };
    }
};
