import React from 'react';
import { AppGuideContent } from './AppGuideContent';

interface WelcomeModalProps {
  onClose: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenSettings: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onOpenPrivacy, onOpenTerms, onOpenSettings }) => {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center safe-padding-min animate-fade-in box-border"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-desc"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg max-h-[min(90vh,90dvh)] overflow-y-auto overflow-x-hidden rounded-[2rem] border border-white/15 shadow-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl animate-pop flex flex-col min-h-0">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 border-b border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-10 sm:size-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">wb_sunny</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="welcome-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                Welcome to Likkle Wisdom
              </h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">One Love 🇯🇲</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-xl glass flex items-center justify-center text-slate-600 dark:text-white/70 hover:bg-white/10 transition-all active:scale-95 shrink-0"
            aria-label="Close welcome"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div id="welcome-desc" className="min-w-0 flex-1">
          <AppGuideContent
            onOpenPrivacy={() => { onOpenPrivacy(); onClose(); }}
            onOpenTerms={() => { onOpenTerms(); onClose(); }}
            showSettingsButton
            onOpenSettings={() => { onOpenSettings(); onClose(); }}
            variant="modal"
          />
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black text-sm uppercase tracking-widest shadow-lg active:scale-[0.99] transition-transform"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
