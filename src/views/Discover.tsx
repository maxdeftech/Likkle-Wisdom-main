
import React, { useMemo } from 'react';
import { CATEGORIES, ICONIC_QUOTES } from '../constants';
import { Quote, IconicQuote, BibleAffirmation } from '../types';

interface DiscoverProps {
  onCategoryClick: (id: string) => void;
  onOpenJamaicanHistory?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOnline: boolean;
  quotes?: Quote[];
  iconic?: IconicQuote[];
  bible?: BibleAffirmation[];
}

const Discover: React.FC<DiscoverProps> = ({ onCategoryClick, onOpenJamaicanHistory, searchQuery, onSearchChange, isOnline, quotes = [], iconic = [], bible = [] }) => {
  const q = searchQuery.toLowerCase().trim();

  // Search content when query > 1 char
  const quoteResults = useMemo(() => {
    if (q.length < 2) return [];
    return quotes.filter(item => item.patois.toLowerCase().includes(q) || item.english.toLowerCase().includes(q)).slice(0, 8);
  }, [q, quotes]);

  const bibleResults = useMemo(() => {
    if (q.length < 2) return [];
    return bible.filter(item => item.reference.toLowerCase().includes(q) || item.patois.toLowerCase().includes(q) || item.kjv.toLowerCase().includes(q)).slice(0, 8);
  }, [q, bible]);

  const iconicResults = useMemo(() => {
    if (q.length < 2) return [];
    return iconic.filter(item => item.text.toLowerCase().includes(q) || item.author.toLowerCase().includes(q)).slice(0, 8);
  }, [q, iconic]);

  const categoryResults = useMemo(() => {
    if (q.length < 2) return [];
    return CATEGORIES.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [q]);

  const hasResults = quoteResults.length > 0 || bibleResults.length > 0 || iconicResults.length > 0 || categoryResults.length > 0;
  const isSearching = q.length >= 2;

  return (
    <div className="p-6 sm:p-10 pb-24 animate-fade-in" role="region" aria-label="Discover wisdom">
      <header className="py-12 sm:py-16 flex flex-col gap-2" role="banner">
         <span className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.4em]" aria-hidden="true">Wisdom Market</span>
         <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">Pick Yuh Vibe</h1>
         <p className="text-slate-500 dark:text-slate-400 font-medium sm:text-lg">Find di inspiration weh fit yuh spirit.</p>
         
         {!isOnline && (
           <div className="mt-4 glass-gold px-4 py-2 rounded-2xl border-jamaican-gold/20 flex items-center gap-3 w-fit" role="status" aria-label="Viewing stashed library while offline">
              <span className="material-symbols-outlined text-jamaican-gold text-sm" aria-hidden="true">inventory_2</span>
              <span className="text-[9px] font-black uppercase text-jamaican-gold tracking-widest">Viewing Stashed Library</span>
           </div>
         )}
      </header>

      <div className="relative mb-10 sm:mb-16">
        <label htmlFor="discover-search" className="sr-only">Search wisdom, verses, and categories</label>
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 text-2xl" aria-hidden="true">search</span>
        <input
          id="discover-search"
          type="search"
          className="w-full bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl py-5 sm:py-7 pl-14 pr-6 text-slate-900 dark:text-white placeholder-slate-500 text-base sm:text-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-xl"
          placeholder="Search wisdom, verses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search wisdom, verses, and categories"
          autoComplete="off"
        />
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="space-y-8 mb-12" role="region" aria-label="Search results" aria-live="polite">
          {!hasResults && (
            <div className="text-center py-12 glass rounded-[2rem]" role="status">
              <span className="material-symbols-outlined text-5xl text-white/10 mb-3" aria-hidden="true">search_off</span>
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">No results fi "{searchQuery}"</p>
            </div>
          )}

          {/* Matching Categories */}
          {categoryResults.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Categories</h3>
              <div className="grid grid-cols-2 gap-3">
                {categoryResults.map(cat => (
                  <button key={cat.id} onClick={() => onCategoryClick(cat.id)} className="glass rounded-2xl p-4 flex items-center gap-3 text-left active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-primary text-xl">{cat.icon}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{cat.name}</p>
                      <p className="text-white/30 text-[9px] uppercase">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quote Results */}
          {quoteResults.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Quotes ({quoteResults.length})</h3>
              <div className="space-y-2">
                {quoteResults.map(item => (
                  <div key={item.id} className="glass rounded-2xl p-4">
                    <p className="text-white font-bold text-sm italic">"{item.patois}"</p>
                    <p className="text-white/40 text-xs mt-1">{item.english}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bible Verse Results */}
          {bibleResults.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Bible Verses ({bibleResults.length})</h3>
              <div className="space-y-2">
                {bibleResults.map(item => (
                  <div key={item.id} className="glass rounded-2xl p-4 border-primary/10">
                    <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">{item.reference}</p>
                    <p className="text-white font-bold text-sm italic">"{item.kjv}"</p>
                    <p className="text-white/40 text-xs mt-1">{item.patois}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Iconic Quote Results */}
          {iconicResults.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Iconic Wisdom ({iconicResults.length})</h3>
              <div className="space-y-2">
                {iconicResults.map(item => (
                  <div key={item.id} className="glass rounded-2xl p-4 border-jamaican-gold/10">
                    <p className="text-white font-bold text-sm italic">"{item.text}"</p>
                    <p className="text-jamaican-gold/60 text-[10px] font-black uppercase mt-2 tracking-wider">— {item.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Original content (hidden when searching) */}
      {!isSearching && (
        <>
          {/* Jamaican History — featured section */}
          {onOpenJamaicanHistory && (
            <button
              type="button"
              onClick={onOpenJamaicanHistory}
              className="w-full mb-10 sm:mb-12 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group text-left border-2 border-jamaican-gold/30 bg-gradient-to-br from-jamaican-gold/20 via-primary/10 to-transparent hover:border-jamaican-gold/50 active:scale-[0.99] transition-all duration-300 shadow-xl hover:shadow-2xl"
              aria-label="Open Jamaican History"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-jamaican-gold/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              <div className="relative z-10 flex items-center gap-4 sm:gap-6">
                <div className="size-16 sm:size-20 rounded-2xl bg-jamaican-gold/30 border border-jamaican-gold/40 flex items-center justify-center text-jamaican-gold group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-4xl sm:text-5xl">history_edu</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] sm:text-xs font-black text-jamaican-gold uppercase tracking-[0.25em]">Discover</span>
                  <h2 className="text-slate-900 dark:text-white text-xl sm:text-2xl font-black mt-1 group-hover:text-jamaican-gold transition-colors">Jamaican History</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">National heroes, iconic places, slavery & overcoming, cuisine, symbols & more</p>
                </div>
                <span className="material-symbols-outlined text-2xl sm:text-3xl text-jamaican-gold/70 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => onCategoryClick(cat.id)}
                className="glass rounded-[2rem] p-6 sm:p-8 aspect-square relative overflow-hidden group flex flex-col justify-between cursor-pointer active:scale-95 transition-all border-white/5 shadow-xl hover:border-primary/20"
              >
                <div className={`size-14 sm:size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-lg group-hover:bg-primary group-hover:text-background-dark transition-colors`}>
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">{cat.icon}</span>
                </div>
                <div className="relative z-10">
                  <h2 className="text-slate-900 dark:text-white text-lg sm:text-xl font-black leading-tight tracking-tight group-hover:text-primary transition-colors">{cat.name}</h2>
                  <p className={`text-slate-900/30 dark:text-white/30 text-[9px] sm:text-[11px] font-black uppercase tracking-widest mt-1`}>{cat.description}</p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <span className="material-symbols-outlined text-9xl">{cat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">Iconic Wisdom</h3>
              <span className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-widest">From Legends</span>
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory">
              {ICONIC_QUOTES.map(iq => (
                <div key={iq.id} className="min-w-[280px] sm:min-w-[380px] snap-center glass rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 relative overflow-hidden border-white/5 shadow-2xl bg-gradient-to-tr from-accent-gold/10 to-transparent">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                     <span className="material-symbols-outlined text-6xl sm:text-8xl">stars</span>
                  </div>
                  <span className="material-symbols-outlined text-accent-gold text-4xl sm:text-5xl mb-6 opacity-60">format_quote</span>
                  <p className="text-slate-900 dark:text-white text-lg sm:text-2xl font-bold leading-relaxed mb-6 italic">"{iq.text}"</p>
                  <div className="flex items-center gap-3 mt-auto">
                     <div className="size-10 sm:size-12 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-black border border-accent-gold/20 text-base sm:text-xl">
                        {iq.author[0]}
                     </div>
                     <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900/60 dark:text-white/60">{iq.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-4">
            <h3 className="text-slate-900 dark:text-white text-xl sm:text-3xl font-black mb-6 px-2">Daily Featured</h3>
            <div className="glass rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 relative overflow-hidden flex items-center gap-6 sm:gap-10 border-white/5 shadow-2xl bg-gradient-to-br from-primary/5 to-transparent">
              <div className="size-20 sm:size-32 shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl rotate-3">
                <img src="https://picsum.photos/seed/reggae/200" alt="Island" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-2 sm:gap-4">
                <span className="text-primary text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em]">Editor's Pick</span>
                <h4 className="text-slate-900 dark:text-white font-black text-xl sm:text-3xl leading-tight">"Nuh badda fret."</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg font-medium italic">Don't worry about it.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Discover;
