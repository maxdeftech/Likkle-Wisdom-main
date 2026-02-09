
import React, { useState } from 'react';
import { generatePatoisWisdom } from '../services/geminiService';
import { MOODS } from '../constants';
import { User } from '../types';

interface AIWisdomProps {
  user: User;
  isOnline: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onGuestRestricted: () => void;
}

const AIWisdom: React.FC<AIWisdomProps> = ({ user, isOnline, onClose, onUpgrade, onGuestRestricted }) => {
  const [mood, setMood] = useState('Peace');
  const [loading, setLoading] = useState(false);
  const [wisdom, setWisdom] = useState<{ patois: string; english: string } | null>(null);

  const brewWisdom = async () => {
    if (!isOnline) return;
    if (user.isGuest) {
      onGuestRestricted();
      return;
    }
    if (!user.isPremium) {
      onUpgrade();
      return;
    }
    setLoading(true);
    const result = await generatePatoisWisdom(mood);
    setWisdom(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-background-dark flex flex-col font-display overflow-y-auto pb-10">
      <div className="absolute inset-0 cosmic-bg opacity-30 pointer-events-none"></div>
      
      <header className="relative z-10 flex items-center p-6 justify-between">
        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full glass text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">AI Wisdom</h1>
        <span className="material-symbols-outlined text-primary">auto_awesome</span>
      </header>

      {!isOnline ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
           <div className="size-32 rounded-3xl glass flex items-center justify-center text-red-400 mb-8 shadow-[0_0_40px_rgba(248,113,113,0.1)] border-red-500/20">
             <span className="material-symbols-outlined text-6xl">cloud_off</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight uppercase tracking-tight">No Signal, <br/><span className="text-red-400">No Magic</span></h2>
           <p className="text-slate-500 dark:text-white/40 text-sm font-medium mb-10 leading-relaxed uppercase tracking-widest">Brewing custom wisdom needs a link to di stars. Join di network fi craft yuh vibe.</p>
           <div className="w-full glass p-6 rounded-2xl border-white/5 bg-white/5">
              <p className="text-xs font-bold text-slate-900 dark:text-white/60 mb-1">TIP</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-white/30 uppercase tracking-widest">Check yuh Wi-Fi or Data fi unlock di AI brew.</p>
           </div>
        </div>
      ) : user.isGuest ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
           <div className="size-32 rounded-3xl glass flex items-center justify-center text-primary mb-8 animate-float">
             <span className="material-symbols-outlined text-6xl">lock_person</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">Wisdom is for di Family</h2>
           <p className="text-slate-500 dark:text-white/40 text-sm font-medium mb-10 leading-relaxed">Guests can read di daily vibes, but AI wisdom needs a soul. Sign up fi unlock di full powah!</p>
           <button onClick={onGuestRestricted} className="w-full bg-primary py-5 rounded-2xl font-black text-xs uppercase text-background-dark shadow-xl active:scale-95 transition-all">Sign Up Fi Access</button>
        </div>
      ) : (
        <>
          <div className="relative z-10 px-6 pt-4">
            <h2 className="text-2xl font-black leading-tight mb-4 text-slate-900 dark:text-white">Whah gwan? <br/><span className="text-primary/90">Pick yuh mood...</span></h2>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {MOODS.map(m => (
                <button 
                  key={m.name}
                  onClick={() => setMood(m.name)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl glass px-4 py-2 transition-all ${mood === m.name ? 'border-primary/40 bg-primary/10 text-primary' : 'text-slate-900 dark:text-white'}`}
                >
                  <span className="material-symbols-outlined text-sm">{m.icon}</span>
                  <span className="text-sm font-medium">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center py-10">
            <div className="relative group cursor-pointer" onClick={brewWisdom}>
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px]"></div>
              <div className="relative w-64 h-64 rounded-full glass flex items-center justify-center border-slate-200 dark:border-white/20 overflow-hidden shadow-inner">
                <div className={`relative w-32 h-32 bg-primary rounded-full blur-3xl opacity-40 ${loading ? 'animate-pulse' : ''}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`material-symbols-outlined text-primary text-7xl ${loading ? 'animate-spin' : 'opacity-80'}`}>
                    {loading ? 'progress_activity' : 'temp_preferences_custom'}
                  </span>
                </div>
              </div>
              {!user.isPremium && (
                <div className="absolute top-0 right-0 size-12 rounded-full bg-jamaican-gold text-background-dark flex items-center justify-center border-4 border-background-dark shadow-xl rotate-12">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
              )}
            </div>
            <p className="mt-6 text-slate-900/50 dark:text-white/50 text-[10px] font-black tracking-widest uppercase">Tap di bowl fi focus energy</p>
          </div>

          {wisdom && !loading && (
            <div className="relative z-10 px-6 animate-fade-in">
              <div className="glass rounded-3xl p-8 border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
                <div className="space-y-6">
                  <span className="material-symbols-outlined text-primary text-4xl opacity-50">format_quote</span>
                  <h3 className="text-2xl font-black italic leading-tight text-slate-900 dark:text-white">"{wisdom.patois}"</h3>
                  <div className="h-px w-12 bg-primary/30"></div>
                  <p className="text-sm text-slate-900/60 dark:text-white/60 italic font-medium leading-relaxed">"{wisdom.english}"</p>
                </div>
              </div>
            </div>
          )}

          {!wisdom && !loading && !user.isPremium && (
            <div className="px-10 text-center relative z-10 mt-4">
              <p className="text-jamaican-gold font-bold text-xs">Unlock Premium to brew unlimited custom AI wisdom!</p>
            </div>
          )}

          <div className="relative z-10 px-6 mt-8">
            <button 
              onClick={brewWisdom}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl h-16 bg-primary text-background-dark font-black text-lg shadow-xl disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {loading ? 'A brew di wisdom...' : user.isPremium ? 'Generate AI Wisdom' : 'Unlock AI Wisdom'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AIWisdom;
