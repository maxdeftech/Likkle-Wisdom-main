
import React, { useState } from 'react';
import { presentPaywall } from '../services/revenueCat';
import { Capacitor } from '@capacitor/core';

interface PremiumUpgradeProps {
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ onClose, onPurchaseSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (Capacitor.getPlatform() === 'web') {
      window.open('https://www.paypal.com/donate/?business=maxwelldefinitivetechnologies@gmail.com&currency_code=USD', '_blank');
      return;
    }
    setLoading(true);
    try {
      const success = await presentPaywall();
      if (success) {
        onPurchaseSuccess();
      }
    } catch (error) {
      console.error("Donation failed:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <span className="material-symbols-outlined text-4xl text-background-dark font-bold">favorite</span>
          </div>

          <h1 className="text-3xl font-black mb-3 text-white">Full Wisdom Free</h1>
          <p className="text-white/60 text-sm mb-6 font-medium leading-relaxed">
            We've unlocked AI Mode, Offline Bible, and Unlimited Journaling for everyone. No gates, just vibes.
          </p>

          <div className="w-full h-px bg-white/10 mb-6"></div>

          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-4">Love di App?</p>
          <p className="text-white/50 text-xs mb-8">
            Your donations help keep the servers running and the wisdom flowing. Big up yuhself if yuh can support!
          </p>

          <button
            onClick={handleDonate}
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></div>
                <span>Loading Options...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">volunteer_activism</span>
                <span>Make a Donation</span>
              </>
            )}
          </button>

          <p className="text-white/20 text-[9px] mt-4 font-bold uppercase tracking-widest">Secured by App Store / Google Play</p>
        </div>

      </div>
    </div>
  );
};

export default PremiumUpgrade;
