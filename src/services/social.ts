
import { supabase } from './supabase';
import { User } from '../types';
import { EncryptionService } from './encryption';

export const SocialService = {

    async getPublicProfile(userId: string): Promise<User | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, is_premium, is_admin, is_public')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            username: data.username || 'Wisdom Seeker',
            avatarUrl: data.avatar_url,
            isPremium: data.is_premium,
            isGuest: false,
            isAdmin: data.is_admin,
            isPublic: data.is_public
        };
    },

    async getPublicCabinet(userId: string) {
        if (!supabase) return { quotes: [], iconic: [], bible: [], kjv: [] };

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
    },

    async updateProfileNote(userId: string, note: string) {
        if (!supabase) return { error: 'Offline' };

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
    },

    // Realtime Presence for "Online Users" count
    subscribeToPresence(onCountChange: (count: number) => void) {
        if (!supabase) return null;

        const channel = supabase.channel('global_presence', {
            config: { presence: { key: crypto.randomUUID() } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                onCountChange(count);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return channel;
    },

    async getUserStats(userId: string) {
        if (!supabase) return { createdAt: null, statusNote: null, statusNoteAt: null };

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
    }
};
