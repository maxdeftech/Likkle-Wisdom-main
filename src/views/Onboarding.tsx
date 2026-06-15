import React, { useState } from 'react';

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [step, setStep] = useState(1);

  const next = () => {
    if (step < 3) setStep(step + 1);
    else onFinish();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex h-full flex-col justify-center items-center text-center px-6 pb-6 sm:px-8">
            <div className="relative mb-7 sm:mb-10 flex items-center justify-center">
              <div className="absolute h-44 w-44 sm:h-60 sm:w-60 bg-primary/20 rounded-full blur-3xl opacity-60"></div>
              <div className="relative h-36 w-36 sm:h-48 sm:w-48 animate-float" aria-hidden="true">
                <svg viewBox="0 0 220 220" className="h-full w-full drop-shadow-[0_0_42px_rgba(19,236,91,0.28)]">
                  <defs>
                    <clipPath id="jamaica-island-shape">
                      <path d="M20 112C43 91 71 84 101 88c25 3 48-3 71-13 13-6 27-1 31 12 4 15-5 30-21 38-18 9-36 13-56 12-27-1-50 9-73 22-18 10-39 4-45-13-4-12 0-25 12-34Z" />
                    </clipPath>
                  </defs>
                  <path d="M20 112C43 91 71 84 101 88c25 3 48-3 71-13 13-6 27-1 31 12 4 15-5 30-21 38-18 9-36 13-56 12-27-1-50 9-73 22-18 10-39 4-45-13-4-12 0-25 12-34Z" fill="#07120a" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <g clipPath="url(#jamaica-island-shape)">
                    <rect width="220" height="220" fill="#07120a" />
                    <path d="M0 0 220 220M220 0 0 220" stroke="#f4d125" strokeWidth="36" />
                    <path d="M0 0 220 220M220 0 0 220" stroke="#07120a" strokeWidth="16" />
                    <path d="M0 0 220 220M220 0 0 220" stroke="#13ec5b" strokeWidth="8" opacity="0.55" />
                  </g>
                  <path className="origin-center animate-pulse" d="M20 112C43 91 71 84 101 88c25 3 48-3 71-13 13-6 27-1 31 12 4 15-5 30-21 38-18 9-36 13-56 12-27-1-50 9-73 22-18 10-39 4-45-13-4-12 0-25 12-34Z" fill="none" stroke="#13ec5b" strokeWidth="2" />
                </svg>
                <span className="absolute -bottom-2 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-primary/25 blur-sm"></span>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 z-10">
              <div>
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none">Wa Gwan<span className="text-primary">!</span></h1>
                <p className="text-primary/60 text-xs font-bold uppercase tracking-[0.3em] mt-2">English: What's happening?</p>
              </div>
              <p className="text-white/80 text-lg sm:text-xl font-medium leading-snug sm:leading-relaxed max-w-[280px] mx-auto">
                Step into the heartbeat of Jamaica with daily Patois wisdom and vibes.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col h-full justify-center items-center text-center px-8 pt-10">
            <div className="glass rounded-[2.5rem] p-6 w-full max-w-[280px] aspect-square flex flex-col items-center justify-center relative overflow-hidden group mb-6 border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl">format_quote</span>
              </div>
              <span className="material-symbols-outlined text-primary text-6xl mb-4 animate-pulse-glow">translate</span>
              <p className="text-xl font-extrabold italic leading-tight mb-4">"Wi likkle but wi tallawah."</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-full backdrop-blur-sm">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Tap to reveal English meaning</span>
              </div>
            </div>
            <div className="space-y-3 pb-24">
              <h1 className="text-3xl font-black">Learn & Grow</h1>
              <p className="text-white/70 text-base leading-snug">Discover the deep meanings behind authentic island expressions.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col h-full justify-center items-center text-center px-8 pt-10">
            <div className="glass rounded-[2.5rem] p-6 w-full max-w-[280px] aspect-square flex flex-col items-center justify-center mb-6 border-white/5 shadow-2xl relative">
              <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-xl"></div>
              <div className="relative w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-4 border border-primary/20 animate-float">
                <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
              <div className="flex flex-col gap-1.5 w-24 opacity-30">
                <div className="h-1.5 w-full bg-white rounded-full"></div>
                <div className="h-1.5 w-4/5 bg-white rounded-full"></div>
                <div className="h-1.5 w-full bg-white rounded-full"></div>
              </div>
            </div>
            <div className="space-y-3 pb-24">
              <h1 className="text-3xl font-black">Write Your Journey</h1>
              <p className="text-white/70 text-base leading-snug">Reflect on your daily lessons in your personal <span className="text-primary font-bold italic">Likkle Book</span>.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-background-dark overflow-hidden font-display pt-safe text-white">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-5 sm:p-6 pt-safe mt-2">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="size-10 flex items-center justify-center rounded-full glass">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        ) : <div className="size-10"></div>}
        <div className="flex-1 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Step {step} of 3</span>
        </div>
        <button onClick={onFinish} className="size-10 flex items-center justify-center rounded-full glass">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {renderStep()}
      </div>

      <footer className="shrink-0 px-6 sm:px-8 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-3 z-50">
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(19,236,91,0.6)]' : 'w-1.5 bg-white/10'}`}></div>
          ))}
        </div>
        <button
          onClick={next}
          className="w-full h-[52px] rounded-2xl glass border-primary/20 text-primary font-black text-base hover:bg-primary hover:text-jamaican-gold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl"
        >
          <span>{step === 3 ? 'GET STARTED' : 'NEXT'}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </footer>
    </div>
  );
};

export default Onboarding;
