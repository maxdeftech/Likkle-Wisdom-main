
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Tab, Quote, JournalEntry, User, BibleAffirmation, IconicQuote } from './types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, ICONIC_QUOTES, CATEGORIES } from './constants';
import { supabase } from './services/supabase';
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

const App: React.FC = () => {
  const [view, setView] = useState<View>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showPinGate, setShowPinGate] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

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

  const dailyWisdom = useMemo(() => {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackQuote = quotes[0] || INITIAL_QUOTES[0];
    const fallbackVerse = bibleAffirmations[0] || BIBLE_AFFIRMATIONS[0];
    return {
      quote: quotes.length > 0 ? quotes[seed % quotes.length] : fallbackQuote,
      wisdom: quotes.length > 0 ? quotes[(seed + 7) % quotes.length] : fallbackQuote,
      verse: bibleAffirmations.length > 0 ? bibleAffirmations[seed % bibleAffirmations.length] : fallbackVerse
    };
  }, [quotes, bibleAffirmations]);

  const syncUserContent = useCallback(async (userId: string) => {
    if (!supabase || userId === 'guest' || !navigator.onLine) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profile) {
        setUser(prev => ({
          id: userId,
          username: profile.username || prev?.username || 'Seeker',
          avatarUrl: profile.avatar_url || prev?.avatarUrl || undefined,
          isPremium: !!profile.is_premium,
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
      }

      const { data: entries } = await supabase.from('journal_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
      if (entries) setJournalEntries(entries);
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
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
          isPremium: false
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
          is_premium: data.isPremium !== undefined ? data.isPremium : user.isPremium
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
      try { await supabase.from('journal_entries').insert({ user_id: user.id, title, text, mood, date: newEntry.date, timestamp: newEntry.timestamp }); }
      catch (e) { console.error("Journal error:", e); }
    }
    setNotification('Journal saved! ✍️');
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
      setShowAI(true);
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
      case 'home': return <Home user={user} isOnline={isOnline} dailyItems={dailyWisdom} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={setActiveCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} />;
      case 'discover': return <Discover searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategoryClick={setActiveCategory} isOnline={isOnline} />;
      case 'bible': return <BibleView user={user} onBookmark={handleBookmarkBibleVerse} onUpgrade={() => setShowPinGate(true)} isOnline={isOnline} />;
      case 'book': return <LikkleBook entries={journalEntries} onAdd={handleAddJournalEntry} onDelete={handleDeleteJournalEntry} searchQuery={searchQuery} onSearchChange={setSearchQuery} />;
      case 'me': return <Profile user={user} entries={journalEntries} quotes={quotes} iconic={iconicQuotes} bible={bibleAffirmations} bookmarkedVerses={bookmarkedVerses} onOpenSettings={() => setShowSettings(true)} onStatClick={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onUpdateUser={handleUpdateUser} onRemoveBookmark={handleRemoveBookmark} />;
      default: return <Home user={user} isOnline={isOnline} dailyItems={dailyWisdom} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} onCategoryClick={setActiveCategory} onFavorite={handleToggleFavorite} onOpenAI={handleOpenAI} />;
    }
  };

  if (view === 'splash') return <SplashScreen progress={loadingProgress} />;

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
      <main className="flex-1 relative z-10 overflow-y-auto no-scrollbar scroll-smooth">{renderContent()}</main>

      {showAuthGate && (
        <GuestAuthModal onClose={() => setShowAuthGate(false)} onSignUp={() => { setShowAuthGate(false); setView('auth'); }} />
      )}

      {showPinGate && (
        <PinEntryModal onClose={() => setShowPinGate(false)} onVerify={() => { setShowPinGate(false); setShowPremium(true); }} />
      )}
      {showSettings && user && (
        <Settings user={user} isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} onClose={() => setShowSettings(false)} onUpgrade={() => setShowPinGate(true)} onSignOut={handleSignOut} onUpdateUser={handleUpdateUser} onOpenPrivacy={() => { setShowSettings(false); setView('privacy'); }} onOpenTerms={() => { setShowSettings(false); setView('terms'); }} />
      )}
      {showAI && user && (
        <AIWisdom user={user} isOnline={isOnline} onClose={() => setShowAI(false)} onUpgrade={() => { setShowAI(false); setShowPinGate(true); }} onGuestRestricted={() => { setShowAI(false); setShowAuthGate(true); }} />
      )}
      {showPremium && (
        <PremiumUpgrade onClose={() => setShowPremium(false)} onPurchaseSuccess={() => { handleUpdateUser({ isPremium: true }); setShowPremium(false); }} />
      )}
      {view === 'main' && <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setActiveCategory(null); }} />}
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

const PinEntryModal: React.FC<{ onClose: () => void; onVerify: () => void }> = ({ onClose, onVerify }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1022') onVerify();
    else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 500);
    }
  };
  return (
    <div className="fixed inset-0 z-modal bg-background-dark/95 flex flex-col items-center justify-center p-8 backdrop-blur-xl animate-fade-in">
      <div className={`glass p-10 rounded-[3rem] w-full max-w-[320px] text-center border-white/5 shadow-2xl transition-all ${error ? 'border-red-500 bg-red-500/10 scale-95' : 'border-primary/20'}`}>
        <span className="material-symbols-outlined text-primary text-5xl mb-6">lock_open</span>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Secret Gate</h2>
        <p className="text-white/40 text-[10px] font-bold mb-8 uppercase tracking-widest leading-relaxed">Enter di secret pin fi access di donation feature.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="password" maxLength={4} placeholder="••••" autoFocus className="w-full h-20 bg-white/5 border border-white/10 rounded-2xl text-center text-4xl font-black text-primary focus:ring-0 focus:border-primary transition-all tracking-[0.5em]" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="glass py-4 rounded-xl font-black text-[10px] uppercase text-white/30">Cancel</button>
            <button type="submit" className="bg-primary py-4 rounded-xl font-black text-[10px] uppercase text-background-dark shadow-xl">Confirm</button>
          </div>
        </form>
        {error && <p className="text-red-500 text-[10px] font-black uppercase mt-4 animate-bounce">PIN incorrect!</p>}
      </div>
    </div>
  );
};

export default App;
