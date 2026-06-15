import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const PLATFORM = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim();

export type PushNotificationTopic = 'daily' | 'updates';
export type PushOpenTarget = 'verse' | 'quote' | 'wisdom' | 'alert' | 'home' | 'update';

type NotificationHandlers = {
  onOpenTarget?: (target: PushOpenTarget) => void;
};

let notificationHandlers: NotificationHandlers = {};
let listenersAttached = false;

const getNotificationPreferenceKey = (userId: string) => `likkle_wisdom_notifications_enabled_${userId}`;
const getUpdateNotificationPreferenceKey = (userId: string) => `likkle_wisdom_update_notifications_enabled_${userId}`;

function isValidUser(userId: string): boolean {
  return !!userId && userId !== 'guest';
}

function getEnabledTopics(userId: string): PushNotificationTopic[] {
  if (!isValidUser(userId)) return [];

  const topics: PushNotificationTopic[] = [];
  if (localStorage.getItem(getNotificationPreferenceKey(userId)) === 'true') topics.push('daily');
  if (localStorage.getItem(getUpdateNotificationPreferenceKey(userId)) === 'true') topics.push('updates');
  return topics;
}

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
      enabled_types: getEnabledTopics(userId),
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
    return PushService.isDailyEnabled(userId);
  },

  isDailyEnabled(userId: string): boolean {
    if (!isValidUser(userId)) return false;
    return localStorage.getItem(getNotificationPreferenceKey(userId)) === 'true';
  },

  isUpdateEnabled(userId: string): boolean {
    if (!isValidUser(userId)) return false;
    return localStorage.getItem(getUpdateNotificationPreferenceKey(userId)) === 'true';
  },

  hasAnyEnabledTopic(userId: string): boolean {
    return getEnabledTopics(userId).length > 0;
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
    if (!PushService.hasAnyEnabledTopic(userId)) return;

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
                enabled_types: getEnabledTopics(userId),
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
    return PushService.setDailyEnabled(userId, enabled);
  },

  async setDailyEnabled(userId: string, enabled: boolean): Promise<boolean> {
    return PushService.setTopicEnabled(userId, 'daily', enabled);
  },

  async setUpdateEnabled(userId: string, enabled: boolean): Promise<boolean> {
    return PushService.setTopicEnabled(userId, 'updates', enabled);
  },

  async setTopicEnabled(userId: string, topic: PushNotificationTopic, enabled: boolean): Promise<boolean> {
    if (!supabase || userId === 'guest') return false;
    const preferenceKey = topic === 'daily' ? getNotificationPreferenceKey(userId) : getUpdateNotificationPreferenceKey(userId);

    if (!enabled) {
      localStorage.setItem(preferenceKey, 'false');
      if (PushService.hasAnyEnabledTopic(userId)) {
        await PushService.registerAndSyncToken(userId);
      } else {
        await PushService.removeToken(userId);
      }
      return false;
    }

    localStorage.setItem(preferenceKey, 'true');
    await PushService.registerAndSyncToken(userId);

    if (PLATFORM === 'web') {
      const granted = PushService.getBrowserPermission() === 'granted';
      if (!granted) {
        localStorage.setItem(preferenceKey, 'false');
      }
      return granted;
    }

    return true;
  },

  async showUpdateReadyNotification(userId: string): Promise<void> {
    if (PLATFORM !== 'web' || !PushService.isUpdateEnabled(userId)) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const title = 'Likkle Wisdom update ready';
    const options: NotificationOptions = {
      body: 'A fresh version is ready. Tap to update now.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'likkle-wisdom-update',
      data: { url: '/?push=update', type: 'update' },
    };

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/web-push/') || await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    }

    new Notification(title, options);
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
