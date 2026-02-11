import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const PLATFORM = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

export const PushService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  async registerAndSyncToken(userId: string): Promise<void> {
    if (!supabase || userId === 'guest') return;
    if (PLATFORM === 'web') {
      // Web: no device token for server push; in-app/browser notifications only
      return;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener(
        'registration',
        async (ev: { value: string }) => {
          const token = ev?.value;
          if (!token || !supabase) return;
          await supabase.from('push_tokens').upsert(
            {
              user_id: userId,
              token,
              platform: PLATFORM,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,platform' }
          );
        }
      );
    } catch (_) {
      // Plugin or permission not available
    }
  },

  async removeToken(userId: string): Promise<void> {
    if (!supabase || PLATFORM === 'web') return;
    await supabase.from('push_tokens').delete().eq('user_id', userId).eq('platform', PLATFORM);
  }
};
