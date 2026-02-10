
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface AuthProps {
  onAuthComplete: (user: User) => void;
}

type AuthMode = 'signin' | 'signup' | 'verify';

const Auth: React.FC<AuthProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ title: string, message: string } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!supabase) {
      setErrorMsg({ title: 'BACKEND ERROR', message: 'Connection to Supabase failed.' });
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) throw error;
        if (data?.session) {
          await fetchProfileAndComplete(data.session.user.id, data.session.user.email);
        } else {
          setMode('verify');
          setResendTimer(60);
        }
      } else if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMsg({
              title: 'NUH ACCOUNT DEH DEH',
              message: "We couldn't find an account with this email. If you're new, please sign up or join as a guest!"
            });
            setLoading(false);
            return;
          }
          throw error;
        }
        if (data.user) await fetchProfileAndComplete(data.user.id, data.user.email);
      }
    } catch (err: any) {
      setErrorMsg({ title: 'ERROR', message: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!supabase) return;
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpToken, type: 'signup' });
      if (error) throw error;
      if (data.user) await fetchProfileAndComplete(data.user.id, data.user.email);
    } catch (err: any) {
      setErrorMsg({ title: 'INVALID CODE', message: 'Code nuh valid or it expire.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileAndComplete = async (userId: string, userEmail?: string) => {
    if (!supabase) return;

    // 1. Try to fetch existing profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, is_premium, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      onAuthComplete({
        id: userId,
        username: profile.username || userEmail?.split('@')[0] || 'Seeker',
        avatarUrl: profile.avatar_url || undefined,
        isGuest: false,
        isPremium: !!profile.is_premium
      });
      return;
    }

    // 2. Profile not found - attempt to create one manually
    console.warn("Manual creation needed for profile...");
    const fallbackUsername = userEmail?.split('@')[0] || 'Seeker';
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ id: userId, username: fallbackUsername })
      .select('username, is_premium, avatar_url')
      .maybeSingle();

    if (newProfile) {
      onAuthComplete({
        id: userId,
        username: newProfile.username || fallbackUsername,
        avatarUrl: newProfile.avatar_url || undefined,
        isGuest: false,
        isPremium: !!newProfile.is_premium
      });
    } else {
      // 3. Absolute fallback if database creation fails
      onAuthComplete({
        id: userId,
        username: fallbackUsername,
        isGuest: false,
        isPremium: false
      });
    }
  };

  const handleGuest = () => {
    onAuthComplete({ id: 'guest', username: 'Guest Seeker', isGuest: true, isPremium: false });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-background-dark overflow-y-auto font-display p-6 pb-12 transition-colors duration-300">
      <header className="py-12 text-center space-y-2 relative z-10">
        <h1 className="text-4xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
          {mode === 'signup' ? 'Join di' : 'Back to'} <br />
          <span className="text-primary">Likkle Wisdom</span>
        </h1>
        <p className="text-slate-500 dark:text-white/40 text-sm font-medium uppercase tracking-widest">
          {mode === 'signup' ? 'Start yuh journey' : 'Resume yuh growth'}
        </p>
      </header>

      <div className="glass rounded-[2.5rem] p-8 shadow-2xl border-slate-200 dark:border-white/5 relative z-10">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm font-black">warning</span>
              <span>{errorMsg.title}</span>
            </div>
            <p className="font-bold opacity-90 leading-relaxed uppercase">{errorMsg.message}</p>
          </div>
        )}

        {mode === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-6">
            <p className="text-slate-600 dark:text-white/60 text-center text-xs mb-4">Code sent to <span className="text-primary font-bold">{email}</span></p>
            <input
              type="text" maxLength={6}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-16 px-5 text-center text-3xl font-black tracking-[0.4em] text-primary focus:border-primary/50 transition-all focus:ring-0"
              placeholder="000000" value={otpToken} onChange={(e) => setOtpToken(e.target.value)} required
            />
            <button type="submit" disabled={loading || otpToken.length < 6} className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'VERIFY CODE'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Username</label>
                <input type="text" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-14 px-5 text-slate-900 dark:text-white focus:border-primary/50 transition-all focus:ring-0" placeholder="yuh_name" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Email</label>
              <input type="email" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-14 px-5 text-slate-900 dark:text-white focus:border-primary/50 transition-all focus:ring-0" placeholder="example@island.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Password</label>
              <input type="password" minLength={6} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-14 px-5 text-slate-900 dark:text-white focus:border-primary/50 transition-all focus:ring-0" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span>{mode === 'signup' ? 'SIGN UP' : 'SIGN IN'}</span>}
            </button>
          </form>
        )}

        <div className="mt-8 text-center space-y-4">
          <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setErrorMsg(null); }} className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
            {mode === 'signup' ? 'Already have an account? Sign In' : 'New here? Create account'}
          </button>
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100 dark:bg-white/10"></div>
            <span className="text-[9px] font-black text-slate-300 dark:text-white/20 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-white/10"></div>
          </div>
          <button onClick={handleGuest} className="w-full h-14 rounded-2xl glass border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-[10px] tracking-widest hover:bg-primary/5 active:scale-95 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">person_outline</span> CONTINUE AS GUEST
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
