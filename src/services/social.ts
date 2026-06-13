
import { supabase } from './supabase';
import { User } from '../types';
import { EncryptionService } from './encryption';

export const SocialService = {

    async getPublicProfile(userId: string): Promise<User | null> {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, is_admin, is_public')
                .eq('id', userId)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                username: data.username || 'Wisdom Seeker',
                avatarUrl: data.avatar_url,
                isGuest: false,
                isAdmin: data.is_admin,
                isPublic: data.is_public
            };
        } catch (error) {
            console.error('Public profile fetch failed:', error);
            return null;
        }
    },

    async getPublicCabinet(userId: string) {
        if (!supabase) return { quotes: [], iconic: [], bible: [], kjv: [] };

        try {
            const { data: bookmarks, error } = await supabase
                .from('bookmarks')
                .select('*')
                .eq('user_id', userId);

            if (error || !bookmarks) return { quotes: [], iconic: [], bible: [], kjv: [] };

            return {
                quoteIds: bookmarks.filter(b => b.item_type === 'quote').map(b => b.item_id),
                iconicIds: bookmarks.filter(b => b.item_type === 'iconic').map(b => b.item_id),
                bibleIds: bookmarks.filter(b => b.item_type === 'bible').map(b => b.item_id),
                kjv: bookmarks.filter(b => b.item_type === 'kjv').map(b => ({
                    id: b.item_id,
                    text: b.metadata?.text,
                    reference: b.metadata?.reference,
                    timestamp: new Date(b.created_at).getTime()
                }))
            };
        } catch (error) {
            console.error('Public cabinet fetch failed:', error);
            return { quotes: [], iconic: [], bible: [], kjv: [] };
        }
    },

    async updateProfileNote(userId: string, note: string) {
        if (!supabase) return { error: 'Offline' };

        try {
            let processedNote = note;
            if (note && note.trim()) {
                processedNote = await EncryptionService.encrypt(note, userId);
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    status_note: processedNote,
                    status_note_at: new Date().toISOString()
                })
                .eq('id', userId);

            return { error };
        } catch (error: any) {
            console.error('Profile note update failed:', error);
            return { error: error?.message || 'Profile note update failed' };
        }
    },

    // Realtime Presence for "Online Users" count
    subscribeToPresence(userId: string, onCountChange: (count: number) => void) {
        if (!supabase) return null;

        const channel = supabase.channel('global_presence', {
            config: { presence: { key: userId } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                onCountChange(count);
            })
            .subscribe(async (status, error) => {
                if (error) {
                    console.error('Presence subscription failed:', error);
                    return;
                }
                if (status === 'SUBSCRIBED') {
                    try {
                        await channel.track({ online_at: new Date().toISOString() });
                    } catch (trackError) {
                        console.error('Presence track failed:', trackError);
                    }
                }
            });

        return channel;
    },

    async getUserStats(userId: string) {
        if (!supabase) return { createdAt: null, statusNote: null, statusNoteAt: null };

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('created_at, status_note, status_note_at')
                .eq('id', userId)
                .single();

            let decryptedNote = profile?.status_note || null;
            if (decryptedNote) {
                decryptedNote = await EncryptionService.decrypt(decryptedNote, userId);
            }

            return {
                createdAt: profile?.created_at || null,
                statusNote: decryptedNote,
                statusNoteAt: profile?.status_note_at || null,
                error
            };
        } catch (error) {
            console.error('User stats fetch failed:', error);
            return { createdAt: null, statusNote: null, statusNoteAt: null, error };
        }
    }
};
