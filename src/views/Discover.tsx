
import React from 'react';
import { CATEGORIES, ICONIC_QUOTES } from '../constants';

interface DiscoverProps {
  onCategoryClick: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOnline: boolean;
}

const Discover: React.FC<DiscoverProps> = ({ onCategoryClick, searchQuery, onSearchChange, isOnline }) => {
  return (
    <div className="p-6 sm:p-10 pb-24 animate-fade-in">
      <header className="py-12 sm:py-16 flex flex-col gap-2">
         <span className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.4em]">Wisdom Market</span>
         <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">Pick Yuh Vibe</h1>
         <p className="text-slate-500 dark:text-slate-400 font-medium sm:text-lg">Find di inspiration weh fit yuh spirit.</p>
         
         {!isOnline && (
           <div className="mt-4 glass-gold px-4 py-2 rounded-2xl border-jamaican-gold/20 flex items-center gap-3 w-fit">
              <span className="material-symbols-outlined text-jamaican-gold text-sm">inventory_2</span>
              <span className="text-[9px] font-black uppercase text-jamaican-gold tracking-widest">Viewing Stashed Library</span>
           </div>
         )}
      </header>

      <div className="relative mb-10 sm:mb-16">
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 text-2xl">search</span>
        <input 
          className="w-full bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl py-5 sm:py-7 pl-14 pr-6 text-slate-900 dark:text-white placeholder-slate-500 text-base sm:text-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all shadow-xl" 
          placeholder="Search wisdom, verses, or tags..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

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
    </div>
  );
};

export default Discover;
