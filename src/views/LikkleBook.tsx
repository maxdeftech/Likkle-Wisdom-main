import React, { useState } from 'react';
import { JournalEntry } from '../types';

interface LikkleBookProps {
  entries: JournalEntry[];
  onAdd: (title: string, text: string, mood: string) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const LikkleBook: React.FC<LikkleBookProps> = ({ entries, onAdd, onDelete, searchQuery, onSearchChange }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mood, setMood] = useState('😊');

  const handleSave = () => {
    if (!text.trim() || !title.trim()) return;
    onAdd(title, text, mood);
    setTitle('');
    setText('');
    setShowAdd(false);
  };

  if (showAdd) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-background-dark p-6 flex flex-col font-display overflow-hidden animate-fade-in">
        <div className="absolute inset-0 cosmic-bg opacity-40"></div>
        
        <header className="relative z-10 flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdd(false)} className="size-9 rounded-full flex items-center justify-center glass border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Write Move</h2>
          </div>
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
        </header>

        <div className="flex-1 relative z-10 flex flex-col gap-3 overflow-hidden">
          <div className="glass rounded-2xl p-4 flex flex-col shadow-2xl border-slate-200 dark:border-white/5 relative overflow-hidden flex-1 mb-2">
            <div className="mb-3 shrink-0">
               <input 
                  type="text" 
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl h-12 px-4 text-slate-900 dark:text-white text-base font-black placeholder:text-slate-900/20 dark:placeholder:text-white/20 focus:ring-primary/50 focus:border-primary/30"
                  placeholder="Entry Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
               />
            </div>

            <div className="mb-3 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-900/30 dark:text-white/30 mb-2 px-1">How yuh feel today?</p>
              <div className="flex justify-between items-center gap-2">
                {['😊', '😎', '🔥', '😌', '🌱'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setMood(m)}
                    className={`size-10 rounded-lg flex items-center justify-center text-xl transition-all duration-300 ${mood === m ? 'bg-primary text-background-dark scale-105 shadow-[0_0_15px_rgba(19,236,91,0.4)]' : 'glass border-slate-200 dark:border-white/5 opacity-50'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <textarea 
              className="flex-1 w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-4 focus:ring-0 text-slate-900 dark:text-white text-sm placeholder:text-slate-900/10 dark:placeholder:text-white/10 resize-none leading-relaxed font-medium z-10 no-scrollbar"
              placeholder="Wah gwan today? Spill di tea..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 pb-12">
            <button onClick={() => setShowAdd(false)} className="glass h-11 rounded-xl font-black text-slate-900/40 dark:text-white/40 uppercase tracking-widest text-[9px] active:scale-95 transition-all">Back</button>
            <button 
              onClick={handleSave} 
              disabled={!title.trim() || !text.trim()}
              className="bg-primary h-11 rounded-xl font-black text-background-dark flex items-center justify-center gap-2 shadow-xl active:scale-95 uppercase tracking-widest text-[9px] disabled:opacity-30"
            >
              <span className="material-symbols-outlined font-black text-xs">check</span> Save Move
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col pb-40 animate-fade-in">
      <header className="p-6 pt-16 flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Your Journey</span>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Likkle Book</h1>
      </header>

      <div className="px-6 mb-8">
        <div className="glass flex items-center px-5 h-16 rounded-2xl shadow-xl border-slate-200 dark:border-white/5 focus-within:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-slate-900/20 dark:text-white/20 mr-3">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-900/20 dark:placeholder:text-white/20 font-medium text-slate-900 dark:text-white" 
            placeholder="Search titles or content..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6 flex-1">
        <div className="relative border-l-2 border-primary/20 ml-4 pl-8 flex flex-col gap-8">
          {filteredEntries.length > 0 ? filteredEntries.map((entry, idx) => (
            <div key={entry.id} className="relative animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="absolute -left-[43px] top-6 z-10 size-6 rounded-full bg-primary border-4 border-white dark:border-background-dark shadow-[0_0_15px_rgba(19,236,91,0.5)] flex items-center justify-center">
                 <div className="size-1.5 bg-background-dark rounded-full"></div>
              </div>
              <div className="glass p-6 rounded-[2rem] border-slate-200 dark:border-white/5 shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col pr-8">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{entry.date}</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-primary transition-colors">{entry.title}</h3>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-12 rounded-2xl glass flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg">
                      {entry.mood}
                    </div>
                    <button 
                      onClick={() => onDelete(entry.id)}
                      className="size-8 rounded-lg glass text-red-500/30 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                
                {/* Journal Text Content */}
                <div className="relative">
                  <p className={`text-slate-900/60 dark:text-white/60 text-base leading-relaxed font-medium transition-all duration-500 ${expandedId === entry.id ? '' : 'line-clamp-3'}`}>
                     {entry.text}
                  </p>
                  {expandedId !== entry.id && entry.text.length > 120 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-background-dark to-transparent pointer-events-none opacity-40"></div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                   <span className="text-[9px] font-bold text-slate-900/20 dark:text-white/20 uppercase tracking-widest">Captured Wisdom</span>
                   <button 
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline flex items-center gap-1"
                   >
                    {expandedId === entry.id ? 'Hide Move' : 'View Full Move'}
                    <span className="material-symbols-outlined text-xs">
                      {expandedId === entry.id ? 'expand_less' : 'expand_more'}
                    </span>
                   </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-30 -ml-8">
               <span className="material-symbols-outlined text-6xl mb-4 text-slate-900 dark:text-white">book</span>
               <p className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">Your story is waiting to be told.</p>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-6 size-16 rounded-2xl bg-primary text-background-dark shadow-[0_10px_40px_rgba(19,236,91,0.5)] flex items-center justify-center z-[45] transition-all hover:scale-110 active:scale-95 border-4 border-white dark:border-background-dark"
      >
        <span className="material-symbols-outlined text-3xl font-black">add</span>
      </button>
    </div>
  );
};

export default LikkleBook;