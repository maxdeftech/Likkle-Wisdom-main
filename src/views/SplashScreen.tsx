import React from 'react';

interface SplashScreenProps {
  progress: number;
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ progress, message }) => {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-zinc-950 p-8 font-sans overflow-hidden">
      <div className="h-12 w-full"></div>

      <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
        <div className="relative w-36 h-36 flex items-center justify-center rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl animate-float overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <img
            src="/icons/icon-512x512.png"
            alt="Likkle Wisdom"
            className="w-28 h-28 object-contain drop-shadow-[0_0_24px_rgba(19,236,91,0.35)]"
            draggable={false}
          />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Likkle Wisdom
          </h1>
          <p className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase">
            Daily Patois Affirmations
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center gap-6 pb-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-white text-lg font-bold tracking-tight px-4 leading-tight min-h-[3rem] flex items-center justify-center">
            {message && message.trim().length > 0 ? message : (progress < 100 ? 'A load up di wisdom...' : 'Wisdom ready now!')}
          </h3>
          <p className="text-white/30 text-xs italic">
            "Every mickle makes a muckle"
          </p>
        </div>

        <div className="w-full h-2.5 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-[#13ec5b] rounded-full shadow-[0_0_15px_rgba(19,236,91,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}
          ></div>
        </div>

        <div className="flex justify-between w-full px-1">
          <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest italic flex items-center">
            {progress < 100 ? 'Initializing...' : 'Ready'}
          </span>
          <span className="text-[#13ec5b] text-[10px] font-bold uppercase tracking-widest">{Math.round(progress || 0)}%</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
