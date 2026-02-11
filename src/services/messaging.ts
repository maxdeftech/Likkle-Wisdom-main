
import { get, set, update } from 'idb-keyval';
import { supabase } from './supabase';
import { ChatMessage } from '../types';

const STORE_KEY = 'likkle_wisdom_messages';

// Helper: the DB 'read' column may be text ('true'/'false') or boolean
// We handle both cases to be safe
const toBoolean = (val: any): boolean => val === true || val === 'true';

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
                    read: toBoolean(m.read),
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
        console.log(`[markAsRead] Marking messages from ${senderId} to ${receiverId} as read...`);
        
        // Local update
        await update(STORE_KEY, (val: ChatMessage[] | undefined) => {
            if (!val) return [];
            return val.map(m => {
                if (m.senderId === senderId && m.receiverId === receiverId && !m.read) return { ...m, read: true };
                return m;
            });
        });

        // Remote update - handle both string and boolean read column types
        if (supabase) {
            try {
                // Fetch ALL messages from sender to receiver
                const { data: allMsgs, error: fetchError } = await supabase
                    .from('messages')
                    .select('id, read')
                    .eq('sender_id', senderId)
                    .eq('receiver_id', receiverId);

                if (fetchError) {
                    console.error('[markAsRead] Fetch error:', fetchError);
                    return;
                }

                console.log(`[markAsRead] Found ${allMsgs?.length || 0} messages from sender to receiver`);

                if (allMsgs && allMsgs.length > 0) {
                    // Filter for unread (handle both string 'false' and boolean false)
                    const unreadIds = allMsgs
                        .filter(m => m.read === false || m.read === 'false')
                        .map(m => m.id);

                    console.log(`[markAsRead] ${unreadIds.length} unread messages to mark as read`);

                    if (unreadIds.length > 0) {
                        // Try batch update first with string 'true'
                        const { data: batchResult, error: batchError } = await supabase
                            .from('messages')
                            .update({ read: 'true' })
                            .in('id', unreadIds)
                            .select('id');

                        if (batchError) {
                            console.error('[markAsRead] Batch string update failed:', batchError);
                            
                            // Fallback: try with boolean true
                            const { data: boolResult, error: boolError } = await supabase
                                .from('messages')
                                .update({ read: true })
                                .in('id', unreadIds)
                                .select('id');

                            if (boolError) {
                                console.error('[markAsRead] Batch boolean update also failed:', boolError);
                                
                                // Last resort: update one by one
                                console.log('[markAsRead] Trying individual updates...');
                                for (const id of unreadIds) {
                                    const { error: individualError } = await supabase
                                        .from('messages')
                                        .update({ read: 'true' })
                                        .eq('id', id);
                                    
                                    if (individualError) {
                                        console.error(`[markAsRead] Failed to update message ${id}:`, individualError);
                                    }
                                }
                            } else {
                                console.log(`[markAsRead] Boolean batch update succeeded, updated ${boolResult?.length || 0} messages`);
                            }
                        } else {
                            console.log(`[markAsRead] String batch update succeeded, updated ${batchResult?.length || 0} messages`);
                        }

                        // Verify the update
                        const { data: verification } = await supabase
                            .from('messages')
                            .select('id, read')
                            .in('id', unreadIds);

                        const stillUnread = verification?.filter(m => m.read === false || m.read === 'false') || [];
                        console.log(`[markAsRead] Verification: ${stillUnread.length} messages still unread after update`);
                    }
                }
            } catch (err) {
                console.error('[markAsRead] exception:', err);
            }
        }
    },

    async getUnreadCount(userId: string): Promise<number> {
        if (!supabase) return 0;
        // Fetch all messages for this user and filter client-side to handle both text/boolean
        const { data, error } = await supabase
            .from('messages')
            .select('id, read')
            .eq('receiver_id', userId);

        if (error || !data) return 0;
        return data.filter(m => m.read === false || m.read === 'false').length;
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
                    read: toBoolean(m.read),
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

        // 2. Save to DB (Persistence) - read column is text type
        const { error } = await supabase.from('messages').insert({
            id: newMessage.id,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content,
            type: 'text',
            read: 'false',
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
