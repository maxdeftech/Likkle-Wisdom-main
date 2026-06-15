
import React, { useState, useEffect, useCallback } from 'react';
import { Quote, User, Tab, BibleAffirmation } from '../types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, CATEGORIES } from '../constants';
import { useTTS } from '../hooks/useTTS';
import OnlineCount from '../components/OnlineCount';

interface HomeProps {
  user: User;
  isOnline: boolean;
  onFavorite: (id: string, type: 'quote' | 'iconic' | 'bible') => void;
  onOpenAI: () => void;
  onTabChange: (tab: Tab) => void;
  onCategoryClick: (id: string) => void;
  onOpenAlerts?: () => void;
  alertsCount?: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  quotes: Quote[];
  bibleAffirmations: BibleAffirmation[];
}

const Home: React.FC<HomeProps> = ({ user, isOnline, onFavorite, onOpenAI, onTabChange, onCategoryClick, onOpenAlerts, alertsCount = 0, isDarkMode, onToggleTheme, quotes, bibleAffirmations }) => {
  const [activeDaily, setActiveDaily] = useState<'quote' | 'wisdom' | 'verse'>('quote');
  const [reveal, setReveal] = useState(false);
  const [localDaily, setLocalDaily] = useState<{ quote: Quote | null; wisdom: Quote | null; verse: BibleAffirmation | null }>({
    quote: null, wisdom: null, verse: null
  });
  const { speak, stop, isSpeaking } = useTTS();

  // Load from constants to select random items
  const loadRandomQuote = useCallback((): Quote => {
    const idx = Math.floor(Math.random() * INITIAL_QUOTES.length);
    return INITIAL_QUOTES[idx];
  }, []);

  const loadRandomVerse = useCallback((): BibleAffirmation => {
    const idx = Math.floor(Math.random() * BIBLE_AFFIRMATIONS.length);
    return BIBLE_AFFIRMATIONS[idx];
  }, []);

  useEffect(() => {
    const lastUpdate = localStorage.getItem('likkle_last_daily_update');
    const storedDaily = localStorage.getItem('likkle_daily_items');
    const now = Date.now();

    if (lastUpdate && storedDaily && (now - parseInt(lastUpdate)) < 86400000) {
      try {
        setLocalDaily(JSON.parse(storedDaily));
      } catch {
        refreshAllContent();
      }
    } else {
      refreshAllContent();
    }
  }, []);

  const refreshAllContent = () => {
    const q = loadRandomQuote();
    let w = loadRandomQuote();
    // Ensure wisdom is different from quote
    let attempts = 0;
    while (w.id === q.id && attempts < 10) { w = loadRandomQuote(); attempts++; }
    const newDaily = { quote: q, wisdom: w, verse: loadRandomVerse() };
    setLocalDaily(newDaily);
    localStorage.setItem('likkle_daily_items', JSON.stringify(newDaily));
    localStorage.setItem('likkle_last_daily_update', Date.now().toString());
  };

  const refreshSingle = (type: 'quote' | 'wisdom' | 'verse') => {
    setLocalDaily(prev => {
      let newItem: any;
      if (type === 'verse') {
        newItem = loadRandomVerse();
      } else {
        // Pick a quote different from the other tab
        const otherId = type === 'quote' ? prev.wisdom?.id : prev.quote?.id;
        newItem = loadRandomQuote();
        let attempts = 0;
        while (newItem.id === otherId && attempts < 10) { newItem = loadRandomQuote(); attempts++; }
      }
      const updated = { ...prev, [type]: newItem };
      localStorage.setItem('likkle_daily_items', JSON.stringify(updated));
      return updated;
    });
  };

  const firstName = user?.username?.split(' ')[0] || 'Seeker';
  const currentItem = activeDaily === 'quote' ? localDaily.quote : activeDaily === 'wisdom' ? localDaily.wisdom : localDaily.verse;
  const quickAccessItems: Array<{ id: Tab; label: string; description: string; icon: string }> = [
    { id: 'home', label: 'Home', description: 'Daily', icon: 'home' },
    { id: 'discover', label: 'Discover', description: 'Search', icon: 'explore' },
    { id: 'guide', label: 'Likkle Guide', description: 'AI chat', icon: 'smart_toy' },
    { id: 'bible', label: 'Bible', description: 'Read', icon: 'auto_stories' },
    { id: 'book', label: 'Journal', description: 'Notes', icon: 'edit_note' },
    { id: 'travel', label: 'Travel', description: 'Jamaica', icon: 'flight' },
    { id: 'me', label: 'Profile', description: 'Cabinet', icon: 'person' },
  ];

  // Reset reveal whenever the displayed item actually changes
  const currentItemId = currentItem?.id;
  useEffect(() => { setReveal(false); }, [currentItemId]);

  const isVerse = (item: any): item is BibleAffirmation => item && 'kjv' in item;
  const isQuote = (item: any): item is Quote => item && 'english' in item;

  // Derive favorite status from the live state passed from App
  const isItemFavored = (item: any) => {
    if (!item) return false;
    if (isVerse(item)) {
      return bibleAffirmations.find(b => b.id === item.id)?.isFavorite || false;
    }
    return quotes.find(q => q.id === item.id)?.isFavorite || false;
  };

  if (!currentItem) return (
    <div className="flex items-center justify-center h-full opacity-20">
      <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-10 pb-24 animate-fade-in" role="region" aria-label="Home">
      <header className="flex flex-col gap-6 mb-7 pt-4 sm:gap-8 sm:mb-8 sm:pt-6" role="banner">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Profile & Theme Cluster */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => onTabChange('me')}
              aria-label="View your profile"
              className="size-14 sm:size-20 rounded-[1.45rem] sm:rounded-[2rem] border-4 border-primary/20 overflow-hidden active:scale-90 transition-transform shadow-2xl bg-background-dark rotate-3 hover:rotate-0 transition-all duration-500"
            >
              <img
                className="w-full h-full object-cover"
                src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/200`}
                alt="Your profile photo"
              />
            </button>
            <button
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`h-6 w-11 rounded-full relative transition-all duration-300 flex items-center px-1 shadow-inner ${isDarkMode ? 'bg-primary/40' : 'bg-slate-200'}`}
            >
              <div className={`size-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-[10px] text-slate-900 font-black" aria-hidden="true">
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-sm font-black uppercase tracking-widest opacity-40 text-slate-900 dark:text-white/40">Wha Gwan,</span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-[300px]">
              {firstName}
            </h1>
            <OnlineCount userId={user.id} />
          </div>

          {/* Header Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => onTabChange('discover')} aria-label="Explore categories and search wisdom" className="size-10 rounded-xl flex items-center justify-center text-slate-900/65 dark:text-white/65 active:scale-90 transition-colors hover:text-primary">
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">explore</span>
              </button>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-900/40 dark:text-white/40" aria-hidden="true">Explore</span>
            </div>
            {onOpenAlerts && (
              <div className="flex flex-col items-center gap-1">
                <button onClick={onOpenAlerts} aria-label={alertsCount > 0 ? `Alerts, ${alertsCount} unread` : 'View alerts'} className="size-10 rounded-xl flex items-center justify-center text-slate-900/65 dark:text-white/65 active:scale-90 transition-colors hover:text-primary relative">
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">notifications</span>
                  {alertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-jamaican-gold rounded-full flex items-center justify-center text-[9px] font-black text-background-dark border-2 border-white dark:border-background-dark animate-pop" aria-hidden="true">
                      {alertsCount > 9 ? '9+' : alertsCount}
                    </span>
                  )}
                </button>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-900/40 dark:text-white/40" aria-hidden="true">Alerts</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="mb-10" aria-label="Daily wisdom">
        <div className="flex justify-center gap-3 mb-4 pb-1" role="tablist" aria-label="Choose daily content type">
          {[
            { id: 'quote', label: 'Quote', icon: 'wb_sunny' },
            { id: 'wisdom', label: 'Wisdom', icon: 'auto_stories' },
            { id: 'verse', label: 'Verse', icon: 'menu_book' }
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeDaily === tab.id}
              aria-controls="daily-content-panel"
              id={`daily-tab-${tab.id}`}
              onClick={() => { setActiveDaily(tab.id as any); setReveal(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all ${activeDaily === tab.id ? 'bg-primary text-background-dark shadow-lg scale-105' : 'glass text-slate-900/40 dark:text-white/40'}`}
            >
              <span className="material-symbols-outlined text-sm sm:text-base" aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div id="daily-content-panel" role="tabpanel" aria-labelledby={`daily-tab-${activeDaily}`} className="glass rounded-[1.75rem] sm:rounded-[3rem] p-5 sm:p-12 flex flex-col items-center text-center gap-5 sm:gap-6 shadow-2xl relative overflow-hidden border-white/5 bg-gradient-to-br from-primary/5 to-transparent min-h-[390px] sm:min-h-[50vh] justify-center">
          <div className="absolute top-0 right-0 p-5 sm:p-8 opacity-5" aria-hidden="true">
            <span className="material-symbols-outlined text-[96px] sm:text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {activeDaily === 'quote' ? 'wb_sunny' : activeDaily === 'wisdom' ? 'auto_stories' : 'menu_book'}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); refreshSingle(activeDaily); setReveal(false); }}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-xl text-slate-900/45 transition-all active:scale-95 hover:text-primary dark:text-white/45"
            aria-label="Refresh this card with new content"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">refresh</span>
          </button>

          <span className="material-symbols-outlined text-primary text-4xl sm:text-7xl opacity-40" aria-hidden="true">
            format_quote
          </span>

          <div className="space-y-4 max-w-lg">
            <h2 className="text-2xl sm:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white px-2">
              "{currentItem?.patois}"
            </h2>
            {activeDaily === 'verse' && isVerse(currentItem) && (
              <div className="space-y-1">
                <p className="text-primary text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em]">
                  {currentItem.reference}
                </p>
                <p className="text-slate-900/40 dark:text-white/40 text-[9px] font-bold italic">
                  "{currentItem.kjv}"
                </p>
              </div>
            )}
          </div>

          <div className="w-full max-w-md space-y-4 mt-4 sm:mt-8">
            {!reveal ? (
              <button
                onClick={() => setReveal(true)}
                className="w-full bg-primary text-background-dark font-black py-5 sm:py-7 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs sm:text-sm"
                aria-label="Reveal meaning or translation"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl" aria-hidden="true">translate</span>
                <span>Reveal Meaning</span>
              </button>
            ) : (
              <div className="space-y-6 animate-fade-in w-full">
                <div className="glass border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
                  <p className="text-slate-900/70 dark:text-white/70 italic text-lg sm:text-2xl leading-snug">
                    "{isVerse(currentItem) ? currentItem.kjv : (isQuote(currentItem) ? currentItem.english : '')}"
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (isSpeaking) stop();
                      else {
                        const textToSpeak = isVerse(currentItem)
                          ? `${currentItem.patois}. ${currentItem.kjv}`
                          : (isQuote(currentItem) ? (currentItem as Quote).english : '');
                        speak(textToSpeak);
                      }
                    }}
                    aria-label={isSpeaking ? 'Stop listening' : 'Listen to this content'}
                    className={`flex-1 glass py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-colors ${isSpeaking ? 'text-primary' : 'text-slate-900 dark:text-white'}`}
                  >
                    <span className={`material-symbols-outlined text-lg sm:text-2xl ${isSpeaking ? 'animate-pulse' : ''}`} aria-hidden="true">
                      {isSpeaking ? 'stop_circle' : 'volume_up'}
                    </span>
                    {isSpeaking ? 'Stop' : 'Listen'}
                  </button>
                  <button
                    onClick={() => onFavorite(currentItem.id, activeDaily === 'verse' ? 'bible' : 'quote')}
                    aria-label={isItemFavored(currentItem) ? 'Saved to cabinet' : 'Save to cabinet'}
                    className={`flex-1 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${isItemFavored(currentItem) ? 'bg-primary text-background-dark' : 'glass text-slate-900 dark:text-white'}`}
                  >
                    <span className={`material-symbols-outlined text-lg sm:text-2xl ${isItemFavored(currentItem) ? 'fill-1 animate-pop' : ''}`} aria-hidden="true">favorite</span>
                    {isItemFavored(currentItem) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        className={`glass rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden relative group mb-6 border-white/5 shadow-xl transition-all ${!isOnline ? 'grayscale-[0.5]' : ''}`}
        aria-label="Craft your own wisdom"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-jamaican-gold/10"></div>
        <div className="absolute -right-8 -top-12 text-primary/10" aria-hidden="true">
          <span className="material-symbols-outlined text-[9rem] sm:text-[12rem]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        {!isOnline && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-background-dark/50 backdrop-blur-[2px]">
            <span className="material-symbols-outlined text-3xl text-red-400 mb-2">signal_wifi_off</span>
            <p className="text-white font-black uppercase text-[10px] tracking-widest">Signal low fi brew magic</p>
            <p className="text-white/50 font-medium text-[8px] uppercase tracking-widest mt-1">Connect fi craft custom wisdom</p>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenAI}
          className="relative z-20 flex min-h-[132px] w-full items-center justify-between gap-4 p-5 text-left active:scale-[0.99] transition-transform sm:min-h-[160px] sm:p-7"
        >
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <p className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-1">
              AI Magic <span className="material-symbols-outlined text-[14px] sm:text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </p>
            <h3 className="text-[1.6rem] sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">Craft Yuh Own Wisdom</h3>
            <p className="max-w-[18rem] text-xs sm:text-sm font-bold leading-snug text-slate-900/45 dark:text-white/45">Generate a custom quote, prayer, or affirmation.</p>
          </div>
          <div className="size-11 sm:size-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-outlined text-xl sm:text-3xl" aria-hidden="true">verified</span>
          </div>
        </button>
      </section>

      <section className="mb-10 sm:mb-12" aria-label="Quick access">
        <h2 className="mb-4 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickAccessItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className="glass flex min-h-[92px] items-center gap-3 rounded-2xl p-3.5 text-left active:scale-95 transition-all border-white/5 sm:min-h-[104px] sm:p-4"
              aria-label={`Open ${item.label}`}
            >
              <span className="material-symbols-outlined flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[24px] sm:text-[26px] text-primary" aria-hidden="true">{item.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm sm:text-base font-black leading-tight text-slate-900 dark:text-white">{item.label}</span>
                <span className="mt-1 block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-slate-900/40 dark:text-white/40">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8" role="region" aria-label="Island Vibes categories">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Island Vibes</h2>
          <button onClick={() => onTabChange('discover')} className="text-sm sm:text-base font-semibold text-primary" aria-label="Go to Discover and explore all categories">Explore Categories</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.slice(0, 3).map(cat => (
            <button
              type="button"
              key={cat.id}
              onClick={() => { onTabChange('discover'); onCategoryClick(cat.id); }}
              className="glass p-6 sm:p-8 rounded-[2rem] flex items-center gap-4 group active:scale-95 transition-all border-white/5 cursor-pointer hover:border-primary/20 text-left w-full"
              aria-label={`Open ${cat.name}: ${cat.description}`}
            >
              <div className={`size-14 sm:size-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20`} aria-hidden="true">
                <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white">{cat.name}</span>
                <span className="text-[10px] text-slate-900/40 dark:text-white/40 uppercase tracking-widest font-bold">{cat.description}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
