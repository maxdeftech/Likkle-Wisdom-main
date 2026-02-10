import React from 'react';

interface SplashScreenProps {
  progress: number;
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ progress, message }) => {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-between bg-[#061a12] overflow-hidden p-8 font-display">
      <div className="h-12 w-full"></div>

      <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
        <div className="relative w-32 h-32 flex items-center justify-center rounded-3xl glass shadow-2xl animate-float">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
          <div className="relative flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-6xl animate-slow-spin" style={{ fontVariationSettings: "'FILL' 1" }}>
              sunny
            </span>
            <span className="material-symbols-outlined text-primary/80 text-4xl -mt-4" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
          </div>
          <div className="absolute inset-0 border-2 border-primary/20 rounded-3xl"></div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white" style={{ textShadow: '0 0 15px rgba(244, 209, 37, 0.4)' }}>
            Likkle Wisdom
          </h1>
          <p className="mt-2 text-white/60 text-sm font-medium tracking-widest uppercase">
            Daily Patois Affirmations
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center gap-6 pb-12">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-white text-lg font-semibold tracking-tight">
            {message || (progress < 100 ? 'A load up di wisdom...' : 'Wisdom ready now!')}
          </h3>
          <p className="text-white/40 text-xs italic">
            "Every mickle makes a muckle"
          </p>
        </div>
        <div className="w-full h-3 glass rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(19,236,91,0.6)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full px-1">
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
            {progress < 100 ? 'Initializing...' : 'Ready'}
          </span>
          <span className="text-primary text-[10px] font-bold uppercase tracking-widest">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;