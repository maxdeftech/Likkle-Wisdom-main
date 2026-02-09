
import { get, set, update } from 'idb-keyval';
import { supabase } from './supabase';
import { ChatMessage } from '../types';

const STORE_KEY = 'likkle_wisdom_messages';

export const MessagingService = {
    // --- Local Storage (IndexedDB) ---

    async saveMessage(message: ChatMessage) {
        await update(STORE_KEY, (val: ChatMessage[] | undefined) => {
            const messages = val || [];
            // Prevent duplicates
            if (messages.find(m => m.id === message.id)) return messages;
            return [...messages, message];
        });
    },

    async getMessages(userId: string, currentUserId: string): Promise<ChatMessage[]> {
        // 1. Try fetching from Supabase first
        if (supabase) {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${userId})`)
                .order('created_at', { ascending: true });

            if (!error && data) {
                const cloudMsgs: ChatMessage[] = data.map(m => ({
                    id: m.id,
                    senderId: m.sender_id,
                    receiverId: m.receiver_id,
                    content: m.content,
                    timestamp: new Date(m.created_at).getTime(),
                    read: m.read,
                    type: m.type || 'text'
                }));
                // Sync to local
                for (const msg of cloudMsgs) {
                    await this.saveMessage(msg);
                }
            }
        }

        // 2. Return from local (which is now synced)
        const allMessages = await get<ChatMessage[]>(STORE_KEY) || [];
        return allMessages.filter(m =>
            (m.senderId === userId && m.receiverId === currentUserId) ||
            (m.senderId === currentUserId && m.receiverId === userId) ||
            (m.type === 'admin-broadcast')
        ).sort((a, b) => a.timestamp - b.timestamp);
    },

    async getAllMessages(): Promise<ChatMessage[]> {
        return await get<ChatMessage[]>(STORE_KEY) || [];
    },

    async markAsRead(senderId: string, receiverId: string) {
        // Local update
        await update(STORE_KEY, (val: ChatMessage[] | undefined) => {
            if (!val) return [];
            return val.map(m => {
                if (m.senderId === senderId && m.receiverId === receiverId && !m.read) return { ...m, read: true };
                return m;
            });
        });

        // Remote update
        if (supabase) {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', senderId)
                .eq('receiver_id', receiverId)
                .eq('read', false);
        }
    },

    async getUnreadCount(userId: string): Promise<number> {
        if (!supabase) return 0;
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('read', false);

        return error ? 0 : (count || 0);
    },

    // --- Realtime / Network ---

    subscribeToMessages(userId: string, onMessage: (msg: ChatMessage) => void) {
        if (!supabase) return null;

        // Use Postgres Changes for persistence + Live Broadcast for speed/fallthrough
        const channel = supabase.channel(`messages:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${userId}`
            }, (payload) => {
                const m = payload.new;
                const msg: ChatMessage = {
                    id: m.id,
                    senderId: m.sender_id,
                    receiverId: m.receiver_id,
                    content: m.content,
                    timestamp: new Date(m.created_at).getTime(),
                    read: m.read,
                    type: m.type || 'text'
                };
                onMessage(msg);
                this.saveMessage(msg);
            })
            .on('broadcast', { event: 'new-message' }, (payload) => {
                const msg = payload.payload as ChatMessage;
                // Broadcasts are faster, but INSERTs are reliable.
                // saveMessage handles duplicates by ID.
                onMessage(msg);
                this.saveMessage(msg);
            })
            .subscribe();

        return channel;
    },

    async sendMessage(senderId: string, receiverId: string, content: string) {
        if (!supabase) return;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            senderId,
            receiverId,
            content,
            timestamp: Date.now(),
            read: false,
            type: 'text'
        };

        // 1. Save locally
        await this.saveMessage(newMessage);

        // 2. Save to DB (Persistence)
        const { error } = await supabase.from('messages').insert({
            id: newMessage.id,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content,
            type: 'text',
            read: false,
            created_at: new Date(newMessage.timestamp).toISOString()
        });

        if (error) {
            console.error("Message save error:", error);
            // If table missing, we still try broadcast for session-only messages
        }

        // 3. Send via Realtime (to receiver's channel)
        await supabase.channel(`messages:${receiverId}`).send({
            type: 'broadcast',
            event: 'new-message',
            payload: newMessage
        });

        return newMessage;
    },

    // Admin Broadcast (Reads from DB, but uses Realtime for live delivery)
    subscribeToAdminMessages(onMessage: (msg: ChatMessage) => void) {
        if (!supabase) return null;

        const channel = supabase.channel('admin_broadcasts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
                const dbMsg = payload.new;
                const msg: ChatMessage = {
                    id: dbMsg.id,
                    senderId: dbMsg.sender_id,
                    receiverId: dbMsg.recipient_id || 'all',
                    content: dbMsg.content,
                    timestamp: new Date(dbMsg.created_at).getTime(),
                    read: false,
                    type: 'admin-broadcast'
                };
                onMessage(msg);
                this.saveMessage(msg);
            })
            .subscribe();

        return channel;
    }
};
