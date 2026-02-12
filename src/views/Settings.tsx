import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { Capacitor } from '@capacitor/core';
import { initializePurchases, presentPaywall } from '../services/revenueCat';

const LIKKLE_WISDOM_WEBSITE = 'https://likklewisdom.com/';

interface SettingsProps {
  user: User;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
  onSignOut: () => void;
  onUpdateUser: (data: Partial<User>) => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, isDarkMode, onToggleTheme, onClose, onSignOut, onUpdateUser, onOpenPrivacy, onOpenTerms }) => {
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(user.username);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);

  // Notification preferences (from profiles)
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [quoteTime, setQuoteTime] = useState('08:00');
  const [verseTime, setVerseTime] = useState('12:00');
  const [wisdomTime, setWisdomTime] = useState('08:00');

  useEffect(() => {
    if (user.isGuest || !supabase) return;
    supabase.from('profiles').select('notify_messages, notify_quote_time, notify_verse_time, notify_wisdom_time').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setNotifyMessages(data.notify_messages !== false);
        setQuoteTime(data.notify_quote_time ? String(data.notify_quote_time).slice(0, 5) : '08:00');
        setVerseTime(data.notify_verse_time ? String(data.notify_verse_time).slice(0, 5) : '12:00');
        setWisdomTime(data.notify_wisdom_time ? String(data.notify_wisdom_time).slice(0, 5) : '08:00');
      }
    }).then(() => {}, () => {});
  }, [user.id, user.isGuest]);

  const saveNotificationPref = (field: string, value: boolean | string) => {
    if (!supabase || user.isGuest) return;
    const payload: Record<string, unknown> = { [field]: value };
    if (field !== 'notify_messages') payload.updated_at = new Date().toISOString();
    supabase.from('profiles').update(payload).eq('id', user.id).then(() => {}, () => {});
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'Passwords nuh match.' }); return; }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      if (!supabase) throw new Error('No connection');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Password updated! Walk good.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setShowChangePassword(false); setPasswordMsg(null); }, 2000);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

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

  const handleVisitWebsite = () => {
    window.open(LIKKLE_WISDOM_WEBSITE, '_blank');
  };

  const handleSupportLikkleWisdom = async () => {
    if (!Capacitor.isNativePlatform()) return;
    setSupportLoading(true);
    try {
      await initializePurchases();
      await presentPaywall();
    } catch (e) {
      console.warn('Support paywall:', e);
    } finally {
      setSupportLoading(false);
    }
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="fixed inset-0 z-overlay bg-white dark:bg-background-dark flex flex-col font-display overflow-y-auto pb-10 pt-safe transition-colors duration-300">
      <header className="sticky top-0 z-sticky flex items-center glass backdrop-blur-md px-6 py-4 justify-between">
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
        {/* Visit Likkle Wisdom + Support (same design as Home; Support only on iOS/Android, guests can use) */}
        <section>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-white/40 mb-3 px-2 uppercase">Likkle Wisdom</h3>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleVisitWebsite}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-jamaican-gold to-primary rounded-2xl p-[1px] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 block text-left"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors pointer-events-none" />
              <div className="relative bg-background-dark/95 dark:bg-background-dark/95 backdrop-blur-xl rounded-[15px] py-4 px-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-10 shrink-0 rounded-full bg-jamaican-gold/10 flex items-center justify-center text-jamaican-gold border border-jamaican-gold/20">
                    <span className="material-symbols-outlined text-xl">language</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-black text-sm uppercase tracking-wide">Visit Likkle Wisdom</h3>
                    <p className="text-white/50 text-[10px] font-bold tracking-wider">Check out di Likkle Wisdom link</p>
                  </div>
                </div>
                <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-white/50 text-lg group-hover:text-white group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                </div>
              </div>
            </button>

            {isNative && (
              <button
                type="button"
                onClick={handleSupportLikkleWisdom}
                disabled={supportLoading}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-jamaican-gold to-primary rounded-2xl p-[1px] shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 block text-left disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors pointer-events-none" />
                <div className="relative bg-background-dark/95 dark:bg-background-dark/95 backdrop-blur-xl rounded-[15px] py-4 px-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-10 shrink-0 rounded-full bg-jamaican-gold/10 flex items-center justify-center text-jamaican-gold border border-jamaican-gold/20">
                      <span className="material-symbols-outlined text-xl">volunteer_activism</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-black text-sm uppercase tracking-wide">Support Likkle Wisdom</h3>
                      <p className="text-white/50 text-[10px] font-bold tracking-wider">One-time or subscription via secure payment</p>
                    </div>
                  </div>
                  <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-white/50 text-lg group-hover:text-white group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                  </div>
                </div>
              </button>
            )}
          </div>
        </section>

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
            {!user.isGuest && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center gap-3 p-4 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">lock</span>
                <span className="font-bold uppercase tracking-widest text-xs">Change Password</span>
              </button>
            )}
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

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">visibility</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 dark:text-white/80">Discoverable</span>
                  <span className="text-[9px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wider">Show profile in search</span>
                </div>
              </div>
              <button
                onClick={() => onUpdateUser({ isPublic: !user.isPublic })}
                aria-label="Toggle public profile"
                className={`h-7 w-12 rounded-full relative transition-all duration-300 flex items-center px-1 ${user.isPublic !== false ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`size-5 bg-white rounded-full shadow-lg transition-transform duration-300 transform ${user.isPublic !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </section>

        {!user.isGuest && (
          <section>
            <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-white/40 mb-3 px-2 uppercase">Daily notifications</h3>
            <div className="glass rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-md">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">forum</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-white/80">Message notifications</span>
                </div>
                <button
                  onClick={() => {
                    setNotifyMessages(!notifyMessages);
                    saveNotificationPref('notify_messages', !notifyMessages);
                  }}
                  aria-label="Toggle message notifications"
                  className={`h-7 w-12 rounded-full relative transition-all duration-300 flex items-center px-1 ${notifyMessages ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <div className={`size-5 bg-white rounded-full shadow-lg transition-transform duration-300 transform ${notifyMessages ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Quote of the day</span>
                </div>
                <input
                  type="time"
                  value={quoteTime}
                  onChange={(e) => { setQuoteTime(e.target.value); saveNotificationPref('notify_quote_time', e.target.value); }}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border-0 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">menu_book</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Verse of the day</span>
                </div>
                <input
                  type="time"
                  value={verseTime}
                  onChange={(e) => { setVerseTime(e.target.value); saveNotificationPref('notify_verse_time', e.target.value); }}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border-0 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Wisdom of the day</span>
                </div>
                <input
                  type="time"
                  value={wisdomTime}
                  onChange={(e) => { setWisdomTime(e.target.value); saveNotificationPref('notify_wisdom_time', e.target.value); }}
                  className="w-full rounded-xl bg-slate-100 dark:bg-white/5 border-0 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </section>
        )}

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

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/10 bg-white dark:bg-background-dark animate-pop">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">lock</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h3>
                <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest font-bold">Set a new password</p>
              </div>
            </div>

            {passwordMsg && (
              <div className={`mb-4 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider ${passwordMsg.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {passwordMsg.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-1">New Password</label>
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-12 px-4 text-slate-900 dark:text-white focus:border-primary/50 transition-all focus:ring-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-1">Confirm Password</label>
                <input
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-12 px-4 text-slate-900 dark:text-white focus:border-primary/50 transition-all focus:ring-0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowChangePassword(false); setPasswordMsg(null); setNewPassword(''); setConfirmPassword(''); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-background-dark active:scale-95 transition-all shadow-lg disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
