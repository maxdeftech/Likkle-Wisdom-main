
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

    /** Fast: returns only from local cache (IndexedDB). Use to show messages immediately while full sync runs. */
    async getMessagesFromCache(userId: string, currentUserId: string): Promise<ChatMessage[]> {
        try {
            const allMessages = await get<ChatMessage[]>(STORE_KEY) || [];
            return allMessages.filter(m =>
                (m.senderId === userId && m.receiverId === currentUserId) ||
                (m.senderId === currentUserId && m.receiverId === userId) ||
                (m.type === 'admin-broadcast')
            ).sort((a, b) => a.timestamp - b.timestamp);
        } catch (e) {
            console.warn('[MessagingService.getMessagesFromCache] IndexedDB unavailable (e.g. iOS private mode):', e);
            return [];
        }
    },

    async getMessages(userId: string, currentUserId: string): Promise<ChatMessage[]> {
        const fromLocal = async (): Promise<ChatMessage[]> => {
            const allMessages = await get<ChatMessage[]>(STORE_KEY) || [];
            return allMessages.filter(m =>
                (m.senderId === userId && m.receiverId === currentUserId) ||
                (m.senderId === currentUserId && m.receiverId === userId) ||
                (m.type === 'admin-broadcast')
            ).sort((a, b) => a.timestamp - b.timestamp);
        };

        try {
            // 1. Try fetching from Supabase first using two separate, simpler queries
            // (Complex .or() filters can fail on iOS WebView; split into two queries instead)
            if (supabase) {
                const cloudMsgs: ChatMessage[] = [];

                // Query 1: Messages from userId to currentUserId
                const { data: msgs1, error: err1 } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('sender_id', userId)
                    .eq('receiver_id', currentUserId)
                    .order('created_at', { ascending: true });

                if (!err1 && msgs1) {
                    cloudMsgs.push(...msgs1.map(m => ({
                        id: m.id,
                        senderId: m.sender_id,
                        receiverId: m.receiver_id,
                        content: m.content,
                        timestamp: new Date(m.created_at).getTime(),
                        read: toBoolean(m.read),
                        type: m.type || 'text',
                        replyToId: m.reply_to_id || undefined
                    })));
                }

                // Query 2: Messages from currentUserId to userId
                const { data: msgs2, error: err2 } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('sender_id', currentUserId)
                    .eq('receiver_id', userId)
                    .order('created_at', { ascending: true });

                if (!err2 && msgs2) {
                    cloudMsgs.push(...msgs2.map(m => ({
                        id: m.id,
                        senderId: m.sender_id,
                        receiverId: m.receiver_id,
                        content: m.content,
                        timestamp: new Date(m.created_at).getTime(),
                        read: toBoolean(m.read),
                        type: m.type || 'text',
                        replyToId: m.reply_to_id || undefined
                    })));
                }

                // Sync to local and deduplicate
                for (const msg of cloudMsgs) {
                    await this.saveMessage(msg);
                }

                if (err1 || err2) {
                    console.warn('[MessagingService.getMessages] Supabase query partial failure:', { err1, err2 });
                }
            }

            return await fromLocal();
        } catch (e) {
            console.warn('[MessagingService.getMessages] Supabase or IndexedDB failed, returning local only:', e);
            try {
                return await fromLocal();
            } catch {
                return [];
            }
        }
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
                    type: m.type || 'text',
                    replyToId: m.reply_to_id || undefined
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

    async sendMessage(senderId: string, receiverId: string, content: string, replyToId?: string) {
        if (!supabase) return;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            senderId,
            receiverId,
            content,
            timestamp: Date.now(),
            read: false,
            type: 'text',
            replyToId
        };

        // 1. Save locally
        await this.saveMessage(newMessage);

        // 2. Save to DB (Persistence) - read column is text type
        const insertPayload: Record<string, unknown> = {
            id: newMessage.id,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content,
            type: 'text',
            read: 'false',
            created_at: new Date(newMessage.timestamp).toISOString()
        };
        if (replyToId) insertPayload.reply_to_id = replyToId;
        const { error } = await supabase.from('messages').insert(insertPayload);

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
    },

    async deleteMessage(messageId: string, senderId: string) {
        if (!supabase) return { error: 'No connection' };
        const { error } = await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', senderId);
        return { error: error?.message };
    },

    async addReaction(messageId: string, userId: string) {
        if (!supabase) return;
        await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: userId, reaction_type: 'like' }, { onConflict: 'message_id,user_id' });
    },
    async removeReaction(messageId: string, userId: string) {
        if (!supabase) return;
        await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', userId);
    },
    async getReactionsForMessages(messageIds: string[], userId: string): Promise<Record<string, { count: number; userReacted: boolean }>> {
        if (!supabase || messageIds.length === 0) return {};
        const { data } = await supabase.from('message_reactions').select('message_id, user_id').in('message_id', messageIds);
        const countMap: Record<string, number> = {};
        const userReactedSet = new Set<string>();
        data?.forEach((r: { message_id: string; user_id: string }) => {
            countMap[r.message_id] = (countMap[r.message_id] || 0) + 1;
            if (r.user_id === userId) userReactedSet.add(r.message_id);
        });
        const out: Record<string, { count: number; userReacted: boolean }> = {};
        messageIds.forEach(id => { out[id] = { count: countMap[id] || 0, userReacted: userReactedSet.has(id) }; });
        return out;
    },

    async setPinnedMessage(userId: string, otherUserId: string, messageId: string) {
        if (!supabase) return;
        await supabase.from('chat_pinned_messages').upsert({ user_id: userId, other_user_id: otherUserId, message_id: messageId }, { onConflict: 'user_id,other_user_id' });
    },
    async getPinnedMessage(userId: string, otherUserId: string): Promise<string | null> {
        if (!supabase) return null;
        const { data } = await supabase.from('chat_pinned_messages').select('message_id').eq('user_id', userId).eq('other_user_id', otherUserId).maybeSingle();
        return data?.message_id ?? null;
    },

    async starMessage(userId: string, messageId: string) {
        if (!supabase) return;
        await supabase.from('starred_messages').upsert({ user_id: userId, message_id: messageId }, { onConflict: 'user_id,message_id' });
    },
    async unstarMessage(userId: string, messageId: string) {
        if (!supabase) return;
        await supabase.from('starred_messages').delete().eq('user_id', userId).eq('message_id', messageId);
    },
    async getStarredMessageIds(userId: string, messageIds: string[]): Promise<Set<string>> {
        if (!supabase || messageIds.length === 0) return new Set();
        const { data } = await supabase.from('starred_messages').select('message_id').eq('user_id', userId).in('message_id', messageIds);
        return new Set((data || []).map((r: { message_id: string }) => r.message_id));
    },

    async getStarredMessagesWithDetails(userId: string): Promise<Array<{ messageId: string; content: string; timestamp: number; otherUserId: string; otherUsername: string }>> {
        if (!supabase) return [];
        const { data: starred } = await supabase.from('starred_messages').select('message_id').eq('user_id', userId).order('created_at', { ascending: false });
        if (!starred?.length) return [];
        const ids = starred.map((r: { message_id: string }) => r.message_id);
        const { data: msgs } = await supabase.from('messages').select('id, content, created_at, sender_id, receiver_id').in('id', ids);
        if (!msgs?.length) return [];
        const otherIds = [...new Set(msgs.map((m: { sender_id: string; receiver_id: string }) => m.sender_id === userId ? m.receiver_id : m.sender_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', otherIds);
        const nameMap: Record<string, string> = {};
        profiles?.forEach((p: { id: string; username: string }) => { nameMap[p.id] = p.username || 'Seeker'; });
        return msgs.map((m: { id: string; content: string; created_at: string; sender_id: string; receiver_id: string }) => {
            const otherUserId = m.sender_id === userId ? m.receiver_id : m.sender_id;
            return { messageId: m.id, content: m.content, timestamp: new Date(m.created_at).getTime(), otherUserId, otherUsername: nameMap[otherUserId] || 'Seeker' };
        });
    }
};
