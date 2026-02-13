import React from 'react';

const APP_FEATURES = [
  { icon: 'home', label: 'Home', desc: 'Daily quotes, verse, an wisdom' },
  { icon: 'explore', label: 'Discover', desc: 'Search categories, Jamaican History, iconic wisdom' },
  { icon: 'menu_book', label: 'Bible', desc: 'KJV & Patois, bookmark verses' },
  { icon: 'book', label: 'Likkle Book', desc: 'Private encrypted journal' },
  { icon: 'person', label: 'Me', desc: 'Profile, Cabinet (saved wisdom), My Wisdom' },
  { icon: 'auto_awesome', label: 'AI Wisdom', desc: 'Brew custom wisdom from Home' },
] as const;

interface AppGuideContentProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  showSettingsButton?: boolean;
  onOpenSettings?: () => void;
  variant?: 'modal' | 'page';
}

export const AppGuideContent: React.FC<AppGuideContentProps> = ({
  onOpenPrivacy,
  onOpenTerms,
  showSettingsButton = false,
  onOpenSettings,
  variant = 'modal',
}) => {
  const isPage = variant === 'page';

  return (
    <div className={`min-w-0 ${isPage ? 'pb-24 space-y-6 sm:space-y-8' : 'p-4 sm:p-6 space-y-6'}`}>
      {!isPage && (
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed break-words">
          Yuh daily dose of Jamaican culture, wisdom, and inspiration. Here’s where everyting deh an how fi stay inna di loop.
        </p>
      )}

      {/* What's in di app — responsive, no overlap */}
      <section className="glass rounded-2xl p-4 sm:p-5 border border-white/10 min-w-0 overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-base sm:text-lg shrink-0">auto_awesome</span>
          <span className="break-words">What’s in di app</span>
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {APP_FEATURES.map(({ icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 sm:gap-4 py-2 border-b border-white/5 last:border-b-0 last:pb-0 first:pt-0 min-w-0"
            >
              <div className="size-9 sm:size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-lg sm:text-xl">{icon}</span>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm break-words">{label}</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs mt-0.5 break-words">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4 sm:p-5 border border-white/10 min-w-0 overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-widest text-jamaican-gold mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-base sm:text-lg shrink-0">notifications</span>
          <span className="break-words">Updates & news</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-2 break-words leading-relaxed">
          Check di <strong className="text-slate-800 dark:text-white">Alerts</strong> bell on Home fi official announcements. Visit our website an follow di app fi new features an updates.
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 break-words">
          Website: <strong>likklewisdom.com</strong> · Maxwell Definitive Technologies
        </p>
      </section>

      <section className="glass rounded-2xl p-4 sm:p-5 border border-white/10 min-w-0 overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-base sm:text-lg shrink-0">gavel</span>
          <span className="break-words">Legal & feedback</span>
        </h3>
        {(onOpenPrivacy || onOpenTerms) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {onOpenPrivacy && (
              <button
                onClick={onOpenPrivacy}
                className="px-3 sm:px-4 py-2 rounded-xl glass text-[11px] sm:text-xs font-bold text-slate-700 dark:text-white/80 hover:bg-white/10 transition-colors active:scale-95 shrink-0"
              >
                Privacy Policy
              </button>
            )}
            {onOpenTerms && (
              <button
                onClick={onOpenTerms}
                className="px-3 sm:px-4 py-2 rounded-xl glass text-[11px] sm:text-xs font-bold text-slate-700 dark:text-white/80 hover:bg-white/10 transition-colors active:scale-95 shrink-0"
              >
                Terms of Service
              </button>
            )}
          </div>
        )}
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 break-words leading-relaxed">
          Found a bug or want fi send feedback? Go to <strong className="text-slate-800 dark:text-white">Profile → Settings → Send Feedback</strong>.
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 break-words leading-relaxed mt-2">
          Need help? Reach out to <a href="mailto:info@likklewisdom.com" className="text-primary font-bold underline underline-offset-1 hover:opacity-90">info@likklewisdom.com</a>.
        </p>
      </section>

      <section className="glass rounded-2xl p-4 sm:p-5 border border-primary/20 bg-primary/5 min-w-0 overflow-hidden">
        <p className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider break-words">
          Developed with ❤️ by <strong className="text-slate-800 dark:text-white">Maxwell Definitive Technologies</strong>
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 break-words">
          Design, technology & intelligent solutions · One Love
        </p>
      </section>

      {showSettingsButton && onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="w-full py-3 sm:py-4 rounded-2xl glass border border-white/10 text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white/90 hover:bg-white/10 transition-colors active:scale-[0.99] flex items-center justify-center gap-2 min-w-0"
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          Open Settings
        </button>
      )}
    </div>
  );
};
