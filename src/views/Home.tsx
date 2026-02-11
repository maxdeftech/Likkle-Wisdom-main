
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote, User, Tab, BibleAffirmation } from '../types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, CATEGORIES } from '../constants';
import { useTTS } from '../hooks/useTTS';
import OnlineCount from '../components/OnlineCount';
import { presentPaywall } from '../services/revenueCat';
import { Capacitor } from '@capacitor/core';

const JAMAICA_IMAGES = [
  // Verified working Unsplash images of Jamaica landmarks and Caribbean scenes
  { url: 'https://images.unsplash.com/photo-1605218309111-d0a7a0d17877?w=800&auto=format&fit=crop', caption: "Dunn's River Falls" },
  { url: 'https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?w=800&auto=format&fit=crop', caption: 'Seven Mile Beach, Negril' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop', caption: 'Blue Lagoon, Portland' },
  { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop', caption: 'Jamaican Beach Paradise' },
  { url: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&auto=format&fit=crop', caption: 'Crystal Clear Waters' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop', caption: 'Caribbean Coastline' },
  { url: 'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?w=800&auto=format&fit=crop', caption: 'Blue Mountains, Jamaica' },
  { url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop', caption: 'Tropical Waterfall' },
  { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop', caption: 'Jamaican Sunset' },
  { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop', caption: 'Palm Trees & Beach' },
  { url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&auto=format&fit=crop', caption: 'Jamaican Coastline Vista' },
  { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop', caption: 'Turquoise Caribbean Sea' },
];

interface HomeProps {
  user: User;
  isOnline: boolean;
  onFavorite: (id: string, type: 'quote' | 'iconic' | 'bible') => void;
  onOpenAI: () => void;
  onTabChange: (tab: Tab) => void;
  onCategoryClick: (id: string) => void;
  onOpenMessages: () => void;
  unreadCount?: number;
  onOpenAlerts?: () => void;
  alertsCount?: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  quotes: Quote[];
  bibleAffirmations: BibleAffirmation[];
}

const Home: React.FC<HomeProps> = ({ user, isOnline, onFavorite, onOpenAI, onTabChange, onCategoryClick, onOpenMessages, unreadCount = 0, onOpenAlerts, alertsCount = 0, isDarkMode, onToggleTheme, quotes, bibleAffirmations }) => {
  const [activeDaily, setActiveDaily] = useState<'quote' | 'wisdom' | 'verse'>('quote');
  const [reveal, setReveal] = useState(false);
  const [localDaily, setLocalDaily] = useState<{ quote: Quote | null; wisdom: Quote | null; verse: BibleAffirmation | null }>({
    quote: null, wisdom: null, verse: null
  });
  const { speak, stop, isSpeaking } = useTTS();

  // Dynamic image rotation for Craft Wisdom section
  const [imgIndex, setImgIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setImgIndex(prev => (prev + 1) % JAMAICA_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveImage = async () => {
    const img = JAMAICA_IMAGES[imgIndex];
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `likkle-wisdom-${img.caption.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(img.url, '_blank');
    }
  };

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
    <div className="p-6 sm:p-10 pb-24 animate-fade-in">
      <header className="flex flex-col gap-8 mb-8 pt-6">
        <div className="flex items-center gap-5">
          {/* Profile & Theme Cluster */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => onTabChange('me')}
              aria-label="View Profile"
              className="size-16 sm:size-20 rounded-[2rem] border-4 border-primary/20 overflow-hidden active:scale-90 transition-transform shadow-2xl bg-background-dark rotate-3 hover:rotate-0 transition-all duration-500"
            >
              <img
                className="w-full h-full object-cover"
                src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/200`}
                alt="Profile"
              />
            </button>
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className={`h-6 w-11 rounded-full relative transition-all duration-300 flex items-center px-1 shadow-inner ${isDarkMode ? 'bg-primary/40' : 'bg-slate-200'}`}
            >
              <div className={`size-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-[10px] text-slate-900 font-black">
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-sm font-black uppercase tracking-widest opacity-40 text-slate-900 dark:text-white/40">Wha Gwan,</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
              {firstName}
            </h1>
            <OnlineCount />
          </div>

          {/* Header Icons */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => onTabChange('discover')} aria-label="Explore" className="size-11 rounded-full glass flex items-center justify-center text-slate-900 dark:text-white/60 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-xl">explore</span>
              </button>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-900/40 dark:text-white/40">Explore</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => onOpenMessages()} aria-label="Messages" className="size-11 rounded-full glass flex items-center justify-center text-slate-900 dark:text-white/60 active:scale-90 transition-transform relative">
                <span className="material-symbols-outlined text-xl">forum</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-white dark:border-background-dark animate-pop">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-900/40 dark:text-white/40">Messages</span>
            </div>
            {onOpenAlerts && (
              <div className="flex flex-col items-center gap-1">
                <button onClick={onOpenAlerts} aria-label="Alerts" className="size-11 rounded-full glass flex items-center justify-center text-slate-900 dark:text-white/60 active:scale-90 transition-transform relative">
                  <span className="material-symbols-outlined text-xl">notifications</span>
                  {alertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-jamaican-gold rounded-full flex items-center justify-center text-[9px] font-black text-background-dark border-2 border-white dark:border-background-dark animate-pop">
                      {alertsCount > 9 ? '9+' : alertsCount}
                    </span>
                  )}
                </button>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-900/40 dark:text-white/40">Alerts</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="flex justify-center gap-3 mb-4 pb-1">
          {[
            { id: 'quote', label: 'Quote', icon: 'wb_sunny' },
            { id: 'wisdom', label: 'Wisdom', icon: 'auto_stories' },
            { id: 'verse', label: 'Verse', icon: 'menu_book' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveDaily(tab.id as any); setReveal(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all ${activeDaily === tab.id ? 'bg-primary text-background-dark shadow-lg scale-105' : 'glass text-slate-900/40 dark:text-white/40'}`}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="glass rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden border-white/5 bg-gradient-to-br from-primary/5 to-transparent min-h-[50vh] justify-center">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-[120px] sm:text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {activeDaily === 'quote' ? 'wb_sunny' : activeDaily === 'wisdom' ? 'auto_stories' : 'menu_book'}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); refreshSingle(activeDaily); setReveal(false); }}
            className="absolute top-6 right-6 size-10 rounded-full glass border border-white/10 flex items-center justify-center text-slate-900/40 dark:text-white/40 active:scale-95 transition-all z-20 hover:text-primary hover:border-primary/20"
            title="Refresh this card"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>

          <span className="material-symbols-outlined text-primary text-5xl sm:text-7xl opacity-40">
            format_quote
          </span>

          <div className="space-y-4 max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white px-2">
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
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">translate</span>
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
                    className={`flex-1 glass py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-colors ${isSpeaking ? 'text-primary' : 'text-slate-900 dark:text-white'}`}
                  >
                    <span className={`material-symbols-outlined text-lg sm:text-2xl ${isSpeaking ? 'animate-pulse' : ''}`}>
                      {isSpeaking ? 'stop_circle' : 'volume_up'}
                    </span>
                    {isSpeaking ? 'Stop' : 'Listen'}
                  </button>
                  <button
                    onClick={() => onFavorite(currentItem.id, activeDaily === 'verse' ? 'bible' : 'quote')}
                    className={`flex-1 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${isItemFavored(currentItem) ? 'bg-primary text-background-dark' : 'glass text-slate-900 dark:text-white'}`}
                  >
                    <span className={`material-symbols-outlined text-lg sm:text-2xl ${isItemFavored(currentItem) ? 'fill-1 animate-pop' : ''}`}>favorite</span>
                    {isItemFavored(currentItem) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {Capacitor.getPlatform() === 'web' && (
        <div className="mb-10 px-1">
          <a
            href="https://likklewisdom.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full relative overflow-hidden group bg-gradient-to-r from-jamaican-gold to-primary rounded-2xl p-[1px] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 block"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors pointer-events-none"></div>
            <div className="relative bg-background-dark/95 backdrop-blur-xl rounded-[15px] py-4 px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-10 shrink-0 rounded-full bg-jamaican-gold/10 flex items-center justify-center text-jamaican-gold border border-jamaican-gold/20">
                  <span className="material-symbols-outlined text-xl">language</span>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-black text-sm uppercase tracking-wide">Visit Likkle Wisdom</h3>
                  <p className="text-white/50 text-[10px] font-bold tracking-wider">Check out di Likkle Wisdom link</p>
                </div>
              </div>
              <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-white/50 text-lg group-hover:text-white group-hover:translate-x-0.5 transition-all">arrow_forward</span>
              </div>
            </div>
          </a>
        </div>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Island Vibes</h2>
          <button onClick={() => onTabChange('discover')} className="text-sm sm:text-base font-semibold text-primary">Explore Categories</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.slice(0, 3).map(cat => (
            <div
              key={cat.id}
              onClick={() => { onTabChange('discover'); onCategoryClick(cat.id); }}
              className="glass p-6 sm:p-8 rounded-[2rem] flex items-center gap-4 group active:scale-95 transition-all border-white/5 cursor-pointer hover:border-primary/20"
            >
              <div className={`size-14 sm:size-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20`}>
                <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">{cat.name}</h3>
                <p className="text-[10px] text-slate-900/40 dark:text-white/40 uppercase tracking-widest font-bold">{cat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`glass rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative group cursor-pointer mb-10 border-white/5 shadow-2xl h-56 sm:h-72 transition-all ${!isOnline ? 'grayscale-[0.5]' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>

        {/* Dynamic rotating images */}
        {JAMAICA_IMAGES.map((img, i) => (
          <img
            key={i}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === imgIndex ? 'opacity-100' : 'opacity-0'}`}
            src={img.url}
            alt={img.caption}
          />
        ))}

        {/* Image caption */}
        <div className="absolute top-4 left-4 z-20">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/40 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            {JAMAICA_IMAGES[imgIndex].caption}
          </span>
        </div>

        {/* View / Save buttons */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowImageViewer(true); }}
            className="size-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all"
            title="View larger"
          >
            <span className="material-symbols-outlined text-base">fullscreen</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSaveImage(); }}
            className="size-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all"
            title="Save image"
          >
            <span className="material-symbols-outlined text-base">download</span>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {JAMAICA_IMAGES.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === imgIndex ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/30'}`} />
          ))}
        </div>

        {!isOnline && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-background-dark/40 backdrop-blur-[2px]">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-2">signal_wifi_off</span>
            <p className="text-white font-black uppercase text-[10px] tracking-widest">Signal low fi brew magic</p>
            <p className="text-white/50 font-medium text-[8px] uppercase tracking-widest mt-1">Connect fi craft custom wisdom</p>
          </div>
        )}

        <div onClick={onOpenAI} className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 w-full flex justify-between pr-12 sm:pr-20 items-end">
          <div className="space-y-1 sm:space-y-3">
            <p className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-1">
              AI Magic <span className="material-symbols-outlined text-[14px] sm:text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </p>
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-none">Craft Yuh Own Wisdom</h3>
          </div>
          <div className="size-12 sm:size-16 glass rounded-2xl flex items-center justify-center text-primary border-primary/30">
            <span className="material-symbols-outlined text-xl sm:text-3xl">verified</span>
          </div>
        </div>
      </section>

      {/* Image Viewer Lightbox */}
      {showImageViewer && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowImageViewer(false)}>
          <div className="relative max-w-full max-h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Close button on image */}
            <button 
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 size-12 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white z-10 active:scale-90 transition-all shadow-xl border border-white/20"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Image */}
            <img
              src={JAMAICA_IMAGES[imgIndex].url.replace('w=800', 'w=1600')}
              alt={JAMAICA_IMAGES[imgIndex].caption}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />

            {/* Caption and Save button */}
            <div className="flex items-center gap-4 mt-4">
              <p className="text-white/60 text-sm font-bold">{JAMAICA_IMAGES[imgIndex].caption}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveImage(); }}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-background-dark rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Save
              </button>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((imgIndex - 1 + JAMAICA_IMAGES.length) % JAMAICA_IMAGES.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-all shadow-xl border border-white/20"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((imgIndex + 1) % JAMAICA_IMAGES.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-all shadow-xl border border-white/20"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
