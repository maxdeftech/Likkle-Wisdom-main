
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Tab, Quote, JournalEntry, User, BibleAffirmation, IconicQuote, UserWisdom } from './types';
import { useIsDesktop } from './hooks/useIsDesktop';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, ICONIC_QUOTES, CATEGORIES } from './constants';
import { supabase } from './services/supabase';
import { initializePurchases } from './services/revenueCat';
import { PushService } from './services/pushService';
import { EncryptionService } from './services/encryption';
import { WisdomService } from './services/wisdomService';
import { SocialService } from './services/social';
import { AlertsService } from './services/alertsService';
import SplashScreen from './views/SplashScreen';
import Onboarding from './views/Onboarding';
import Auth from './views/Auth';
import Home from './views/Home';
import Discover from './views/Discover';
import BibleView from './views/BibleView';
import LikkleBook from './views/LikkleBook';
import Profile from './views/Profile';
import AIWisdom from './views/AIWisdom';
import Settings from './views/Settings';
import PremiumUpgrade from './views/PremiumUpgrade';
import AlertsView from './views/AlertsView';
import BottomNav from './components/BottomNav';
import CategoryResultsView from './views/CategoryResultsView';
import LegalView from './views/LegalView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NavigationChatbot from './components/NavigationChatbot';

export type NotificationPayload = {
  message: string;
  type?: 'verse' | 'quote' | 'wisdom' | 'info';
  action?: { type: string; value?: string };
};

const SWIPE_THRESHOLD = 50;

const NotificationBanner: React.FC<{
  payload: NotificationPayload;
  onDismiss: () => void;
  onTap: () => void;
}> = ({ payload, onDismiss, onTap }) => {
  const touchStartY = useRef(0);
  const dismissedRef = useRef(false);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dismissedRef.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dismissedRef.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta < -SWIPE_THRESHOLD) {
      dismissedRef.current = true;
      onDismiss();
    }
  };
  return (
    <div
      className="fixed top-0 left-0 right-0 z-notification px-4 pt-safe pt-4 animate-fade-in"
      onClick={() => { onTap(); onDismiss(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onTap(); onDismiss(); } }}
    >
      <div className="glass backdrop-blur-xl py-3 px-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 bg-white/10 dark:bg-white/5 min-h-[52px]">
        <span className="material-symbols-outlined text-primary text-xl shrink-0">
          {payload.type === 'verse' ? 'menu_book' : 'notifications_active'}
        </span>
        <p className="text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-wider flex-1 truncate">
          {payload.message}
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<View>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [manualRefreshMessage, setManualRefreshMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Prevent keyboard from opening on first load (iOS): blur any auto-focused input
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.activeElement as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true')) {
        el.blur();
      }
    }, 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const showNotification = useCallback((message: string, opts?: { type?: NotificationPayload['type']; action?: NotificationPayload['action'] }) => {
    setNotification({ message, ...opts });
  }, []);
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef(0);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);

  const [profileInitialTab, setProfileInitialTab] = useState<'cabinet' | 'wisdoms'>('cabinet');
  const [profileStartAdding, setProfileStartAdding] = useState(false);

  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [iconicQuotes, setIconicQuotes] = useState<IconicQuote[]>(ICONIC_QUOTES);
  const [bibleAffirmations, setBibleAffirmations] = useState<BibleAffirmation[]>(BIBLE_AFFIRMATIONS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<any[]>([]);
  const [userWisdoms, setUserWisdoms] = useState<UserWisdom[]>([]);

  const syncAlertsCount = useCallback(() => {
    if (user && !user.isGuest && supabase) {
      AlertsService.getUnreadCount(user.id).then(setUnreadAlertsCount);
    }
  }, [user]);

  // Load alerts count on mount
  useEffect(() => {
    if (user && !user.isGuest) {
      syncAlertsCount();
    }
  }, [user, syncAlertsCount]);

  // Native push: register device token for verse/quote/wisdom/alerts of the day
  useEffect(() => {
    if (!user || user.isGuest || !PushService.isNative()) return;
    PushService.registerAndSyncToken(user.id);
  }, [user?.id, user?.isGuest]);

  // When user taps a push notification, open the right tab
  useEffect(() => {
    PushService.setNotificationHandlers({
      onOpenTarget: (target) => {
        setView('main');
        if (target === 'verse') setActiveTab('bible');
        else if (target === 'alert') setShowAlerts(true);
        else setActiveTab('home');
      }
    });
  }, []);

  // Daily scheduled push notifications: wisdom/quote at 8am, verse at 12pm
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const checkAndSendDaily = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayKey = now.toISOString().split('T')[0];

      // 8:00 AM — Quote/Wisdom of the day
      if (hour === 8 && minute < 5) {
        const sentKey = `likkle_notif_quote_${todayKey}`;
        if (!localStorage.getItem(sentKey)) {
          const idx = Math.floor(Math.random() * INITIAL_QUOTES.length);
          const q = INITIAL_QUOTES[idx];
          new Notification('Likkle Wisdom — Quote of di Day', {
            body: `"${q.patois}" — ${q.english}`,
            icon: '/icon-192.png',
            tag: `daily-quote-${todayKey}`
          });
          localStorage.setItem(sentKey, '1');
        }
      }

      // 12:00 PM — Verse of the day
      if (hour === 12 && minute < 5) {
        const sentKey = `likkle_notif_verse_${todayKey}`;
        if (!localStorage.getItem(sentKey)) {
          const idx = Math.floor(Math.random() * BIBLE_AFFIRMATIONS.length);
          const v = BIBLE_AFFIRMATIONS[idx];
          new Notification('Likkle Wisdom — Verse of di Day', {
            body: `${v.reference}: "${v.patois}"`,
            icon: '/icon-192.png',
            tag: `daily-verse-${todayKey}`
          });
          localStorage.setItem(sentKey, '1');
        }
      }
    };

    // Check immediately and then every minute
    checkAndSendDaily();
    const interval = setInterval(checkAndSendDaily, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNotification({ message: 'Signal back! Syncing vibes...', type: 'info' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNotification({ message: 'Offline mode active. Keep growing.', type: 'info' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize RevenueCat
    initializePurchases();

    // Load cached content from localStorage for immediate display
    const cachedQuotes = localStorage.getItem('lkkle_quotes');
    const cachedIconic = localStorage.getItem('lkkle_iconic');
    const cachedBible = localStorage.getItem('lkkle_bible');
    const cachedEntries = localStorage.getItem('lkkle_journal');
    const cachedVerses = localStorage.getItem('lkkle_verses');
    const cachedUserWisdoms = localStorage.getItem('lkkle_user_wisdoms');

    if (cachedQuotes) setQuotes(JSON.parse(cachedQuotes));
    if (cachedIconic) setIconicQuotes(JSON.parse(cachedIconic));
    if (cachedBible) setBibleAffirmations(JSON.parse(cachedBible));
    if (cachedEntries) setJournalEntries(JSON.parse(cachedEntries));
    if (cachedVerses) setBookmarkedVerses(JSON.parse(cachedVerses));
    if (cachedUserWisdoms) setUserWisdoms(JSON.parse(cachedUserWisdoms));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const syncUserContent = useCallback(async (userId: string) => {
    if (!supabase || userId === 'guest' || !navigator.onLine) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profile) {
        // Prefer profile from DB over any stale session metadata (fixes stale avatar on refresh)
        setUser(prev => ({
          id: userId,
          username: profile.username ?? prev?.username ?? 'Seeker',
          avatarUrl: profile.avatar_url ?? prev?.avatarUrl ?? undefined,
          isPremium: profile.is_premium ?? prev?.isPremium ?? false,
          isAdmin: profile.is_admin ?? false,
          isPublic: profile.is_public !== undefined ? profile.is_public : true,
          isGuest: false
        }));
      }


      const { data: bookmarks } = await supabase.from('bookmarks').select('*').eq('user_id', userId);
      if (bookmarks) {
        const bookmarkedIds = new Set(bookmarks.map(b => b.item_id));
        setQuotes(prev => prev.map(q => ({ ...q, isFavorite: bookmarkedIds.has(q.id) })));
        setIconicQuotes(prev => prev.map(q => ({ ...q, isFavorite: bookmarkedIds.has(q.id) })));
        setBibleAffirmations(prev => prev.map(b => ({ ...b, isFavorite: bookmarkedIds.has(b.id) })));

        const kjvBookmarks = bookmarks
          .filter(b => b.item_type === 'kjv')
          .map(b => {
            let meta = b.metadata;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch { meta = {}; }
            }
            return {
              id: b.item_id,
              text: meta?.text || 'Verse saved',
              reference: meta?.reference || 'KJV Bible',
              timestamp: b.created_at ? new Date(b.created_at).getTime() : Date.now()
            };
          });
        setBookmarkedVerses(kjvBookmarks);

        // Cache to localStorage
        localStorage.setItem('lkkle_quotes', JSON.stringify(quotes));
        localStorage.setItem('lkkle_iconic', JSON.stringify(iconicQuotes));
        localStorage.setItem('lkkle_bible', JSON.stringify(bibleAffirmations));
        localStorage.setItem('lkkle_verses', JSON.stringify(kjvBookmarks));
      }

      const { data: entries } = await supabase.from('journal_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
      if (entries) {
        const decryptedEntries = await Promise.all(entries.map(async (e: any) => ({
          ...e,
          title: await EncryptionService.decrypt(e.title, userId),
          text: await EncryptionService.decrypt(e.text, userId)
        })));
        setJournalEntries(decryptedEntries);
        localStorage.setItem('lkkle_journal', JSON.stringify(decryptedEntries));
      }
      const wisdoms = await WisdomService.getUserWisdoms(userId);
      setUserWisdoms(wisdoms);
      localStorage.setItem('lkkle_user_wisdoms', JSON.stringify(wisdoms));
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session error:", error);
        if (error.message && error.message.includes("refresh_token_not_found")) {
          supabase?.auth.signOut();
          setUser(null);
          if (view !== 'splash') setView('auth');
        }
      } else if (session) {
        syncUserContent(session.user.id);
        if (view === 'splash' || view === 'auth') setView('main');
      } else if (view === 'main' && (!user || !user.isGuest)) {
        // Only force back to auth if we *expected* a real Supabase session
        setView('auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Prefer existing profile (prev) over session user_metadata to avoid name/avatar
        // glitching when JWT metadata is stale (e.g. after profile update or token refresh).
        setUser(prev => ({
          ...(prev || {}),
          id: session.user.id,
          username: prev?.username ?? session.user.user_metadata?.username ?? 'Seeker',
          avatarUrl: prev?.avatarUrl ?? session.user.user_metadata?.avatar_url,
          isGuest: false,
          isPremium: prev?.isPremium ?? true,
          isAdmin: prev?.isAdmin ?? false
        }));
        syncUserContent(session.user.id);
        if (view === 'auth' || view === 'splash') setView('main');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUserContent]);

  useEffect(() => {
    if (view === 'splash') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              if (!user) setView('onboarding');
              else setView('main');
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [view, user]);

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    if (!user.isGuest && supabase && navigator.onLine) {
      try {
        await supabase.from('profiles').update({
          username: data.username || user.username,
          avatar_url: data.avatarUrl || user.avatarUrl,
          is_premium: data.isPremium !== undefined ? data.isPremium : user.isPremium,
          is_public: data.isPublic !== undefined ? data.isPublic : user.isPublic
        }).eq('id', user.id);
      } catch (e) { console.error("Update sync error:", e); }
    }
  };


  const handleToggleFavorite = async (id: string, type: 'quote' | 'iconic' | 'bible') => {
    if (user?.isGuest) {
      setShowAuthGate(true);
      return;
    }
    let newState = false;
    if (type === 'quote') setQuotes(prev => prev.map(q => q.id === id ? { ...q, isFavorite: newState = !q.isFavorite, updatedAt: Date.now() } : q));
    else if (type === 'iconic') setIconicQuotes(prev => prev.map(q => q.id === id ? { ...q, isFavorite: newState = !q.isFavorite } : q));
    else if (type === 'bible') setBibleAffirmations(prev => prev.map(q => q.id === id ? { ...q, isFavorite: newState = !q.isFavorite } : q));

    if (user && !user.isGuest && supabase && navigator.onLine) {
      try {
        if (newState) {
          // Collect metadata for better sync/display
          let metadata = {};
          if (type === 'quote') {
            const q = quotes.find(q => q.id === id);
            if (q) metadata = { patois: q.patois, english: q.english, category: q.category };
          } else if (type === 'iconic') {
            const q = iconicQuotes.find(q => q.id === id);
            if (q) metadata = { text: q.text, author: q.author };
          } else if (type === 'bible') {
            const q = bibleAffirmations.find(q => q.id === id);
            if (q) metadata = { patois: q.patois, reference: q.reference };
          }

          await supabase.from('bookmarks').insert({
            user_id: user.id,
            item_id: id,
            item_type: type,
            metadata
          });
        } else {
          await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_id', id);
        }
      } catch (e) {
        console.error("Bookmark error:", e);
        setNotification({ message: "Couldn't sync to cloud.", type: 'info' });
      }
    }
    setNotification({ message: newState ? 'Saved to cabinet! ✨' : 'Removed from cabinet.', type: 'info' });
  };

  const handleBookmarkBibleVerse = async (verse: any) => {
    if (user?.isGuest) {
      setShowAuthGate(true);
      return;
    }
    const verseId = `kjv-${verse.book_id}-${verse.chapter}-${verse.verse}`;
    const reference = `${verse.book_name} ${verse.chapter}:${verse.verse}`;
    let exists = false;
    setBookmarkedVerses(prev => {
      const alreadyIn = prev.find(v => v.id === verseId);
      if (alreadyIn) {
        exists = true;
        return prev.filter(v => v.id !== verseId);
      }
      return [{ id: verseId, text: verse.text, reference, timestamp: Date.now() }, ...prev];
    });
    if (user && !user.isGuest && supabase && navigator.onLine) {
      try {
        if (!exists) {
          await supabase.from('bookmarks').insert({
            user_id: user.id,
            item_id: verseId,
            item_type: 'kjv',
            metadata: { text: verse.text, reference }
          });
        } else {
          await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_id', verseId);
        }
      } catch (e) { console.error("Bible save error:", e); }
    }
    setNotification({ message: !exists ? 'Verse saved to cabinet! 📖' : 'Verse removed.', type: 'info' });
  };

  const handleAddJournalEntry = async (title: string, text: string, mood: string) => {
    if (user?.isGuest) {
      setShowAuthGate(true);
      return;
    }
    const newEntry: JournalEntry = { id: Date.now().toString(), title, text, mood, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(), timestamp: Date.now() };
    setJournalEntries(prev => [newEntry, ...prev]);
    if (user && !user.isGuest && supabase && navigator.onLine) {
      try {
        const encryptedTitle = await EncryptionService.encrypt(title, user.id);
        const encryptedText = await EncryptionService.encrypt(text, user.id);
        const { error: insertError } = await supabase.from('journal_entries').insert({
          user_id: user.id,
          title: encryptedTitle,
          text: encryptedText,
          mood,
          date: newEntry.date,
          timestamp: newEntry.timestamp
        });

        if (insertError) {
          console.error("Supabase Journal Insert Error:", insertError);
          setNotification({ message: "Failed to sync journal to cloud. ⚠️", type: 'info' });
        } else {
          setNotification({ message: 'Journal saved! ✍️', type: 'info' });
        }
      }
      catch (e) {
        console.error("Journal processing error:", e);
        setNotification({ message: "Error processing journal entry.", type: 'info' });
      }
    } else {
      setNotification({ message: 'Journal saved locally! 📝', type: 'info' });
    }
  };

  const handleDeleteJournalEntry = async (id: string) => {
    setJournalEntries(prev => prev.filter(entry => entry.id !== id));
    if (user && !user.isGuest && supabase && navigator.onLine) {
      try { await supabase.from('journal_entries').delete().eq('timestamp', parseInt(id)); }
      catch (e) { console.error("Delete journal error:", e); }
    }
    setNotification({ message: 'Entry removed! 🗑️', type: 'info' });
  };

  const handleRemoveBookmark = async (id: string, type: string) => {
    if (type === 'kjv') setBookmarkedVerses(prev => prev.filter(v => v.id !== id));
    else if (type === 'quote' || type === 'wisdom') setQuotes(prev => prev.map(q => q.id === id ? { ...q, isFavorite: false } : q));
    else if (type === 'legend' || type === 'iconic') setIconicQuotes(prev => prev.map(q => q.id === id ? { ...q, isFavorite: false } : q));
    else if (type === 'verse' || type === 'bible') setBibleAffirmations(prev => prev.map(q => q.id === id ? { ...q, isFavorite: false } : q));
    if (user && !user.isGuest && supabase && navigator.onLine) {
      try { await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_id', id); }
      catch (e) { console.error("Remove bookmark error:", e); }
    }
    setNotification({ message: 'Removed! 🗑️', type: 'info' });
  };

  const handleSignOut = async () => {
    setShowSettings(false);
    const wasGuest = user?.isGuest;
    const userId = user?.id;
    
    // Clear local state immediately so UI updates
    setUser(null);
    setView('auth');
    
    // Clear localStorage to prevent session restoration
    localStorage.removeItem('lkkle_quotes');
    localStorage.removeItem('lkkle_iconic');
    localStorage.removeItem('lkkle_bible');
    localStorage.removeItem('lkkle_journal');
    localStorage.removeItem('lkkle_verses');
    localStorage.removeItem('lkkle_user_wisdoms');
    
    // Background cleanup
    try {
      if (!wasGuest && userId) await PushService.removeToken(userId);
      if (!wasGuest && supabase) await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out cleanup error:', e);
    }
  };

  const handleAddWisdom = async (patois: string, english: string) => {
    if (!user) return;

    // Guests must sign up before saving wisdom
    if (user.isGuest) {
      setShowAuthGate(true);
      return;
    }

    // Basic offline guard to avoid confusing network errors
    if (!navigator.onLine) {
      setNotification({ message: "No signal right now. Try plant di wisdom when yuh back online.", type: 'info' });
      return;
    }

    const { data, error } = await WisdomService.createUserWisdom(user.id, patois, english);
    if (data) {
      setUserWisdoms(prev => [data, ...prev]);
      setNotification({ message: "Wisdom planted in yuh garden! 🌱", type: 'info' });
    } else if (error) {
      // Normalize generic network errors into a clearer message
      const lower = error.toLowerCase();
      const friendly = lower.includes('load failed') || lower.includes('failed to fetch')
        ? "Network hiccup while planting wisdom. Check connection and try again."
        : `Could not plant wisdom: ${error}`;
      setNotification({ message: friendly, type: 'info' });
    }
  };

  const handleDeleteWisdom = async (id: string) => {
    const { error } = await WisdomService.deleteWisdom(id);
    if (!error) {
      setUserWisdoms(prev => prev.filter(w => w.id !== id));
      setNotification({ message: "Wisdom returned to di stars. ✨", type: 'info' });
    }
  };

  const handleOpenAI = () => {
    if (user?.isGuest) {
      setShowAuthGate(true);
    } else {
      setShowAI(true);
    }
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleOpenPremium = () => {
    setShowPremium(true);
  };

  const handleNotificationTap = useCallback((action?: NotificationPayload['action']) => {
    setNotification(null);
    if (action?.type === 'bible') {
      setActiveTab('bible');
      setView('main');
    } else if (action?.type === 'home') {
      setActiveTab('home');
      setView('main');
    }
  }, []);

  const handleOpenAlerts = () => {
    setShowAlerts(true);
  };

  const handleOpenPublicProfile = (id: string) => {
    setShowAlerts(false);
    setPublicProfileId(id);
  };

  const handleOpenCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleGoToWisdomCreator = () => {
    setProfileInitialTab('wisdoms');
    setProfileStartAdding(true);
    setActiveTab('me');
    setActiveCategory(null);
  };

  const handleRefreshApp = () => {
    setManualRefreshMessage("we deh cook up the vibes, we soon let yuh back in");
    setView('splash');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleBotNavigate = (type: string, value: string) => {
    if (type === 'tab') {
      setActiveTab(value as Tab);
      setActiveCategory(null);
      setView('main');
      setShowSettings(false);
      setShowAI(false);
      setShowPremium(false);
      setPublicProfileId(null);
    } else if (type === 'setting') {
      if (value === 'settings') handleOpenSettings();
      if (value === 'premium') handleOpenPremium();
      if (value === 'ai') handleOpenAI();
      if (value === 'alerts') handleOpenAlerts();
    }
  };

  const renderContent = () => {
    if (view === 'privacy') return <LegalView type="privacy" onClose={() => setView('main')} />;
    if (view === 'terms') return <LegalView type="terms" onClose={() => setView('main')} />;
    if (activeCategory) return <CategoryResultsView categoryId={activeCategory} onClose={() => setActiveCategory(null)} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} onFavorite={handleToggleFavorite} />;

    if (!user) {
      if (view === 'onboarding') return <Onboarding onFinish={() => setView('auth')} />;
      return <Auth onAuthComplete={(u) => { setUser(u); setView('main'); if (!u.isGuest) syncUserContent(u.id); }} />;
    }

    switch (activeTab) {
      case 'home': return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenAlerts={handleOpenAlerts} alertsCount={unreadAlertsCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} quotes={quotes} bibleAffirmations={bibleAffirmations} />;
      case 'discover': return <Discover searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategoryClick={handleOpenCategory} isOnline={isOnline} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} />;
      case 'bible': return <BibleView user={user} onBookmark={handleBookmarkBibleVerse} onUpgrade={handleOpenPremium} isOnline={isOnline} />;
      case 'book': return <LikkleBook entries={journalEntries} onAdd={handleAddJournalEntry} onDelete={handleDeleteJournalEntry} searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case 'me': return <Profile user={user} entries={journalEntries} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} bookmarkedVerses={bookmarkedVerses} userWisdoms={userWisdoms} onOpenSettings={handleOpenSettings} onStatClick={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onUpdateUser={handleUpdateUser} onRemoveBookmark={handleRemoveBookmark} onAddWisdom={handleAddWisdom} onDeleteWisdom={handleDeleteWisdom} onRefresh={handleRefreshApp} initialTab={profileInitialTab} startAdding={profileStartAdding} />;
      default: return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenAlerts={handleOpenAlerts} alertsCount={unreadAlertsCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} quotes={quotes} bibleAffirmations={bibleAffirmations} />;
    }
  };

  // Swipe navigation
  const TAB_ORDER: Tab[] = ['home', 'bible', 'book', 'me'];
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Ignore swipes when overlays are open
    if (showSettings || showAI || showPremium || publicProfileId || activeCategory) return;
    if (view !== 'main') return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger for horizontal swipes (more horizontal than vertical)
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    const currentIdx = TAB_ORDER.indexOf(activeTab);
    if (currentIdx === -1) return;

    if (dx < 0 && currentIdx < TAB_ORDER.length - 1) {
      // Swipe left -> next tab
      setActiveTab(TAB_ORDER[currentIdx + 1]);
      setActiveCategory(null);
    } else if (dx > 0 && currentIdx > 0) {
      // Swipe right -> previous tab
      setActiveTab(TAB_ORDER[currentIdx - 1]);
      setActiveCategory(null);
    }
  };

  // Pull-to-refresh handlers
  const handlePullStart = (e: React.TouchEvent) => {
    const scrollTop = mainScrollRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handlePullMove = (e: React.TouchEvent) => {
    const scrollTop = mainScrollRef.current?.scrollTop || 0;
    if (scrollTop > 0 || pullStartY.current === 0) return;

    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0 && dy < 150) {
      setPullDistance(dy);
      setIsPulling(true);
    }
  };

  const handlePullEnd = async () => {
    if (pullDistance > 80) {
      // Trigger refresh
      await handleRefreshApp();
    }
    setIsPulling(false);
    setPullDistance(0);
    pullStartY.current = 0;
  };

  if (view === 'splash') return <SplashScreen progress={loadingProgress} message={manualRefreshMessage || undefined} />;

  const containerClass = isDesktop
    ? 'relative flex flex-col h-screen w-full max-w-5xl min-w-[640px] mx-auto overflow-hidden bg-white dark:bg-background-dark shadow-2xl transition-colors duration-300'
    : 'relative flex flex-col h-screen w-full max-w-2xl mx-auto overflow-hidden bg-white dark:bg-background-dark shadow-2xl transition-colors duration-300';

  return (
    <div className={containerClass}>
      <div className="fixed inset-0 jamaica-gradient opacity-60 pointer-events-none z-0"></div>

      {!isOnline && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-notification animate-fade-in pointer-events-none">
          <div className="glass px-6 py-2 rounded-full border-red-500/20 bg-background-dark/80 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5">
            <span className="material-symbols-outlined text-red-500 text-sm animate-pulse">wifi_off</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-black uppercase text-white tracking-[0.2em]">Signal Low</span>
              <span className="text-[7px] font-bold uppercase text-white/40 tracking-[0.1em]">Stashed wisdom active</span>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <NotificationBanner
          payload={notification}
          onDismiss={() => setNotification(null)}
          onTap={() => handleNotificationTap(notification.action)}
        />
      )}
      <main 
        ref={mainScrollRef}
        className="flex-1 relative z-10 overflow-y-auto no-scrollbar scroll-smooth pt-safe" 
        onTouchStart={(e) => { handleTouchStart(e); handlePullStart(e); }} 
        onTouchMove={handlePullMove}
        onTouchEnd={(e) => { handleTouchEnd(e); handlePullEnd(); }}
      >
        {/* Pull-to-refresh indicator */}
        {isPulling && (
          <div 
            className="absolute top-0 left-0 right-0 flex justify-center items-center z-50 transition-all duration-200"
            style={{ height: `${pullDistance}px` }}
          >
            <div className={`flex flex-col items-center gap-1 transition-opacity ${pullDistance > 80 ? 'opacity-100' : 'opacity-40'}`}>
              <span className={`material-symbols-outlined text-primary text-2xl ${pullDistance > 80 ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">
                {pullDistance > 80 ? 'Release to refresh' : 'Pull down'}
              </span>
            </div>
          </div>
        )}
        {renderContent()}
      </main>

      {showAuthGate && (
        <GuestAuthModal onClose={() => setShowAuthGate(false)} onSignUp={() => { setShowAuthGate(false); setView('auth'); }} />
      )}

      {showSettings && user && (
        <Settings
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onClose={() => setShowSettings(false)}
          onSignOut={handleSignOut}
          onUpdateUser={handleUpdateUser}
          onOpenPrivacy={() => {
            setShowSettings(false);
            setView('privacy');
          }}
          onOpenTerms={() => {
            setShowSettings(false);
            setView('terms');
          }}
        />
      )}
      {showAI && user && (
        <AIWisdom
          user={user}
          isOnline={isOnline}
          onClose={() => setShowAI(false)}
          onUpgrade={handleOpenPremium}
          onGuestRestricted={() => {
            setShowAI(false);
            setShowAuthGate(true);
          }}
        />
      )}
      {showPremium && (
        <PremiumUpgrade
          onClose={() => setShowPremium(false)}
          onPurchaseSuccess={() => {
            setShowPremium(false);
            setNotification({ message: "Thanks fi di support!", type: 'info' });
          }}
        />
      )}
      {publicProfileId && user && (
        <div className="fixed inset-0 z-overlay flex flex-col overflow-hidden bg-white dark:bg-background-dark">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <Profile
              user={user}
              entries={journalEntries}
              quotes={quotes}
              iconic={iconicQuotes}
              bible={bibleAffirmations}
              bookmarkedVerses={bookmarkedVerses}
              userWisdoms={[]}
              viewingUserId={publicProfileId}
              onClose={() => setPublicProfileId(null)}
              onOpenSettings={() => { }}
              onStatClick={() => { }}
              onUpdateUser={() => { }}
              onRemoveBookmark={() => { }}
              onAddWisdom={() => { }}
              onDeleteWisdom={() => { }}
            />
          </div>
        </div>
      )}

      {user && (
        <NavigationChatbot onNavigate={handleBotNavigate} />
      )}
      {showAlerts && user && (
        <AlertsView
          user={user}
          onClose={() => setShowAlerts(false)}
          onUnreadUpdate={syncAlertsCount}
        />
      )}
      {user && view !== 'auth' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); setProfileInitialTab('cabinet'); setProfileStartAdding(false); }}
          onOpenWisdomCreator={handleGoToWisdomCreator}
        />
      )}
      <PWAInstallPrompt />
    </div>
  );
};

const GuestAuthModal: React.FC<{ onClose: () => void; onSignUp: () => void }> = ({ onClose, onSignUp }) => (
  <div className="fixed inset-0 z-modal bg-background-dark/95 flex flex-col items-center justify-center p-8 backdrop-blur-xl animate-fade-in">
    <div className="glass p-10 rounded-[3rem] w-full max-w-[340px] text-center border-white/10 shadow-2xl">
      <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
        <span className="material-symbols-outlined text-4xl">person_add</span>
      </div>
      <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Join di Family!</h2>
      <p className="text-white/50 text-xs font-bold mb-8 leading-relaxed">Guests can browse, but yuh need an account fi save wisdom, write inna journal, or use AI.</p>
      <div className="space-y-4">
        <button onClick={onSignUp} className="w-full bg-primary py-4 rounded-xl font-black text-[12px] uppercase text-background-dark shadow-xl active:scale-95 transition-all">Sign Up / Sign In</button>
        <button onClick={onClose} className="w-full glass py-4 rounded-xl font-black text-[10px] uppercase text-white/40 active:scale-95 transition-all">Keep Browsin'</button>
      </div>
    </div>
  </div>
);



export default App;
