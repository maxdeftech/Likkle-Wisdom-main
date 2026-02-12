import { get, set } from 'idb-keyval';
import { supabase } from './supabase';

const LAST_SYNC_KEY = 'likkle_wisdom_messages_last_sync';
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Cross-device message sync: on app init, fetch all messages for the current user
 * and store in local IndexedDB. Then subsequent app loads will have messages available
 * before real-time subscriptions kick in.
 */
export const MessageSyncService = {
    async syncAllMessages(userId: string): Promise<void> {
        if (!supabase || !userId) return;

        try {
            const lastSync = await get<number>(LAST_SYNC_KEY);
            const now = Date.now();

            // Avoid syncing too frequently (e.g. if user signs out and in quickly)
            if (lastSync && now - lastSync < SYNC_INTERVAL_MS) {
                console.log('[MessageSyncService] Skipping sync (synced recently)');
                return;
            }

            console.log('[MessageSyncService] Syncing messages for user:', userId);

            // Fetch all messages where user is sender or receiver
            const { data: inboxMsgs, error: inboxErr } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_id', userId)
                .order('created_at', { ascending: true });

            const { data: sentMsgs, error: sentErr } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', userId)
                .order('created_at', { ascending: true });

            if (inboxErr) console.warn('[MessageSyncService] Inbox fetch error:', inboxErr);
            if (sentErr) console.warn('[MessageSyncService] Sent fetch error:', sentErr);

            // Combine and store locally
            const allMsgs = [...(inboxMsgs || []), ...(sentMsgs || [])];
            if (allMsgs.length > 0) {
                // Import MessagingService to save messages (avoid circular imports by using direct idb calls)
                const { get: getLocal, update } = await import('idb-keyval');
                const STORE_KEY = 'likkle_wisdom_messages';

                for (const msg of allMsgs) {
                    await update(STORE_KEY, (val: any[] | undefined) => {
                        const messages = val || [];
                        // Prevent duplicates
                        if (messages.find((m: any) => m.id === msg.id)) return messages;
                        return [...messages, {
                            id: msg.id,
                            senderId: msg.sender_id,
                            receiverId: msg.receiver_id,
                            content: msg.content,
                            timestamp: new Date(msg.created_at).getTime(),
                            read: msg.read === true || msg.read === 'true',
                            type: msg.type || 'text',
                            replyToId: msg.reply_to_id || undefined
                        }];
                    });
                }

                console.log(`[MessageSyncService] Synced ${allMsgs.length} messages locally`);
            }

            // Update last sync time
            await set(LAST_SYNC_KEY, now);
        } catch (e) {
            console.error('[MessageSyncService] Sync failed:', e);
            // Don't throw; this is a best-effort background sync
        }
    }
};
