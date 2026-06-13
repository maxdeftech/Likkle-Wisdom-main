import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const PLATFORM = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim();

export type PushOpenTarget = 'verse' | 'quote' | 'wisdom' | 'alert' | 'home';

type NotificationHandlers = {
  onOpenTarget?: (target: PushOpenTarget) => void;
};

let notificationHandlers: NotificationHandlers = {};
let listenersAttached = false;

const getNotificationPreferenceKey = (userId: string) => `likkle_wisdom_notifications_enabled_${userId}`;

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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function registerWebPush(userId: string): Promise<void> {
  if (!supabase || userId === 'guest') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
  if (!WEB_PUSH_PUBLIC_KEY) {
    console.warn('[PushService] VITE_WEB_PUSH_PUBLIC_KEY is missing.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.register('/web-push-sw.js', {
    scope: '/web-push/'
  });

  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_PUBLIC_KEY)
  });

  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token: JSON.stringify(subscription.toJSON()),
      platform: 'web',
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,platform' }
  );
}

export const PushService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  isEnabled(userId: string): boolean {
    if (!userId || userId === 'guest') return false;
    return localStorage.getItem(getNotificationPreferenceKey(userId)) === 'true';
  },

  getBrowserPermission(): NotificationPermission | 'unsupported' {
    if (PLATFORM !== 'web') return 'granted';
    if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) return 'unsupported';
    return Notification.permission;
  },

  setNotificationHandlers(handlers: NotificationHandlers): void {
    notificationHandlers = handlers;
    if (PushService.isNative()) attachListeners();
  },

  async registerAndSyncToken(userId: string): Promise<void> {
    if (!supabase || userId === 'guest') return;

    if (PLATFORM === 'web') {
      try {
        await registerWebPush(userId);
      } catch (e) {
        console.warn('[PushService] Web push subscription failed:', e);
      }
      return;
    }

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

  async setEnabled(userId: string, enabled: boolean): Promise<boolean> {
    if (!supabase || userId === 'guest') return false;

    if (!enabled) {
      localStorage.setItem(getNotificationPreferenceKey(userId), 'false');
      await PushService.removeToken(userId);
      return false;
    }

    localStorage.setItem(getNotificationPreferenceKey(userId), 'true');
    await PushService.registerAndSyncToken(userId);

    if (PLATFORM === 'web') {
      const granted = PushService.getBrowserPermission() === 'granted';
      if (!granted) {
        localStorage.setItem(getNotificationPreferenceKey(userId), 'false');
      }
      return granted;
    }

    return true;
  },

  async removeToken(userId: string): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('push_tokens').delete().eq('user_id', userId).eq('platform', PLATFORM);

      if (PLATFORM === 'web' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration('/web-push/');
        const subscription = await registration?.pushManager.getSubscription();
        await subscription?.unsubscribe();
      }
    } catch (_) {}
  }
};
