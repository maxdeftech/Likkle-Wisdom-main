
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Tab, Quote, JournalEntry, User, BibleAffirmation, IconicQuote } from './types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, ICONIC_QUOTES, CATEGORIES } from './constants';
import { supabase } from './services/supabase';
import { initializePurchases } from './services/revenueCat';
import { EncryptionService } from './services/encryption';
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

type NavigationSnapshot = {
  view: View;
  activeTab: Tab;
  showSettings: boolean;
  showAI: boolean;
  showPremium: boolean;
  showAuthGate: boolean;
  activeCategory: string | null;
  showMessages: boolean;
  showMessagesInSearchMode: boolean;
  showFriendRequests: boolean;
  publicProfileId: string | null;
};

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

  const [navHistory, setNavHistory] = useState<NavigationSnapshot[]>([]);

  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [iconicQuotes, setIconicQuotes] = useState<IconicQuote[]>(ICONIC_QUOTES);
  const [bibleAffirmations, setBibleAffirmations] = useState<BibleAffirmation[]>(BIBLE_AFFIRMATIONS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<any[]>([]);

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
      }

      const { data: entries } = await supabase.from('journal_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
      if (entries) {
        const decryptedEntries = await Promise.all(entries.map(async (e: any) => ({
          ...e,
          title: await EncryptionService.decrypt(e.title, userId),
          text: await EncryptionService.decrypt(e.text, userId)
        })));
        setJournalEntries(decryptedEntries);
      }
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
        if (error.message && (error.message.includes("refresh_token_not_found") || error.message.includes("json_token"))) {
          supabase?.auth.signOut();
          setUser(null);
          setView('auth');
        }
      } else if (session) {
        syncUserContent(session.user.id);
        if (view === 'splash' || view === 'auth') setView('main');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          username: session.user.user_metadata?.username || 'Seeker',
          isGuest: false,
          isPremium: true // Auto-grant premium
        });
        syncUserContent(session.user.id);
        if (view === 'auth' || view === 'splash') setView('main');
      } else {
        setUser(prev => {
          if (prev?.isGuest) return prev;
          if (view === 'main') setView('auth');
          return null;
        });
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

  const pushHistory = useCallback(() => {
    setNavHistory(prev => [
      ...prev,
      {
        view,
        activeTab,
        showSettings,
        showAI,
        showPremium,
        showAuthGate,
        activeCategory,
        showMessages,
        showMessagesInSearchMode,
        showFriendRequests,
        publicProfileId
      }
    ]);
  }, [
    view,
    activeTab,
    showSettings,
    showAI,
    showPremium,
    showAuthGate,
    activeCategory,
    showMessages,
    showMessagesInSearchMode,
    showFriendRequests,
    publicProfileId
  ]);

  const handleBack = useCallback(() => {
    setNavHistory(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;

      setView(last.view);
      setActiveTab(last.activeTab);
      setShowSettings(last.showSettings);
      setShowAI(last.showAI);
      setShowPremium(last.showPremium);
      setShowAuthGate(last.showAuthGate);
      setActiveCategory(last.activeCategory);
      setShowMessages(last.showMessages);
      setShowMessagesInSearchMode(last.showMessagesInSearchMode);
      setShowFriendRequests(last.showFriendRequests);
      setPublicProfileId(last.publicProfileId);

      return next;
    });
  }, []);

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
        if (newState) await supabase.from('bookmarks').insert({ user_id: user.id, item_id: id, item_type: type });
        else await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('item_id', id);
      } catch (e) { console.error("Bookmark error:", e); }
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

  const handleOpenAI = () => {
    if (user?.isGuest) {
      setShowAuthGate(true);
    } else {
      pushHistory();
      setShowAI(true);
    }
  };

  const handleOpenSettings = () => {
    pushHistory();
    setShowSettings(true);
  };

  const handleOpenPremium = () => {
    pushHistory();
    setShowPremium(true);
  };

  const handleOpenMessages = (searchMode: boolean = false) => {
    pushHistory();
    setShowMessages(true);
    setShowMessagesInSearchMode(searchMode);
  };

  const handleOpenFriendRequests = () => {
    pushHistory();
    setShowFriendRequests(true);
  };

  const handleOpenPublicProfile = (id: string) => {
    pushHistory();
    setPublicProfileId(id);
  };

  const handleOpenCategory = (categoryId: string) => {
    pushHistory();
    setActiveCategory(categoryId);
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
    if (view === 'privacy') return <LegalView type="privacy" onClose={handleBack} />;
    if (view === 'terms') return <LegalView type="terms" onClose={handleBack} />;
    if (activeCategory) return <CategoryResultsView categoryId={activeCategory} onClose={handleBack} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} onFavorite={handleToggleFavorite} />;

    if (!user) {
      if (view === 'onboarding') return <Onboarding onFinish={() => setView('auth')} />;
      return <Auth onAuthComplete={(u) => { setUser(u); setView('main'); if (!u.isGuest) syncUserContent(u.id); }} />;
    }

    switch (activeTab) {
      case 'home': return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenMessages={handleOpenMessages} unreadCount={unreadMessageCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} />;
      case 'discover': return <Discover searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategoryClick={handleOpenCategory} isOnline={isOnline} />;
      case 'bible': return <BibleView user={user} onBookmark={handleBookmarkBibleVerse} onUpgrade={handleOpenPremium} isOnline={isOnline} />;
      case 'book': return <LikkleBook entries={journalEntries} onAdd={handleAddJournalEntry} onDelete={handleDeleteJournalEntry} searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case 'me': return <Profile user={user} entries={journalEntries} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} bookmarkedVerses={bookmarkedVerses} onOpenSettings={handleOpenSettings} onStatClick={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onUpdateUser={handleUpdateUser} onRemoveBookmark={handleRemoveBookmark} onOpenFriendRequests={handleOpenFriendRequests} onFindFriends={() => handleOpenMessages(true)} requestCount={pendingRequestCount} onRefresh={handleRefreshApp} />;
      default: return <Home user={user} isOnline={isOnline} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={handleOpenCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} onOpenMessages={handleOpenMessages} unreadCount={unreadMessageCount} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} />;
    }
  };

  if (view === 'splash') return <SplashScreen progress={loadingProgress} message={manualRefreshMessage || undefined} />;

  return (
    <div className="relative flex flex-col h-screen w-full max-w-2xl mx-auto overflow-hidden bg-white dark:bg-background-dark shadow-2xl transition-colors duration-300">
      <div className="fixed inset-0 jamaica-gradient opacity-60 pointer-events-none z-0"></div>

      {navHistory.length > 0 && (
        <button
          onClick={handleBack}
          className="fixed top-5 left-5 z-overlay size-11 rounded-full glass flex items-center justify-center text-primary shadow-lg active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}

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
      <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar scroll-smooth">{renderContent()}</main>

      {showAuthGate && (
        <GuestAuthModal onClose={() => setShowAuthGate(false)} onSignUp={() => { setShowAuthGate(false); setView('auth'); }} />
      )}

      {showSettings && user && (
        <Settings
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onClose={handleBack}
          onUpgrade={handleOpenPremium}
          onSignOut={handleSignOut}
          onUpdateUser={handleUpdateUser}
          onOpenPrivacy={() => {
            pushHistory();
            setShowSettings(false);
            setView('privacy');
          }}
          onOpenTerms={() => {
            pushHistory();
            setShowSettings(false);
            setView('terms');
          }}
        />
      )}
      {showAI && user && (
        <AIWisdom
          user={user}
          isOnline={isOnline}
          onClose={handleBack}
          onUpgrade={handleOpenPremium}
          onGuestRestricted={() => {
            setShowAI(false);
            setShowAuthGate(true);
          }}
        />
      )}
      {showPremium && (
        <PremiumUpgrade
          onClose={handleBack}
          onPurchaseSuccess={() => {
            handleBack();
            setNotification("Thanks fi di support!");
          }}
        />
      )}
      {showMessages && user && (
        <Messages currentUser={user} onClose={handleBack} onOpenProfile={handleOpenPublicProfile} initialSearch={showMessagesInSearchMode} />
      )}
      {publicProfileId && user && (
        <Profile
          user={user}
          entries={journalEntries}
          quotes={quotes}
          iconic={iconicQuotes}
          bible={bibleAffirmations}
          bookmarkedVerses={bookmarkedVerses}
          viewingUserId={publicProfileId}
          onClose={handleBack}
          onOpenSettings={() => { }}
          onStatClick={() => { }}
          onUpdateUser={() => { }}
          onRemoveBookmark={() => { }}
          onOpenFriendRequests={() => { }}
        />
      )}

      {user && (
        <NavigationChatbot onNavigate={handleBotNavigate} />
      )}
      {showFriendRequests && user && (
        <FriendRequestList userId={user.id} onClose={() => setShowFriendRequests(false)} onRequestsChanged={() => { /* maybe refresh profile badge */ }} />
      )}
      {view === 'main' && <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} />}
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
