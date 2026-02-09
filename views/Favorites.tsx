
import React from 'react';
import { Quote } from '../types';

interface FavoritesProps {
  quotes: Quote[];
  // Fix: Updated onFavorite signature to include type for consistency with handleToggleFavorite in App.tsx
  onFavorite: (id: string, type: 'quote' | 'iconic' | 'bible') => void;
}

const Favorites: React.FC<FavoritesProps> = ({ quotes, onFavorite }) => {
  return (
    <div className="p-6 pb-24 animate-fade-in">
      <header className="flex items-center justify-between py-6">
        <h2 className="text-2xl font-bold tracking-tight">Your Favorites</h2>
        <span className="material-symbols-outlined text-primary">more_horiz</span>
      </header>

      <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-2">
        {['All', 'Life', 'Success', 'Caution'].map((cat, i) => (
          <div key={cat} className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 transition-all ${i === 0 ? 'bg-primary text-background-dark font-bold' : 'glass text-white text-sm font-medium'}`}>
            {cat}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {quotes.length > 0 ? quotes.map(quote => (
          <div key={quote.id} className="glass rounded-xl p-5 group transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{quote.category}</span>
              {/* Fix: Pass 'quote' as the type when calling onFavorite */}
              <button onClick={() => onFavorite(quote.id, 'quote')} className="text-primary">
                <span className="material-symbols-outlined fill-1">favorite</span>
              </button>
            </div>
            <p className="text-white text-lg font-bold leading-snug mb-3">{quote.patois}</p>
            <p className="text-white/60 text-sm italic font-medium border-t border-white/5 pt-3 leading-relaxed">
              "{quote.english}"
            </p>
            <div className="mt-4 flex gap-2">
              <button className="bg-primary/20 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/30 uppercase tracking-tighter hover:bg-primary/30 transition-colors">
                Share Wisdom
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl opacity-20 mb-4">favorite_border</span>
            <p className="text-white/40">No saved wisdom yet. Start explore!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
