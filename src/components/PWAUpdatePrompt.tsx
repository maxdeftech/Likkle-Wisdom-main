import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registration?.update().catch((error) => {
        console.error('PWA update check failed:', error);
      });
    },
    onRegisterError(error) {
      console.error('PWA registration failed:', error);
    }
  });

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-description"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-background-dark/95 p-6 text-center shadow-2xl">
        <div className="absolute inset-0 jamaica-gradient opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-background-dark shadow-lg">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">system_update</span>
          </div>

          <h2 id="pwa-update-title" className="mb-2 text-xl font-black uppercase tracking-wide text-white">
            Update Available
          </h2>
          <p id="pwa-update-description" className="mb-6 text-xs font-medium leading-relaxed text-white/65">
            A fresh version of Likkle Wisdom is ready. Update now to get the latest sync and offline improvements.
          </p>

          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-background-dark shadow-lg transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
