
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
        const allMessages = await get<ChatMessage[]>(STORE_KEY) || [];
        return allMessages.filter(m =>
            (m.senderId === userId && m.receiverId === currentUserId) ||
            (m.senderId === currentUserId && m.receiverId === userId) ||
            (m.type === 'admin-broadcast') // Broadcasts show for everyone? Or filter? 
            // Actually broadcasts usually have receiverId = null in DB, but locally we might store differently.
            // For now, simple p2p filtering.
        ).sort((a, b) => a.timestamp - b.timestamp);
    },

    async getAllMessages(): Promise<ChatMessage[]> {
        return await get<ChatMessage[]>(STORE_KEY) || [];
    },

    async markAsRead(senderId: string) {
        await update(STORE_KEY, (val: ChatMessage[] | undefined) => {
            if (!val) return [];
            return val.map(m => {
                if (m.senderId === senderId && !m.read) return { ...m, read: true };
                return m;
            });
        });
    },

    // --- Realtime / Network ---

    subscribeToMessages(userId: string, onMessage: (msg: ChatMessage) => void) {
        if (!supabase) return null;

        const channel = supabase.channel(`messages:${userId}`)
            .on('broadcast', { event: 'new-message' }, (payload) => {
                const msg = payload.payload as ChatMessage;
                // Verify it's for us (broadcasts go to everyone subscribed to channel)
                // If we use a channel per user (e.g. 'room:user_id'), only they get it.
                // We will assume channel name is specific to the receiver.
                onMessage(msg);
                this.saveMessage(msg); // Auto-save received messages
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

        // 2. Send via Realtime (to receiver's channel)
        await supabase.channel(`messages:${receiverId}`).send({
            type: 'broadcast',
            event: 'new-message',
            payload: newMessage
        });

        // 3. TODO: Trigger Push Notification via Edge Function if user is offline?
        // Since we don't store in DB, we rely on Realtime. If they are offline, they miss it unless we use Push.
        // For now, this meets the "messages on own device" requirement.

        return newMessage;
    },

    // Admin Broadcast (Reads from DB, but uses Realtime for live delivery)
    subscribeToAdminMessages(onMessage: (msg: ChatMessage) => void) {
        if (!supabase) return null;

        const channel = supabase.channel('admin_broadcasts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, (payload) => {
                const dbMsg = payload.new;
                // Check if broadcast (recipient_id is null) or specific to us is handled by RLS subscription?
                // Postgres changes filters are limited. 
                // Simplest: Admin sends, we receive.
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
