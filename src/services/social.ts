
import { supabase } from './supabase';
import { FriendRequest, Friendship, User } from '../types';

export const SocialService = {

    async searchUsers(query: string, currentUserId: string): Promise<User[]> {
        if (!supabase || !query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, is_premium, is_admin')
            .ilike('username', `%${query}%`)
            .neq('id', currentUserId)
            .limit(20);

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
            isAdmin: p.is_admin
        }));
    },

    async sendFriendRequest(requesterId: string, receiverId: string) {
        if (!supabase) return { error: 'Offline' };

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

    async getFriends(userId: string): Promise<Friendship[]> {
        if (!supabase) return [];

        // Detailed query to get friends where I am requester OR receiver
        // Supabase OR syntax is tricky with joins. We might need two queries or a view.
        // Simpler: Two queries and merge.

        // 1. Where I added them
        const { data: sent, error: e1 } = await supabase
            .from('friendships')
            .select(`friend:profiles!receiver_id(id, username, avatar_url), id, status, created_at`)
            .eq('requester_id', userId)
            .eq('status', 'accepted');

        // 2. Where they added me
        const { data: received, error: e2 } = await supabase
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

        return friends;
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

        // 2. Get join date
        const { data: profile, error: e2 } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', userId)
            .single();

        return {
            friendsCount: count || 0,
            createdAt: profile?.created_at || null,
            error: e1 || e2
        };
    }
};
