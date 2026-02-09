
import React from 'react';
import { Quote, IconicQuote, BibleAffirmation } from '../types';
import { CATEGORIES } from '../constants';

interface CategoryResultsViewProps {
  categoryId: string;
  onClose: () => void;
  quotes: Quote[];
  iconic: IconicQuote[];
  bible: BibleAffirmation[];
  onFavorite: (id: string, type: any) => void;
}

const CategoryResultsView: React.FC<CategoryResultsViewProps> = ({ categoryId, onClose, quotes, iconic, bible, onFavorite }) => {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  
  const filteredQuotes = quotes.filter(q => q.category === categoryId);
  const filteredIconic = iconic.filter(q => q.category === categoryId);
  const filteredBible = bible.filter(q => q.category === categoryId);

  return (
    <div className="min-h-full p-6 pb-24 animate-fade-in">
      <header className="pt-12 flex items-center justify-between mb-8">
        <button onClick={onClose} className="size-11 rounded-full glass flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-right">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{cat?.name}</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{cat?.description}</h2>
        </div>
      </header>

      <div className="space-y-6">
        {[...filteredQuotes, ...filteredIconic, ...filteredBible].map((item: any, idx) => (
          <div key={item.id} className="glass rounded-[2rem] p-8 border-white/5 relative group hover:border-primary/20 transition-all shadow-xl animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex justify-between items-start mb-6">
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1 rounded-full border border-primary/10">
                {item.author ? `Legend: ${item.author}` : item.reference ? `Scripture: ${item.reference}` : 'Vibe'}
              </span>
              <button onClick={() => onFavorite(item.id, item.author ? 'iconic' : item.reference ? 'bible' : 'quote')}>
                <span className={`material-symbols-outlined text-primary ${item.isFavorite ? 'fill-1' : ''}`}>favorite</span>
              </button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">
              "{item.patois || item.text}"
            </h3>

            {(item.english || item.kjv) && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                <p className="text-slate-900/40 dark:text-white/40 italic text-sm leading-relaxed">
                  "{item.english || item.kjv}"
                </p>
              </div>
            )}
          </div>
        ))}
        
        {filteredQuotes.length + filteredIconic.length + filteredBible.length === 0 && (
          <div className="py-20 text-center opacity-30">
             <span className="material-symbols-outlined text-6xl text-slate-900 dark:text-white">search_off</span>
             <p className="mt-4 font-black uppercase tracking-widest text-slate-900 dark:text-white">No items found for this vibe.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryResultsView;
