
import { supabase } from './supabase';
import { FriendRequest, Friendship, User } from '../types';
import { EncryptionService } from './encryption';

export const SocialService = {

    async searchUsers(query: string, currentUserId: string): Promise<User[]> {
        if (!supabase || !query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, is_premium, is_admin, is_donor, is_public')
            .ilike('username', `%${query}%`)
            .neq('id', currentUserId)
            .eq('is_public', true)
            .limit(50);

        if (error) {
            console.error('Search error:', error);
            return [];
        }

        return data.map((p: any) => ({
            id: p.id,
            username: p.username || 'Seeker',
            avatarUrl: p.avatar_url,
            isPremium: p.is_premium,
            isGuest: false,
            isAdmin: p.is_admin,
            isDonor: p.is_donor,
            isPublic: p.is_public
        }));
    },

    async getAllUsers(currentUserId: string, options?: { offset?: number; limit?: number }): Promise<User[]> {
        if (!supabase) return [];

        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? 50;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, is_premium, is_admin, is_donor, is_public')
            .neq('id', currentUserId)
            .eq('is_public', true)
            .order('username', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Fetch all users error:', error);
            return [];
        }

        return data.map((p: any) => ({
            id: p.id,
            username: p.username || 'Seeker',
            avatarUrl: p.avatar_url,
            isPremium: p.is_premium,
            isGuest: false,
            isAdmin: p.is_admin,
            isDonor: p.is_donor,
            isPublic: p.is_public
        }));
    },

    async getMyFriendshipMap(userId: string): Promise<Record<string, 'accepted' | 'pending_outgoing' | 'pending_incoming'>> {
        if (!supabase) return {};

        const { data, error } = await supabase
            .from('friendships')
            .select('requester_id, receiver_id, status')
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .in('status', ['pending', 'accepted']);

        if (error || !data) {
            console.error('Fetch friendships error:', error);
            return {};
        }

        const map: Record<string, 'accepted' | 'pending_outgoing' | 'pending_incoming'> = {};
        data.forEach((row: any) => {
            const otherUserId = row.requester_id === userId ? row.receiver_id : row.requester_id;
            if (!otherUserId) return;
            if (row.status === 'accepted') {
                map[otherUserId] = 'accepted';
                return;
            }
            // pending
            map[otherUserId] = row.requester_id === userId ? 'pending_outgoing' : 'pending_incoming';
        });

        return map;
    },

    async getPublicProfile(userId: string): Promise<User | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, is_premium, is_admin, is_donor, is_public')
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
            isDonor: data.is_donor,
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

        const bookmarkedIds = new Set(bookmarks.map(b => b.item_id));

        // We'll return the IDs and metadata. The frontend will need to filter constants or display metadata for KJV.
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

    async sendFriendRequest(requesterId: string, receiverId: string) {
        if (!supabase) return { error: 'Offline' };

        // Check if already exist
        const { data: existing } = await supabase
            .from('friendships')
            .select('id')
            .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
            .single();

        if (existing) return { error: 'Already connected or request pending' };

        const { error } = await supabase
            .from('friendships')
            .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'pending' });

        if (error) return { error: error.message };
        return { success: true };
    },

    async getFriendRequests(userId: string): Promise<FriendRequest[]> {
        if (!supabase) return [];

        // Get requests where I am the receiver
        const { data, error } = await supabase
            .from('friendships')
            .select(`
        id, created_at, status,
        requester:profiles!requester_id(id, username, avatar_url)
      `)
            .eq('receiver_id', userId)
            .eq('status', 'pending');

        if (error || !data) return [];

        return data.map((r: any) => ({
            id: r.id,
            requesterId: r.requester.id,
            requesterName: r.requester.username || 'Unknown',
            requesterAvatar: r.requester.avatar_url,
            status: r.status,
            timestamp: new Date(r.created_at).getTime()
        }));
    },

    async respondToRequest(requestId: string, accept: boolean) {
        if (!supabase) return;

        if (accept) {
            await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
        } else {
            await supabase.from('friendships').delete().eq('id', requestId);
        }
    },

    subscribeToFriendRequests(userId: string, onChange: () => void) {
        if (!supabase) return null;

        return supabase
            .channel(`friend_requests:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friendships',
                filter: `receiver_id=eq.${userId}`
            }, () => {
                onChange();
            })
            .subscribe();
    },

    async getFriends(userId: string): Promise<Friendship[]> {
        if (!supabase) return [];

        // 1. Where I added them
        const { data: sent } = await supabase
            .from('friendships')
            .select(`friend:profiles!receiver_id(id, username, avatar_url), id, status, created_at`)
            .eq('requester_id', userId)
            .eq('status', 'accepted');

        // 2. Where they added me
        const { data: received } = await supabase
            .from('friendships')
            .select(`friend:profiles!requester_id(id, username, avatar_url), id, status, created_at`)
            .eq('receiver_id', userId)
            .eq('status', 'accepted');

        const friends: Friendship[] = [];

        if (sent) {
            sent.forEach((f: any) => friends.push({
                id: f.id,
                friendId: f.friend.id,
                friendName: f.friend.username,
                friendAvatar: f.friend.avatar_url,
                status: f.status,
                since: new Date(f.created_at).getTime()
            }));
        }

        if (received) {
            received.forEach((f: any) => friends.push({
                id: f.id,
                friendId: f.friend.id,
                friendName: f.friend.username,
                friendAvatar: f.friend.avatar_url,
                status: f.status,
                since: new Date(f.created_at).getTime()
            }));
        }

        // Deduplicate by friendId
        const unique = new Map<string, Friendship>();
        friends.forEach(f => {
            if (!unique.has(f.friendId)) {
                unique.set(f.friendId, f);
            }
        });

        // 3. Fetch last messages for previews
        const friendIds = Array.from(unique.keys());
        if (friendIds.length > 0) {
            // We want the most recent message for each friend pair
            // Simpler: Fetch recent messages for the user and map them
            const { data: lastMsgs } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (lastMsgs) {
                friendIds.forEach(fId => {
                    const msg = lastMsgs.find(m =>
                        (m.sender_id === userId && m.receiver_id === fId) ||
                        (m.sender_id === fId && m.receiver_id === userId)
                    );
                    if (msg) {
                        const friendship = unique.get(fId);
                        if (friendship) {
                            friendship.lastMessage = {
                                content: msg.content,
                                timestamp: new Date(msg.created_at).getTime(),
                                senderId: msg.sender_id
                            };
                        }
                    }
                });
            }
        }

        return Array.from(unique.values()).sort((a, b) => {
            const timeA = a.lastMessage?.timestamp || 0;
            const timeB = b.lastMessage?.timestamp || 0;
            return timeB - timeA; // Most recent first
        });
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

    async deleteFriendship(friendshipId: string) {
        if (!supabase) return { error: 'Offline' };
        const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
        return { error };
    },

    async getFriendshipStatus(userId: string, targetUserId: string): Promise<'pending' | 'accepted' | 'none'> {
        if (!supabase) return 'none';
        const { data, error } = await supabase
            .from('friendships')
            .select('status')
            .or(`and(requester_id.eq.${userId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${userId})`)
            .single();

        if (error || !data) return 'none';
        return data.status;
    },

    async getUserStats(userId: string) {
        if (!supabase) return { friendsCount: 0, createdAt: null };

        // 1. Get friends count
        const { count, error: e1 } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .eq('status', 'accepted');

        // 2. Get profile data
        const { data: profile, error: e2 } = await supabase
            .from('profiles')
            .select('created_at, status_note, status_note_at')
            .eq('id', userId)
            .single();

        let decryptedNote = profile?.status_note || null;
        if (decryptedNote) {
            decryptedNote = await EncryptionService.decrypt(decryptedNote, userId);
        }

        return {
            friendsCount: count || 0,
            createdAt: profile?.created_at || null,
            statusNote: decryptedNote,
            statusNoteAt: profile?.status_note_at || null,
            error: e1 || e2
        };
    }
};
