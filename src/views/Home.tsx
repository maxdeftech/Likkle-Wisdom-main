
import React, { useState, useEffect, useCallback } from 'react';
import { Quote, User, Tab, BibleAffirmation } from '../types';
import { INITIAL_QUOTES, BIBLE_AFFIRMATIONS, CATEGORIES } from '../constants';
import { useTTS } from '../hooks/useTTS';
import OnlineCount from '../components/OnlineCount';
import { presentPaywall } from '../services/revenueCat';
import { Capacitor } from '@capacitor/core';

interface HomeProps {
  user: User;
  isOnline: boolean;
  onFavorite: (id: string, type: 'quote' | 'iconic' | 'bible') => void;
  onOpenAI: () => void;
  onTabChange: (tab: Tab) => void;
  onCategoryClick: (id: string) => void;
  onOpenMessages: () => void;
  unreadCount?: number;
}

const Home: React.FC<HomeProps> = ({ user, isOnline, onFavorite, onOpenAI, onTabChange, onCategoryClick, onOpenMessages, unreadCount = 0 }) => {
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
    const newDaily = {
      quote: loadRandomQuote(),
      wisdom: loadRandomQuote(),
      verse: loadRandomVerse()
    };
    setLocalDaily(newDaily);
    localStorage.setItem('likkle_daily_items', JSON.stringify(newDaily));
    localStorage.setItem('likkle_last_daily_update', Date.now().toString());
  };

  const refreshSingle = (type: 'quote' | 'wisdom' | 'verse') => {
    const newItem = type === 'verse' ? loadRandomVerse() : loadRandomQuote();
    setLocalDaily(prev => {
      const updated = { ...prev, [type]: newItem };
      localStorage.setItem('likkle_daily_items', JSON.stringify(updated));
      return updated;
    });
  };

  const firstName = user?.username?.split(' ')[0] || 'Seeker';
  const currentItem = activeDaily === 'quote' ? localDaily.quote : activeDaily === 'wisdom' ? localDaily.wisdom : localDaily.verse;

  const isVerse = (item: any): item is BibleAffirmation => item && 'kjv' in item;
  const isQuote = (item: any): item is Quote => item && 'english' in item;

  if (!currentItem) return (
    <div className="flex items-center justify-center h-full opacity-20">
      <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 pb-24 animate-fade-in">
      <header className="flex items-center justify-between mb-8 pt-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium opacity-70 text-slate-900 dark:text-white/70">Wha Gwan,</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{firstName}</h1>
          <OnlineCount />
        </div>
        <div className="flex gap-3">
          <button onClick={onOpenMessages} className="size-11 sm:size-14 rounded-full glass flex items-center justify-center text-slate-900 dark:text-white active:scale-95 transition-all relative">
            <span className="material-symbols-outlined text-xl sm:text-2xl">forum</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-background-dark animate-pop">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => onTabChange('discover')} aria-label="Search" className="size-11 sm:size-14 rounded-full glass flex items-center justify-center text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
          </button>
          <button
            onClick={() => onTabChange('me')}
            aria-label="View Profile"
            className="size-11 sm:size-14 rounded-full border-2 border-primary overflow-hidden active:scale-90 transition-transform"
          >
            <img
              className="w-full h-full object-cover"
              src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/200`}
              alt="Profile"
            />
          </button>
        </div>
      </header>

      <section className="mb-10">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'quote', label: 'Quote', icon: 'wb_sunny' },
            { id: 'wisdom', label: 'Wisdom', icon: 'auto_stories' },
            { id: 'verse', label: 'Verse', icon: 'menu_book' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveDaily(tab.id as any); setReveal(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all ${activeDaily === tab.id ? 'bg-primary text-background-dark shadow-lg scale-105' : 'glass text-slate-900/40 dark:text-white/40'}`}
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
            className="absolute top-6 right-6 size-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 active:scale-95 transition-all z-20 hover:text-primary hover:border-primary/20"
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
                <p className="text-white/40 text-[9px] font-bold italic">
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
                    className={`flex-1 py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${'isFavorite' in currentItem && currentItem.isFavorite ? 'bg-primary text-background-dark' : 'glass text-slate-900 dark:text-white'}`}
                  >
                    <span className={`material-symbols-outlined text-lg sm:text-2xl ${'isFavorite' in currentItem && currentItem.isFavorite ? 'fill-1 animate-pop' : ''}`}>favorite</span>
                    {'isFavorite' in currentItem && currentItem.isFavorite ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mb-10 px-1">
        <button
          onClick={() => {
            if (Capacitor.getPlatform() === 'web') {
              window.open('https://www.paypal.com/donate/?business=maxwelldefinitivetechnologies@gmail.com&currency_code=USD', '_blank');
            } else {
              presentPaywall();
            }
          }}
          className="w-full relative overflow-hidden group bg-gradient-to-r from-jamaican-gold to-primary rounded-2xl p-[1px] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors pointer-events-none"></div>
          <div className="relative bg-background-dark/95 backdrop-blur-xl rounded-[15px] py-4 px-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-10 shrink-0 rounded-full bg-jamaican-gold/10 flex items-center justify-center text-jamaican-gold border border-jamaican-gold/20">
                <span className="material-symbols-outlined text-xl">volunteer_activism</span>
              </div>
              <div className="text-left">
                <h3 className="text-white font-black text-sm uppercase tracking-wide">Support Likkle Wisdom</h3>
                <p className="text-white/50 text-[10px] font-bold tracking-wider">Help keep the vibes flowin'</p>
              </div>
            </div>
            <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-white/50 text-lg group-hover:text-white group-hover:translate-x-0.5 transition-all">arrow_forward</span>
            </div>
          </div>
        </button>
      </div>

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
        onClick={onOpenAI}
        className={`glass rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative group cursor-pointer mb-10 border-white/5 shadow-2xl h-56 sm:h-72 transition-all ${!isOnline ? 'grayscale-[0.5]' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src="https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?q=80&w=800&auto=format&fit=crop" alt="Island" />

        {!isOnline && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-background-dark/40 backdrop-blur-[2px]">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-2">signal_wifi_off</span>
            <p className="text-white font-black uppercase text-[10px] tracking-widest">Signal low fi brew magic</p>
            <p className="text-white/50 font-medium text-[8px] uppercase tracking-widest mt-1">Connect fi craft custom wisdom</p>
          </div>
        )}

        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 w-full flex justify-between pr-12 sm:pr-20 items-end">
          <div className="space-y-1 sm:space-y-3">
            <p className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-1">
              AI Magic <span className="material-symbols-outlined text-[14px] sm:text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </p>
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-none">Craft Yuh Own Wisdom</h3>
          </div>
          <div className="size-12 sm:size-16 glass rounded-2xl flex items-center justify-center text-primary border-primary/30">
            <span className="material-symbols-outlined text-xl sm:text-3xl">{user.isPremium ? 'verified' : 'lock'}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
