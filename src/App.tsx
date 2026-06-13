
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Tab, Quote, JournalEntry, User, BibleAffirmation, IconicQuote, UserWisdom } from './types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, ICONIC_QUOTES, CATEGORIES } from './constants';
import { supabase } from './services/supabase';
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
import AlertsView from './views/AlertsView';
import BottomNav from './components/BottomNav';
import CategoryResultsView from './views/CategoryResultsView';
import JamaicanHistoryView from './views/JamaicanHistoryView';
import LegalView from './views/LegalView';
import AppGuideView from './views/AppGuideView';
import TravelView from './views/TravelView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import NavigationChatbot from './components/NavigationChatbot';
import WelcomeModal from './components/WelcomeModal';
import GuestAuthModal from './components/GuestAuthModal';
import { validateWisdomText } from './utils/validation';

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
      aria-label={`Notification: ${payload.message}. Activate to open.`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onTap(); onDismiss(); } }}
    >
      <div className="glass backdrop-blur-xl py-3 px-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 bg-white/10 dark:bg-white/5 min-h-[52px]" aria-live="polite" aria-atomic="true">
        <span className="material-symbols-outlined text-primary text-xl shrink-0" aria-hidden="true">
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
  const [view, setView] = useState<View>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [manualRefreshMessage, setManualRefreshMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [showAI, setShowAI] = useState(false);
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
      AlertsService.getUnreadCount(user.id)
        .then(setUnreadAlertsCount)
        .catch(error => console.error('Unread alerts sync failed:', error));
    }
  }, [user]);

  // Load alerts count on mount
  useEffect(() => {
    if (user && !user.isGuest) {
      syncAlertsCount();
    }
  }, [user, syncAlertsCount]);

  // First-time welcome: show once per user when they reach main (signed in, not guest)
  useEffect(() => {
    if (!user || user.isGuest || view !== 'main') return;
    const key = `likkle_wisdom_welcome_seen_${user.id}`;
    if (!localStorage.getItem(key)) setShowWelcomeModal(true);
  }, [user?.id, user?.isGuest, view]);

  const handleCloseWelcome = useCallback(() => {
    if (user && !user.isGuest) localStorage.setItem(`likkle_wisdom_welcome_seen_${user.id}`, '1');
    setShowWelcomeModal(false);
  }, [user?.id, user?.isGuest]);

  // Push notifications: native apps use APNs/FCM; PWA uses Web Push
  useEffect(() => {
    if (!user || user.isGuest) return;
    if (!PushService.isEnabled(user.id)) return;
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
    setLoadingProgress(prev => Math.max(prev, 25));

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
          isAdmin: profile.is_admin ?? false,
          isPublic: profile.is_public !== undefined ? profile.is_public : true,
          isGuest: false
        }));
      }


      const { data: bookmarks } = await supabase.from('bookmarks').select('*').eq('user_id', userId);
      if (bookmarks) {
        const bookmarkedIds = new Set(bookmarks.map(b => b.item_id));
        setQuotes(prev => {
          const updatedQuotes = prev.map(q => ({ ...q, isFavorite: bookmarkedIds.has(q.id) }));
          localStorage.setItem('lkkle_quotes', JSON.stringify(updatedQuotes));
          return updatedQuotes;
        });
        setIconicQuotes(prev => {
          const updatedIconic = prev.map(q => ({ ...q, isFavorite: bookmarkedIds.has(q.id) }));
          localStorage.setItem('lkkle_iconic', JSON.stringify(updatedIconic));
          return updatedIconic;
        });
        setBibleAffirmations(prev => {
          const updatedBible = prev.map(b => ({ ...b, isFavorite: bookmarkedIds.has(b.id) }));
          localStorage.setItem('lkkle_bible', JSON.stringify(updatedBible));
          return updatedBible;
        });

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
    let cancelled = false;

    const completeInitialization = (nextView: View) => {
      if (cancelled) return;
      setLoadingProgress(100);
      setManualRefreshMessage(null);
      setView(nextView);
    };

    const initializeAuth = async () => {
      setLoadingProgress(prev => Math.max(prev, 45));

      if (!supabase) {
        completeInitialization('onboarding');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("Session error:", error);
          if (error.message && error.message.includes("refresh_token_not_found")) {
            await supabase.auth.signOut();
            setUser(null);
            completeInitialization('auth');
            return;
          }
          completeInitialization('onboarding');
          return;
        }

        setLoadingProgress(prev => Math.max(prev, 65));

        if (session) {
          await syncUserContent(session.user.id);
          completeInitialization('main');
        } else {
          completeInitialization('onboarding');
        }
      } catch (err) {
        console.warn("getSession failed:", err);
        completeInitialization('onboarding');
      }
    };

    const subscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;

      if (session) {
        // Prefer existing profile (prev) over session user_metadata to avoid name/avatar
        // glitching when JWT metadata is stale (e.g. after profile update or token refresh).
        setUser(prev => ({
          ...(prev || {}),
          id: session.user.id,
          username: prev?.username ?? session.user.user_metadata?.username ?? 'Seeker',
          avatarUrl: prev?.avatarUrl ?? session.user.user_metadata?.avatar_url,
          isGuest: false,
          isAdmin: prev?.isAdmin ?? false
        }));
        void syncUserContent(session.user.id).catch(error => console.error('Auth content sync failed:', error));
        setView('main');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('auth');
      }
    }).data.subscription;

    initializeAuth();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [syncUserContent]);

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    if (!user.isGuest && supabase && navigator.onLine) {
      try {
        await supabase.from('profiles').update({
          username: data.username || user.username,
          avatar_url: data.avatarUrl || user.avatarUrl,
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
        const { data: insertedEntry, error: insertError } = await supabase.from('journal_entries').insert({
          user_id: user.id,
          title: encryptedTitle,
          text: encryptedText,
          mood,
          date: newEntry.date,
          timestamp: newEntry.timestamp
        }).select('id').single();

        if (insertError) {
          console.error("Supabase Journal Insert Error:", insertError);
          setNotification({ message: "Failed to sync journal to cloud. ⚠️", type: 'info' });
        } else {
          if (insertedEntry?.id) {
            setJournalEntries(prev => prev.map(entry => entry.id === newEntry.id ? { ...entry, id: insertedEntry.id } : entry));
          }
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
      try { await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', user.id); }
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

    const cleanPatois = patois.trim();
    const cleanEnglish = english.trim();
    const validationError = validateWisdomText('Patois wisdom', cleanPatois) || validateWisdomText('English translation', cleanEnglish);
    if (validationError) {
      setNotification({ message: validationError, type: 'info' });
      return;
    }

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

    const { data, error } = await WisdomService.createUserWisdom(user.id, cleanPatois, cleanEnglish);
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

  const handleRefreshApp = async () => {
    setManualRefreshMessage("Syncing latest wisdom...");
    setLoadingProgress(35);
    setView('splash');

    try {
      if (user && !user.isGuest) {
        setLoadingProgress(65);
        await syncUserContent(user.id);

        if (supabase) {
          const unreadCount = await AlertsService.getUnreadCount(user.id);
          setUnreadAlertsCount(unreadCount);
        }
      }

      setLoadingProgress(100);
      setNotification({ message: 'Wisdom synced.', type: 'info' });
    } catch (error) {
      console.error('Refresh failed:', error);
      setNotification({ message: 'Sync could not finish. Try again soon.', type: 'info' });
    } finally {
      setManualRefreshMessage(null);
      setView('main');
    }
  };

  const handleBotNavigate = (type: string, value: string) => {
    if (type === 'tab') {
      setActiveTab(value as Tab);
      setActiveCategory(null);
      setView('main');
      setShowSettings(false);
      setShowAI(false);
      setPublicProfileId(null);
    } else if (type === 'setting') {
      if (value === 'settings') handleOpenSettings();
      if (value === 'website') window.open('https://www.likklewisdom.com/', '_blank');
      if (value === 'mdt_website') window.open('https://maxdeftech.wixsite.com/mdt-ja', '_blank');
      if (value === 'ai') handleOpenAI();
      if (value === 'alerts') handleOpenAlerts();
    } else if (type === 'external' && value) {
      window.open(value, '_blank');
    }
  };

  const renderContent = () => {
    if (view === 'privacy') return <LegalView type="privacy" onClose={() => setView('main')} />;
    if (view === 'terms') return <LegalView type="terms" onClose={() => setView('main')} />;
    if (view === 'jamaicanHistory') return <JamaicanHistoryView onClose={() => setView('main')} />;
    if (activeCategory) return <CategoryResultsView categoryId={activeCategory} onClose={() => setActiveCategory(null)} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} onFavorite={handleToggleFavorite} />;

    if (!user) {
      if (view === 'onboarding') return <Onboarding onFinish={() => setView('auth')} />;
      return <Auth onAuthComplete={(u) => { setUser(u); setView('main'); if (!u.isGuest) void syncUserContent(u.id).catch(error => console.error('Auth completion sync failed:', error)); }} />;
    }

    switch (activeTab) {
      case 'home': return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenAlerts={handleOpenAlerts} alertsCount={unreadAlertsCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} quotes={quotes} bibleAffirmations={bibleAffirmations} />;
      case 'discover': return <Discover searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategoryClick={handleOpenCategory} onOpenJamaicanHistory={() => setView('jamaicanHistory')} isOnline={isOnline} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} userWisdoms={userWisdoms} />;
      case 'bible': return <BibleView user={user} onBookmark={handleBookmarkBibleVerse} isOnline={isOnline} />;
      case 'book': return <LikkleBook entries={journalEntries} onAdd={handleAddJournalEntry} onDelete={handleDeleteJournalEntry} searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case 'travel': return <TravelView user={user} onBack={() => { setActiveTab('home'); setActiveCategory(null); }} onGuestRestricted={() => setShowAuthGate(true)} />;
      case 'me': return <Profile user={user} entries={journalEntries} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} bookmarkedVerses={bookmarkedVerses} userWisdoms={userWisdoms} onOpenSettings={handleOpenSettings} onStatClick={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onUpdateUser={handleUpdateUser} onRemoveBookmark={handleRemoveBookmark} onAddWisdom={handleAddWisdom} onDeleteWisdom={handleDeleteWisdom} onRefresh={handleRefreshApp} initialTab={profileInitialTab} startAdding={profileStartAdding} />;
      default: return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenAlerts={handleOpenAlerts} alertsCount={unreadAlertsCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} quotes={quotes} bibleAffirmations={bibleAffirmations} />;
    }
  };

  // Swipe navigation
  const TAB_ORDER: Tab[] = ['home', 'discover', 'bible', 'book', 'travel', 'me'];
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const touchStartedInHorizontalScroller = React.useRef(false);

  const didTouchStartInHorizontalScroller = (target: EventTarget | null) => {
    let element = target instanceof HTMLElement ? target : null;

    while (element && element !== mainScrollRef.current) {
      const style = window.getComputedStyle(element);
      const canScrollHorizontally =
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        element.scrollWidth > element.clientWidth;

      if (canScrollHorizontally) return true;
      element = element.parentElement;
    }

    return false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartedInHorizontalScroller.current = didTouchStartInHorizontalScroller(e.target);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Ignore swipes when overlays are open
    if (showSettings || showAI || publicProfileId || activeCategory || view === 'jamaicanHistory') return;
    if (view !== 'main') return;
    if (touchStartedInHorizontalScroller.current) return;

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

  // Pull-to-refresh: user must pull down this far (px) before release triggers refresh
  const PULL_REFRESH_THRESHOLD = 140;
  const PULL_MAX_DISTANCE = 220;

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
    if (dy > 0 && dy < PULL_MAX_DISTANCE) {
      setPullDistance(dy);
      setIsPulling(true);
    }
  };

  const handlePullEnd = async () => {
    if (pullDistance > PULL_REFRESH_THRESHOLD) {
      // Trigger refresh
      await handleRefreshApp();
    }
    setIsPulling(false);
    setPullDistance(0);
    pullStartY.current = 0;
  };

  if (view === 'splash') return <SplashScreen progress={loadingProgress} message={manualRefreshMessage || undefined} />;

  const containerClass = 'relative flex flex-col h-screen w-full overflow-hidden bg-white dark:bg-background-dark transition-colors duration-300';

  return (
    <div className={containerClass}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="fixed inset-0 jamaica-gradient opacity-60 pointer-events-none z-0" aria-hidden="true"></div>

      {!isOnline && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-notification animate-fade-in pointer-events-none" role="status" aria-live="polite" aria-label="You are offline. Stashed wisdom is active.">
          <div className="glass px-6 py-2 rounded-full border-red-500/20 bg-background-dark/80 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5">
            <span className="material-symbols-outlined text-red-500 text-sm animate-pulse" aria-hidden="true">wifi_off</span>
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
        id="main-content"
        ref={mainScrollRef}
        className={`flex-1 relative z-10 overflow-y-auto no-scrollbar scroll-smooth pt-safe transition-[padding] duration-300 ${user && view !== 'auth' ? (isNavCollapsed ? 'lg:pl-24' : 'lg:pl-72') : ''}`}
        role="main"
        aria-label="Main content"
        tabIndex={-1}
        onTouchStart={(e) => { handleTouchStart(e); handlePullStart(e); }}
        onTouchMove={handlePullMove}
        onTouchEnd={(e) => { handleTouchEnd(e); handlePullEnd(); }}
      >
        {/* Pull-to-refresh indicator */}
        {isPulling && (
          <div
            className="absolute top-0 left-0 right-0 flex justify-center items-center z-50 transition-all duration-200"
            style={{ height: `${pullDistance}px` }}
            role="status"
            aria-live="polite"
            aria-label={pullDistance > PULL_REFRESH_THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
          >
            <div className={`flex flex-col items-center gap-1 transition-opacity ${pullDistance > PULL_REFRESH_THRESHOLD ? 'opacity-100' : 'opacity-40'}`}>
              <span className={`material-symbols-outlined text-primary text-2xl ${pullDistance > PULL_REFRESH_THRESHOLD ? 'animate-spin' : ''}`} aria-hidden="true">
                refresh
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">
                {pullDistance > PULL_REFRESH_THRESHOLD ? 'Release to refresh' : 'Pull down'}
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
          onOpenAppGuide={() => {
            setShowSettings(false);
            setShowAppGuide(true);
          }}
        />
      )}
      {showAppGuide && user && (
        <AppGuideView
          onClose={() => {
            setShowAppGuide(false);
            setShowSettings(true);
          }}
          onOpenPrivacy={() => {
            setShowAppGuide(false);
            setView('privacy');
          }}
          onOpenTerms={() => {
            setShowAppGuide(false);
            setView('terms');
          }}
        />
      )}
      {showAI && user && (
        <AIWisdom
          user={user}
          isOnline={isOnline}
          onClose={() => setShowAI(false)}
          onGuestRestricted={() => {
            setShowAI(false);
            setShowAuthGate(true);
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
      {showWelcomeModal && user && !user.isGuest && (
        <WelcomeModal
          onClose={handleCloseWelcome}
          onOpenPrivacy={() => { handleCloseWelcome(); setShowSettings(false); setView('privacy'); }}
          onOpenTerms={() => { handleCloseWelcome(); setShowSettings(false); setView('terms'); }}
          onOpenSettings={() => { handleCloseWelcome(); setShowSettings(true); }}
        />
      )}
      {user && view !== 'auth' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); setProfileInitialTab('cabinet'); setProfileStartAdding(false); }}
          isCollapsed={isNavCollapsed}
          onToggleCollapsed={() => setIsNavCollapsed(prev => !prev)}
          onOpenSettings={handleOpenSettings}
          onSignOut={handleSignOut}
        />
      )}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
};

export default App;
