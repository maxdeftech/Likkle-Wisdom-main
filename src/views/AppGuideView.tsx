import React from 'react';
import { AppGuideContent } from '../components/AppGuideContent';

interface AppGuideViewProps {
  onClose: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

const AppGuideView: React.FC<AppGuideViewProps> = ({ onClose, onOpenPrivacy, onOpenTerms }) => {
  return (
    <div
      className="fixed inset-0 z-overlay bg-white dark:bg-background-dark flex flex-col font-display overflow-hidden animate-fade-in min-h-[100dvh] min-h-screen"
      style={{ minHeight: '100dvh' }}
      role="article"
      aria-label="App guide"
    >
      <header className="sticky top-0 z-sticky flex items-center gap-3 pt-safe pl-safe pr-safe pb-4 px-4 sm:px-6 glass backdrop-blur-md border-b border-white/5 shrink-0">
        <button
          onClick={onClose}
          aria-label="Back to Settings"
          className="size-12 rounded-2xl flex items-center justify-center text-primary hover:bg-primary/10 transition-colors active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-2xl sm:text-3xl">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">
            App guide
          </h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest truncate">
            Likkle Wisdom · Where everyting deh
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 px-safe-min pb-safe">
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pb-4 break-words">
              Yuh daily dose of Jamaican culture, wisdom, and inspiration. Here’s where everyting deh an how fi stay inna di loop.
            </p>
            <AppGuideContent
              variant="page"
              onOpenPrivacy={onOpenPrivacy}
              onOpenTerms={onOpenTerms}
              showSettingsButton={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppGuideView;
