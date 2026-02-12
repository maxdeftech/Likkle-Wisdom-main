import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const PLATFORM = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

export type PushOpenTarget = 'verse' | 'quote' | 'wisdom' | 'alert' | 'home';

type NotificationHandlers = {
  onOpenTarget?: (target: PushOpenTarget) => void;
};

let notificationHandlers: NotificationHandlers = {};
let listenersAttached = false;

function attachListeners(): void {
  if (PLATFORM === 'web' || listenersAttached) return;
  listenersAttached = true;

  import('@capacitor/push-notifications').then(({ PushNotifications }) => {
    PushNotifications.addListener(
      'pushNotificationReceived',
      (_notification: { data?: Record<string, string> }) => {
        // Optional: show in-app banner when notification received in foreground
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (ev: { notification: { data?: Record<string, string> } }) => {
        const data = ev?.notification?.data;
        const type = (data?.type as PushOpenTarget) || 'home';
        notificationHandlers.onOpenTarget?.(type);
      }
    );
  }).catch(() => {});
}

export const PushService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  setNotificationHandlers(handlers: NotificationHandlers): void {
    notificationHandlers = handlers;
    if (PushService.isNative()) attachListeners();
  },

  async registerAndSyncToken(userId: string): Promise<void> {
    if (!supabase || userId === 'guest') return;
    if (PLATFORM === 'web') return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;

      PushNotifications.addListener(
        'registrationError',
        (err: { error?: unknown }) => {
          console.warn('[PushService] Registration error:', err?.error);
        }
      );

      await PushNotifications.register();

      PushNotifications.addListener(
        'registration',
        async (ev: { value: string }) => {
          const token = ev?.value;
          if (!token || !supabase) return;
          try {
            await supabase.from('push_tokens').upsert(
              {
                user_id: userId,
                token,
                platform: PLATFORM,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'user_id,platform' }
            );
          } catch (e) {
            console.warn('[PushService] Token sync failed:', e);
          }
        }
      );

      attachListeners();
    } catch (_) {
      // Plugin or permission not available
    }
  },

  async removeToken(userId: string): Promise<void> {
    if (!supabase || PLATFORM === 'web') return;
    try {
      await supabase.from('push_tokens').delete().eq('user_id', userId).eq('platform', PLATFORM);
    } catch (_) {}
  }
};
