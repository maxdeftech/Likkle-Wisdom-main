/**
 * src/services/messageSyncService.ts — Cross-device message sync.
 * On app init (or after sign-in), fetches all messages for the current user from Supabase
 * and stores them in local IndexedDB. Ensures messages are available offline and on new devices.
 * Sync is throttled (e.g. 15 min) to avoid excessive requests.
 */

import { get, set } from 'idb-keyval';
import { supabase } from './supabase';

const LAST_SYNC_KEY = 'likkle_wisdom_messages_last_sync';
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export const MessageSyncService = {
    async syncAllMessages(userId: string): Promise<void> {
        if (!supabase || !userId) {
            console.log('[MessageSyncService] Skipping sync: no supabase or userId');
            return;
        }

        try {
            const lastSync = await get<number>(LAST_SYNC_KEY);
            const now = Date.now();

            // Avoid syncing too frequently (e.g. if user signs out and in quickly)
            if (lastSync && now - lastSync < SYNC_INTERVAL_MS) {
                console.log('[MessageSyncService] Skipping sync (synced recently)', {
                    timeSinceLastSync: now - lastSync,
                    interval: SYNC_INTERVAL_MS
                });
                return;
            }

            console.log('[MessageSyncService] Starting message sync for user:', userId);

            // Fetch all messages where user is sender or receiver
            const { data: inboxMsgs, error: inboxErr } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_id', userId)
                .order('created_at', { ascending: true });

            if (inboxErr) {
                console.error('[MessageSyncService] Inbox fetch error:', {
                    message: inboxErr.message,
                    code: inboxErr.code
                });
            } else {
                console.log('[MessageSyncService] Fetched inbox messages:', inboxMsgs?.length || 0);
            }

            const { data: sentMsgs, error: sentErr } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', userId)
                .order('created_at', { ascending: true });

            if (sentErr) {
                console.error('[MessageSyncService] Sent messages fetch error:', {
                    message: sentErr.message,
                    code: sentErr.code
                });
            } else {
                console.log('[MessageSyncService] Fetched sent messages:', sentMsgs?.length || 0);
            }

            // Combine and store locally
            const allMsgs = [...(inboxMsgs || []), ...(sentMsgs || [])];
            if (allMsgs.length > 0) {
                // Import update from idb-keyval (avoid circular imports by using direct idb calls)
                const { update } = await import('idb-keyval');
                const STORE_KEY = 'likkle_wisdom_messages';

                let savedCount = 0;
                for (const msg of allMsgs) {
                    try {
                        await update(STORE_KEY, (val: any[] | undefined) => {
                            const messages = val || [];
                            // Prevent duplicates
                            if (messages.find((m: any) => m.id === msg.id)) return messages;
                            savedCount++;
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
                    } catch (updateErr) {
                        console.warn('[MessageSyncService] Failed to save message:', msg.id, updateErr);
                    }
                }

                console.log(`[MessageSyncService] Synced ${savedCount} new messages (${allMsgs.length} total fetched)`);
            } else {
                console.log('[MessageSyncService] No messages to sync');
            }

            // Update last sync time
            await set(LAST_SYNC_KEY, now);
            console.log('[MessageSyncService] Sync completed successfully at', new Date(now).toISOString());
        } catch (e) {
            const errorObj = e as Error;
            console.error('[MessageSyncService] Sync failed:', {
                message: errorObj?.message || String(e),
                name: errorObj?.name || 'Unknown',
                type: typeof e
            });
            // Don't throw; this is a best-effort background sync
        }
    }
};
