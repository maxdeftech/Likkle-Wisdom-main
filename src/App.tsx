
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Tab, Quote, JournalEntry, User, BibleAffirmation, IconicQuote, UserWisdom } from './types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, ICONIC_QUOTES, CATEGORIES } from './constants';
import { supabase } from './services/supabase';
import { initializePurchases } from './services/revenueCat';
import { EncryptionService } from './services/encryption';
import { WisdomService } from './services/wisdomService';
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
import BottomNav from './components/BottomNav';
import CategoryResultsView from './views/CategoryResultsView';
import LegalView from './views/LegalView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Messages from './views/Messages';
import FriendRequestList from './components/FriendRequestList';
import NavigationChatbot from './components/NavigationChatbot';

const App: React.FC = () => {
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
  const [notification, setNotification] = useState<string | null>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [showMessagesInSearchMode, setShowMessagesInSearchMode] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);

  // Badge Counts
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const [showFriendsList, setShowFriendsList] = useState(false);

  const [profileInitialTab, setProfileInitialTab] = useState<'cabinet' | 'wisdoms'>('cabinet');
  const [profileStartAdding, setProfileStartAdding] = useState(false);

  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [iconicQuotes, setIconicQuotes] = useState<IconicQuote[]>(ICONIC_QUOTES);
  const [bibleAffirmations, setBibleAffirmations] = useState<BibleAffirmation[]>(BIBLE_AFFIRMATIONS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<any[]>([]);
  const [userWisdoms, setUserWisdoms] = useState<UserWisdom[]>([]);

  const syncUnreadCount = useCallback(() => {
    if (user && !user.isGuest && supabase) {
      import('./services/messaging').then(({ MessagingService }) => {
        MessagingService.getUnreadCount(user.id).then(setUnreadMessageCount);
      });
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNotification('Signal back! Syncing vibes...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNotification('Offline mode active. Keep growing.');
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
        setUser(prev => ({
          id: userId,
          username: profile.username || prev?.username || 'Seeker',
          avatarUrl: profile.avatar_url || prev?.avatarUrl || undefined,
          isPremium: profile.is_premium || prev?.isPremium || false,
          isPublic: profile.is_public !== undefined ? profile.is_public : true,
          isGuest: false
        }));
      }

      // Sync badge counts
      import('./services/messaging').then(({ MessagingService }) => {
        MessagingService.getUnreadCount(userId).then(setUnreadMessageCount);
      });
      import('./services/social').then(({ SocialService }) => {
        SocialService.getFriendRequests(userId).then(reqs => setPendingRequestCount(reqs.length));
      });

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

  // Real-time subscriptions for badges
  useEffect(() => {
    if (!user || user.isGuest || !supabase) return;

    let msgSub: any;
    let friendSub: any;

    import('./services/messaging').then(({ MessagingService }) => {
      msgSub = MessagingService.subscribeToMessages(user.id, () => {
        MessagingService.getUnreadCount(user.id).then(setUnreadMessageCount);
      });
    });

    import('./services/social').then(({ SocialService }) => {
      friendSub = SocialService.subscribeToFriendRequests(user.id, () => {
        SocialService.getFriendRequests(user.id).then(reqs => setPendingRequestCount(reqs.length));
      });
    });

    return () => {
      msgSub?.unsubscribe();
      friendSub?.unsubscribe();
    };
  }, [user]);

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
      } else if (view === 'main') {
        setView('auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Use functional update to avoid wiping extra user state (like avatarUrl)
        setUser(prev => ({
          ...(prev || {}),
          id: session.user.id,
          username: session.user.user_metadata?.username || prev?.username || 'Seeker',
          avatarUrl: session.user.user_metadata?.avatar_url || prev?.avatarUrl,
          isGuest: false,
          isPremium: true
        }));
        syncUserContent(session.user.id);
        if (view === 'auth' || view === 'splash') setView('main');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUserContent, view]);

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
        setNotification("Couldn't sync to cloud.");
      }
    }
    setNotification(newState ? 'Saved to cabinet! ✨' : 'Removed from cabinet.');
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
    setNotification(!exists ? 'Verse saved to cabinet! 📖' : 'Verse removed.');
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
          setNotification("Failed to sync journal to cloud. ⚠️");
        } else {
          setNotification('Journal saved! ✍️');
        }
      }
      catch (e) {
        console.error("Journal processing error:", e);
        setNotification("Error processing journal entry.");
      }
    } else {
      setNotification('Journal saved locally! 📝');
    }
  };

  const handleDeleteJournalEntry = async (id: string) => {
    setJournalEntries(prev => prev.filter(entry => entry.id !== id));
    if (user && !user.isGuest && supabase && navigator.onLine) {
      try { await supabase.from('journal_entries').delete().eq('timestamp', parseInt(id)); }
      catch (e) { console.error("Delete journal error:", e); }
    }
    setNotification('Entry removed! 🗑️');
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
    setNotification('Removed! 🗑️');
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setShowSettings(false);
    setView('auth');
  };

  const handleAddWisdom = async (patois: string, english: string) => {
    if (!user) return;
    const { data, error } = await WisdomService.createUserWisdom(user.id, patois, english);
    if (data) {
      setUserWisdoms(prev => [data, ...prev]);
      setNotification("Wisdom planted in yuh garden! 🌱");
    } else if (error) {
      setNotification(`Could not plant wisdom: ${error}`);
    }
  };

  const handleDeleteWisdom = async (id: string) => {
    const { error } = await WisdomService.deleteWisdom(id);
    if (!error) {
      setUserWisdoms(prev => prev.filter(w => w.id !== id));
      setNotification("Wisdom returned to di stars. ✨");
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

  const handleOpenMessages = (searchMode: boolean = false) => {
    setShowMessages(true);
    setShowMessagesInSearchMode(searchMode);
  };

  const handleOpenFriendRequests = () => {
    setShowFriendRequests(true);
  };

  const handleOpenPublicProfile = (id: string) => {
    setPublicProfileId(id);
  };

  const handleOpenCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleOpenFriendsList = () => {
    setShowFriendsList(true);
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
      // Reset other modals
      setShowSettings(false);
      setShowAI(false);
      setShowPremium(false);
      setShowMessages(false);
      setPublicProfileId(null);
    } else if (type === 'setting') {
      if (value === 'settings') handleOpenSettings();
      if (value === 'premium') handleOpenPremium();
      if (value === 'ai') handleOpenAI();
      if (value === 'messages') handleOpenMessages();
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
      case 'home': return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenMessages={handleOpenMessages} unreadCount={unreadMessageCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} quotes={quotes} bibleAffirmations={bibleAffirmations} />;
      case 'discover': return <Discover searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategoryClick={handleOpenCategory} isOnline={isOnline} />;
      case 'bible': return <BibleView user={user} onBookmark={handleBookmarkBibleVerse} onUpgrade={handleOpenPremium} isOnline={isOnline} />;
      case 'book': return <LikkleBook entries={journalEntries} onAdd={handleAddJournalEntry} onDelete={handleDeleteJournalEntry} searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case 'me': return <Profile user={user} entries={journalEntries} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} bookmarkedVerses={bookmarkedVerses} userWisdoms={userWisdoms} onOpenSettings={handleOpenSettings} onStatClick={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onUpdateUser={handleUpdateUser} onRemoveBookmark={handleRemoveBookmark} onOpenFriendRequests={handleOpenFriendRequests} onAddWisdom={handleAddWisdom} onDeleteWisdom={handleDeleteWisdom} onFindFriends={() => handleOpenMessages(true)} requestCount={pendingRequestCount} onRefresh={handleRefreshApp} initialTab={profileInitialTab} startAdding={profileStartAdding} />;
      default: return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenMessages={handleOpenMessages} unreadCount={unreadMessageCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} quotes={quotes} bibleAffirmations={bibleAffirmations} />;
    }
  };

  if (view === 'splash') return <SplashScreen progress={loadingProgress} message={manualRefreshMessage || undefined} />;

  return (
    <div className="relative flex flex-col h-screen w-full max-w-2xl mx-auto overflow-hidden bg-white dark:bg-background-dark shadow-2xl transition-colors duration-300">
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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-tooltip animate-fade-in pointer-events-none w-fit px-8">
          <div className="bg-jamaican-gold py-2.5 px-4 rounded-full flex items-center gap-2 shadow-2xl border border-black/10">
            <span className="material-symbols-outlined text-black font-black text-sm">notifications_active</span>
            <p className="text-black font-black text-[9px] uppercase tracking-wider whitespace-nowrap">{notification}</p>
          </div>
        </div>
      )}
      <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar scroll-smooth pt-safe">{renderContent()}</main>

      {showAuthGate && (
        <GuestAuthModal onClose={() => setShowAuthGate(false)} onSignUp={() => { setShowAuthGate(false); setView('auth'); }} />
      )}

      {showSettings && user && (
        <Settings
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onClose={() => setShowSettings(false)}
          onUpgrade={handleOpenPremium}
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
            setNotification("Thanks fi di support!");
          }}
        />
      )}
      {showMessages && user && (
        <Messages
          currentUser={user}
          onClose={() => { setShowMessages(false); setShowMessagesInSearchMode(false); }}
          onOpenProfile={handleOpenPublicProfile}
          initialSearch={showMessagesInSearchMode}
          onUnreadUpdate={syncUnreadCount}
        />
      )}
      {showFriendsList && user && (
        <FriendsListOverlay
          currentUser={user}
          onClose={() => setShowFriendsList(false)}
          onOpenChat={(friendUser) => {
            setShowFriendsList(false);
            setShowMessages(true);
            setShowMessagesInSearchMode(false);
          }}
          onOpenProfile={handleOpenPublicProfile}
        />
      )}
      {publicProfileId && user && (
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
          onOpenFriendRequests={() => { }}
          onAddWisdom={() => { }}
          onDeleteWisdom={() => { }}
        />
      )}

      {user && (
        <NavigationChatbot onNavigate={handleBotNavigate} />
      )}
      {showFriendRequests && user && (
        <FriendRequestList
          userId={user.id}
          onClose={() => setShowFriendRequests(false)}
          onRequestsChanged={() => { /* maybe refresh profile badge */ }}
          onOpenAddFriend={() => {
            setShowFriendRequests(false);
            handleOpenMessages(true);
          }}
        />
      )}
      {view === 'main' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); setProfileInitialTab('cabinet'); setProfileStartAdding(false); }}
          onOpenFriends={handleOpenFriendsList}
          onOpenWisdomCreator={handleGoToWisdomCreator}
          unreadMessageCount={unreadMessageCount}
          pendingRequestCount={pendingRequestCount}
        />
      )}
      <PWAInstallPrompt />
    </div>
  );
};

const FriendsListOverlay: React.FC<{
  currentUser: User;
  onClose: () => void;
  onOpenChat: (friend: User) => void;
  onOpenProfile: (userId: string) => void;
}> = ({ currentUser, onClose, onOpenChat, onOpenProfile }) => {
  const [friends, setFriends] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    import('./services/social').then(({ SocialService }) => {
      SocialService.getFriends(currentUser.id).then(f => {
        setFriends(f);
        setLoading(false);
      });
    });
  }, [currentUser.id]);

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`Remove ${friendName} from your friends?`)) return;
    const { SocialService } = await import('./services/social');
    const { error } = await SocialService.deleteFriendship(friendshipId);
    if (!error) {
      setFriends(prev => prev.filter(f => f.id !== friendshipId));
    } else {
      alert('Failed to remove friend.');
    }
  };

  return (
    <div className="fixed inset-0 z-modal bg-background-dark flex flex-col pt-safe animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">My Friends</h2>
        <button onClick={onClose} className="size-10 rounded-full glass flex items-center justify-center text-white/60 active:scale-95 transition-all">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="text-center text-white/30 text-xs uppercase mt-8 animate-pulse">Loading friends...</div>
        )}
        {!loading && friends.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-white/30 text-center">
            <span className="material-symbols-outlined text-4xl mb-2">group</span>
            <p className="text-xs font-bold uppercase tracking-wider">No friends yet</p>
          </div>
        )}
        {friends.map((f: any) => (
          <div key={f.id} className="glass p-4 rounded-2xl flex items-center gap-4 group">
            <div className="relative cursor-pointer" onClick={() => onOpenProfile(f.friendId)}>
              <div className="size-12 rounded-full bg-white/10 overflow-hidden">
                {f.friendAvatar ? (
                  <img src={f.friendAvatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                    {f.friendName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{f.friendName}</h3>
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
                Friends since {new Date(f.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenChat({ id: f.friendId, username: f.friendName, avatarUrl: f.friendAvatar, isGuest: false, isPremium: false })}
                className="size-9 rounded-full glass flex items-center justify-center text-primary active:scale-90 transition-transform"
                title="Message"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
              </button>
              <button
                onClick={() => handleRemoveFriend(f.id, f.friendName)}
                className="size-9 rounded-full glass flex items-center justify-center text-red-400/60 hover:text-red-400 active:scale-90 transition-all"
                title="Remove Friend"
              >
                <span className="material-symbols-outlined text-lg">person_remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>
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
