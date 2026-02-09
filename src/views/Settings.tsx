
import React, { useState } from 'react';
import { User } from '../types';

interface SettingsProps {
  user: User;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
  onUpdateUser: (data: Partial<User>) => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, isDarkMode, onToggleTheme, onClose, onUpgrade, onSignOut, onUpdateUser, onOpenPrivacy, onOpenTerms }) => {
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(user.username);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleSaveUsername = () => {
    if (tempUsername.trim() && tempUsername !== user.username) {
      onUpdateUser({ username: tempUsername });
    }
    setEditingUsername(false);
  };

  const handleFeedbackRedirect = () => {
    setShowFeedbackModal(false);
    window.open('https://forms.gle/ekcvNBsacR6NYfCq9', '_blank');
  };

  return (
    <div className="fixed inset-0 z-overlay bg-white dark:bg-background-dark flex flex-col font-display overflow-y-auto pb-10 transition-colors duration-300">
      <header className="sticky top-0 z-sticky flex items-center glass backdrop-blur-md px-6 py-6 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onClose} aria-label="Go back" className="text-primary material-symbols-outlined text-3xl">chevron_left</button>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        </div>
        <div className="size-10 rounded-full overflow-hidden border-2 border-primary/30">
          <button aria-label="User Avatar">
            <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100`} alt="Avatar" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="glass rounded-xl p-5 border-jamaican-gold/30 bg-gradient-to-br from-jamaican-gold/10 to-transparent shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-jamaican-gold bg-jamaican-gold/20 px-2 py-1 rounded-full border border-jamaican-gold/30">
                {user.isPremium ? 'Premium Active' : 'Limited Offer'}
              </span>
              <h2 className="text-xl font-extrabold mt-2 text-slate-900 dark:text-white">
                {user.isPremium ? 'Yuh have di Full Wisdom' : 'Unlock Full Wisdom'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-white/70 mt-1">
                {user.isPremium ? 'All features unlocked.' : 'Get AI wisdom & offline access.'}
              </p>
            </div>
            <span className="material-symbols-outlined text-jamaican-gold text-4xl">
              {user.isPremium ? 'verified' : 'workspace_premium'}
            </span>
          </div>
          {!user.isPremium && (
            <button
              onClick={onUpgrade}
              className="w-full bg-jamaican-gold text-black font-black py-4 rounded-2xl flex justify-between px-5 items-center active:scale-95 transition-all shadow-xl"
            >
              <span>{user.isGuest ? 'Sign in to Upgrade' : 'Upgrade to Premium'}</span>
              <span className="bg-black/10 px-3 py-1 rounded-lg text-xs">$0.00 USD</span>
            </button>
          )}
        </div>

        <section>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-white/40 mb-3 px-2 uppercase">Account</h3>
          <div className="glass rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-md">
            <div className="p-4 flex flex-col gap-3">
              {editingUsername ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white h-12 focus:ring-1 focus:ring-primary"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleSaveUsername} className="bg-primary text-background-dark px-4 rounded-xl font-bold text-xs uppercase">Save</button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{user.username}</span>
                    <span className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-bold">{user.isGuest ? 'Guest User' : 'Standard Account'}</span>
                  </div>
                  <button onClick={() => setEditingUsername(true)} className="text-primary text-xs font-bold uppercase tracking-widest">Edit</button>
                </div>
              )}
            </div>
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 p-4 text-red-500 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-bold uppercase tracking-widest text-xs">Sign Out</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-white/40 mb-3 px-2 uppercase">Preferences</h3>
          <div className="glass rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-md">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-white/80">Appearance</span>
              </div>
              <button
                onClick={onToggleTheme}
                aria-label="Toggle dark mode"
                className={`h-7 w-12 rounded-full relative transition-all duration-300 flex items-center px-1 ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`size-5 bg-white rounded-full shadow-lg transition-transform duration-300 transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-white/40 mb-3 px-2 uppercase">Legal</h3>
          <div className="glass rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-md">
            <button
              onClick={onOpenPrivacy}
              className="w-full flex items-center justify-between p-4 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm opacity-60">policy</span>
                <span className="font-bold text-xs uppercase tracking-widest">Privacy Policy</span>
              </div>
              <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
            </button>
            <button
              onClick={onOpenTerms}
              className="w-full flex items-center justify-between p-4 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm opacity-60">gavel</span>
                <span className="font-bold text-xs uppercase tracking-widest">Terms & Conditions</span>
              </div>
              <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-white/40 mb-3 px-2 uppercase">Feedback</h3>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full glass rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-2xl">rate_review</span>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Send Feedback</h4>
                  <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">Help us improve Likkle Wisdom</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary opacity-60 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
          </button>
        </section>

        <div className="text-center mt-10 space-y-2">
          <p className="text-[9px] text-slate-300 dark:text-white/10 uppercase font-black tracking-[0.4em]">Likkle Wisdom v1.0.0 • Made with ❤️</p>
          <p className="text-[8px] text-primary/40 uppercase font-black tracking-[0.2em]">made by maxwell definitive technologies</p>
        </div>
      </div>

      {/* Feedback Confirmation Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-primary/20 bg-white dark:bg-background-dark animate-pop">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl">open_in_new</span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Open Feedback Form?</h3>
                <p className="text-sm text-slate-600 dark:text-white/70">
                  You'll be redirected to a Google Form to share your thoughts about Likkle Wisdom.
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackRedirect}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-primary text-background-dark hover:bg-primary/90 transition-colors active:scale-95 shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
