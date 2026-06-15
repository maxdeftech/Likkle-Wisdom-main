/**
 * Client-side notification system for events that don't go through Supabase:
 * - AI generation complete (per module)
 * - PWA update available
 *
 * Stored in localStorage so they persist across page navigations and survive
 * backgrounding on mobile PWA / web.
 */

export interface LocalNotification {
  id: string;
  title: string;
  message: string;
  type: 'ai' | 'update';
  /** Which module triggered this, e.g. 'maps', 'financial', 'trip', 'guide' */
  module?: string;
  createdAt: number;
  read: boolean;
}

const STORAGE_KEY = 'lw_local_notifications';

function load(): LocalNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: LocalNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* storage full — silently drop */ }
}

// Subscribers for real-time UI updates
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const LocalNotifications = {
  /** Get all local notifications, newest first */
  getAll(): LocalNotification[] {
    return load().sort((a, b) => b.createdAt - a.createdAt);
  },

  /** Count unread local notifications */
  getUnreadCount(): number {
    return load().filter(n => !n.read).length;
  },

  /** Add a notification and notify listeners */
  add(notification: Omit<LocalNotification, 'id' | 'createdAt' | 'read'>): LocalNotification {
    const item: LocalNotification = {
      ...notification,
      id: `ln_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      read: false,
    };
    const all = load();
    all.unshift(item);
    // Keep max 50 local notifications
    save(all.slice(0, 50));
    notify();
    return item;
  },

  /** Mark a single notification as read */
  markRead(id: string): void {
    const all = load();
    const item = all.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      save(all);
      notify();
    }
  },

  /** Mark all as read */
  markAllRead(): void {
    const all = load();
    let changed = false;
    for (const n of all) {
      if (!n.read) { n.read = true; changed = true; }
    }
    if (changed) { save(all); notify(); }
  },

  /** Delete a single notification */
  remove(id: string): void {
    const all = load().filter(n => n.id !== id);
    save(all);
    notify();
  },

  /** Clear all local notifications */
  clearAll(): void {
    save([]);
    notify();
  },

  /** Subscribe to changes; returns unsubscribe function */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// ─── Helpers for specific notification types ───

const MODULE_LABELS: Record<string, string> = {
  maps: 'Maps — AI Destination Guide',
  financial: 'Financial Planner',
  trip: 'Trip Planner',
  guide: 'Likkle Guide',
};

/**
 * Fire after AI text generation completes in any module.
 * Creates a local notification AND sends a browser push notification
 * (works even when the tab is backgrounded or the PWA is closed).
 */
export function notifyAIComplete(module: string): void {
  const label = MODULE_LABELS[module] || module;

  LocalNotifications.add({
    title: 'AI Generation Ready',
    message: `Your ${label} result is ready to view.`,
    type: 'ai',
    module,
  });

  // Browser push (visible even when user is outside the app)
  sendBrowserNotification(
    'Likkle Wisdom — AI Ready',
    `Your ${label} result is ready.`,
    module,
  );
}

/**
 * Fire when a PWA update is detected.
 */
export function notifyUpdateAvailable(): void {
  // Avoid duplicate update notifications
  const existing = load();
  const hasRecent = existing.some(
    n => n.type === 'update' && !n.read && Date.now() - n.createdAt < 24 * 60 * 60 * 1000
  );
  if (hasRecent) return;

  LocalNotifications.add({
    title: 'App Update Available',
    message: 'A fresh version of Likkle Wisdom is ready. Update when you\'re ready.',
    type: 'update',
  });
}

/** Low-level: show a browser Notification (works outside app) */
function sendBrowserNotification(title: string, body: string, module?: string): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Don't send if tab is focused — the user already sees the result
  if (document.hasFocus()) return;

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: module ? `likkle-ai-${module}` : 'likkle-update',
    data: { type: module ? 'ai' : 'update', module },
  };

  // Prefer service worker notification (survives tab close)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, options).catch(() => {
        new Notification(title, options);
      });
    }).catch(() => {
      new Notification(title, options);
    });
  } else {
    new Notification(title, options);
  }
}
