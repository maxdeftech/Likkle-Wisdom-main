
import React from 'react';

interface PremiumUpgradeProps {
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-modal bg-white dark:bg-background-dark flex flex-col font-display overflow-y-auto no-scrollbar pb-12 transition-colors duration-300">
      <div className="absolute inset-0 cosmic-bg opacity-30 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center p-6 justify-between">
        <button onClick={onClose} className="size-11 flex items-center justify-center rounded-full glass text-slate-900/50 dark:text-white/50 hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Support</h2>
        <div className="size-11"></div>
      </header>

      <div className="relative z-10 flex-1 px-6 py-4 flex flex-col gap-8 items-center text-center justify-center max-w-md mx-auto w-full">

        <div className="glass rounded-[3rem] p-8 flex flex-col items-center shadow-2xl bg-gradient-to-br from-primary/10 via-transparent to-jamaican-gold/10 w-full animate-fade-in">
          <div className="size-24 rounded-full bg-gradient-to-br from-jamaican-gold to-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-4xl text-background-dark font-bold">auto_awesome</span>
          </div>

          <h1 className="text-3xl font-black mb-3 text-white">Full Wisdom Free</h1>
          <p className="text-white/60 text-sm font-medium leading-relaxed mb-8">
            We've unlocked AI Mode, Offline Bible, and Unlimited Journaling for everyone. No gates, just vibes.
          </p>

          <a
            href="https://maxdeftech.wixsite.com/mdt-ja"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">language</span>
            <span>Visit our website</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default PremiumUpgrade;
