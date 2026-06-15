
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface AuthProps {
  onAuthComplete: (user: User) => void;
}

type AuthMode = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset_sent';

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
          setResendTimer(120);
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
      .select('username, avatar_url, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      onAuthComplete({
        id: userId,
        username: profile.username || userEmail?.split('@')[0] || 'Seeker',
        avatarUrl: profile.avatar_url || undefined,
        isGuest: false,
        isAdmin: !!profile.is_admin
      });
      return;
    }

    // 2. Profile not found - attempt to create one manually
    console.warn("Manual creation needed for profile...");
    const fallbackUsername = userEmail?.split('@')[0] || 'Seeker';
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ id: userId, username: fallbackUsername })
      .select('username, avatar_url, is_admin')
      .maybeSingle();

    if (newProfile) {
      onAuthComplete({
        id: userId,
        username: newProfile.username || fallbackUsername,
        avatarUrl: newProfile.avatar_url || undefined,
        isGuest: false,
        isAdmin: !!newProfile.is_admin
      });
    } else {
      // 3. Absolute fallback if database creation fails
      onAuthComplete({
        id: userId,
        username: fallbackUsername,
        isGuest: false,
        isAdmin: false
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg({ title: 'EMAIL REQUIRED', message: 'Enter yuh email fi reset yuh password.' }); return; }
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!supabase) throw new Error('No connection');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setMode('reset_sent');
    } catch (err: any) {
      setErrorMsg({ title: 'ERROR', message: err.message || 'Could not send reset email.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!supabase || !email) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResendTimer(120); // 2 minute cooldown
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg({ title: 'RESEND FAILED', message: err.message || 'Could not resend code. Try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    onAuthComplete({ id: 'guest', username: 'Guest Seeker', isGuest: true });
  };

  const touristBenefits = [
    { icon: 'translate', title: 'Learn local phrases', body: 'Understand Jamaican Patois with plain English meaning beside every saying.' },
    { icon: 'travel_explore', title: 'Plan Jamaica smarter', body: 'Use travel tools for places, routes, budgets, and trip ideas before you touch down.' },
    { icon: 'offline_bolt', title: 'Keep wisdom close', body: 'Install the app and keep daily inspiration, notes, and saved favorites within reach.' },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full overflow-y-auto bg-white p-6 pb-12 pt-safe font-display transition-colors duration-300 dark:bg-background-dark lg:mx-auto lg:grid lg:max-w-[1240px] lg:grid-cols-[minmax(0,1fr)_400px] lg:items-stretch lg:gap-8 lg:p-8 xl:grid-cols-[minmax(0,720px)_420px]">
      <section className="relative hidden min-h-[calc(100dvh-4rem)] flex-1 overflow-hidden rounded-[2.5rem] border border-white/10 bg-background-dark p-10 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between" aria-label="Welcome to Likkle Wisdom">
        <div className="absolute inset-y-8 left-8 hidden w-[calc(50%-3rem)] rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-transparent to-jamaican-gold/20 blur-3xl lg:block" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">explore</span>
            Jamaica in yuh pocket
          </span>
          <h1 className="max-w-xl text-5xl font-black leading-[0.95] tracking-tight xl:text-6xl">
            Welcome to <span className="text-primary">Likkle Wisdom</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/65">
            Daily Jamaican wisdom, Patois translations, Bible notes, journal space, and travel tools built for locals, visitors, and culture lovers.
          </p>
        </div>

        <div className="relative z-10 grid max-w-3xl gap-4 xl:grid-cols-3">
          {touristBenefits.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
              <span className="material-symbols-outlined mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary" aria-hidden="true">{item.icon}</span>
              <h2 className="text-base font-black leading-tight">{item.title}</h2>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-white/55">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center lg:mx-0 lg:min-h-[calc(100dvh-4rem)] lg:max-w-none">
        <header className="py-10 text-center space-y-2 lg:py-0 lg:pb-8">
          <h1 className="text-4xl font-black tracking-tight leading-none text-slate-900 dark:text-white lg:text-3xl">
            {mode === 'signup' ? 'Join di' : 'Back to'} <br />
            <span className="text-primary">Likkle Wisdom</span>
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium uppercase tracking-widest">
            {mode === 'signup' ? 'Start yuh journey' : 'Resume yuh growth'}
          </p>
        </header>

      <div className="glass rounded-[2.5rem] p-6 shadow-2xl border-slate-200 dark:border-white/5 relative z-10 sm:p-8 lg:p-7 xl:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm font-black">warning</span>
              <span>{errorMsg.title}</span>
            </div>
            <p className="font-bold opacity-90 leading-relaxed uppercase">{errorMsg.message}</p>
          </div>
        )}

        {mode === 'reset_sent' ? (
          <div className="text-center space-y-6 py-4">
            <span className="material-symbols-outlined text-primary text-5xl">mark_email_read</span>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">CHECK YUH EMAIL</h3>
              <p className="text-slate-500 dark:text-white/60 text-xs leading-relaxed">
                Wi send a password reset link to <span className="text-primary font-bold">{email}</span>. Click di link fi set a new password.
              </p>
            </div>
            <button onClick={() => { setMode('signin'); setErrorMsg(null); }} className="w-full h-14 rounded-2xl glass text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
              BACK TO SIGN IN
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="text-center mb-2">
              <span className="material-symbols-outlined text-primary text-4xl mb-2">lock_reset</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Reset Password</h3>
              <p className="text-slate-500 dark:text-white/60 text-xs mt-1">Enter yuh email an wi send a reset link</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Email</label>
              <input type="email" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-14 px-5 text-slate-900 dark:text-white focus:border-primary/50 transition-all focus:ring-0" placeholder="example@island.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'SEND RESET LINK'}
            </button>
            <button type="button" onClick={() => { setMode('signin'); setErrorMsg(null); }} className="w-full text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              Back to Sign In
            </button>
          </form>
        ) : mode === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center mb-2">
              <span className="material-symbols-outlined text-primary text-4xl mb-2">mark_email_unread</span>
              <p className="text-slate-600 dark:text-white/60 text-xs">Code sent to <span className="text-primary font-bold">{email}</span></p>
            </div>
            <input
              type="text" maxLength={6}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-16 px-5 text-center text-3xl font-black tracking-[0.4em] text-primary focus:border-primary/50 transition-all focus:ring-0"
              placeholder="000000" value={otpToken} onChange={(e) => setOtpToken(e.target.value)} required
            />
            <button type="submit" disabled={loading || otpToken.length < 6} className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'VERIFY CODE'}
            </button>
            <div className="text-center pt-2">
              {resendTimer > 0 ? (
                <p className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">
                  Resend code in {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Nuh see di code?</p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-primary text-xs font-black uppercase tracking-widest hover:underline active:scale-95 transition-all"
                  >
                    {loading ? 'SENDING...' : 'RESEND VERIFICATION CODE'}
                  </button>
                </div>
              )}
            </div>
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
            {mode === 'signin' && (
              <div className="text-right">
                <button type="button" onClick={() => { setMode('forgot'); setErrorMsg(null); }} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                  Forgot Password?
                </button>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full h-16 rounded-2xl bg-primary text-background-dark font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span>{mode === 'signup' ? 'SIGN UP' : 'SIGN IN'}</span>}
            </button>
          </form>
        )}

        <div className="mt-8 text-center space-y-4">
          {(mode === 'signin' || mode === 'signup') && (
          <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setErrorMsg(null); }} className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
            {mode === 'signup' ? 'Already have an account? Sign In' : 'New here? Create account'}
          </button>
          )}
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
    </div>
  );
};

export default Auth;
