/**
 * src/services/wisdomService.ts — CRUD for user-created wisdoms (my_wisdom table in Supabase).
 * Used by Profile "Wisdom Creator" and AI-generated wisdom save flow.
 */

import { supabase } from './supabase';
import { UserWisdom } from '../types';

export const WisdomService = {
    /** Fetch all wisdoms for a user, newest first; returns [] if no supabase or on error. */
    async getUserWisdoms(userId: string): Promise<UserWisdom[]> {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('my_wisdom')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[WisdomService] Error fetching user wisdoms:', {
                    message: error.message,
                    code: error.code
                });
                return [];
            }

            if (!data) {
                console.warn('[WisdomService] No wisdom data returned');
                return [];
            }

            return data.map(d => ({
                id: d.id,
                userId: d.user_id,
                patois: d.content?.patois || d.patois,
                english: d.content?.english || d.english,
                timestamp: new Date(d.created_at).getTime()
            }));
        } catch (e) {
            console.error('[WisdomService] Exception in getUserWisdoms:', e);
            return [];
        }
    },

    /** Insert a new wisdom (patois + english); returns the created row or an error message. */
    async createUserWisdom(userId: string, patois: string, english: string): Promise<{ data?: UserWisdom, error?: string }> {
        if (!supabase) return { error: 'Offline' };

        const { data, error } = await supabase
            .from('my_wisdom')
            .insert({
                user_id: userId,
                content: { patois, english }
            })
            .select()
            .single();

        if (error) return { error: error.message };

        return {
            data: {
                id: data.id,
                userId: data.user_id,
                patois: data.content?.patois || patois,
                english: data.content?.english || english,
                timestamp: new Date(data.created_at).getTime()
            }
        };
    },

    /** Delete a wisdom by id; returns { error } if offline or Supabase error. */
    async deleteWisdom(id: string) {
        if (!supabase) return { error: 'Offline' };
        const { error } = await supabase.from('my_wisdom').delete().eq('id', id);
        return { error };
    }
};
