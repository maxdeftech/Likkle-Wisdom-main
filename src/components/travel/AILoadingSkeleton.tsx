import React from 'react';

const AILoadingSkeleton: React.FC = () => (
  <div className="space-y-3 animate-fade-in" aria-live="polite" aria-label="Generating response..." role="status">
    <div className="h-4 w-2/5 rounded-full bg-primary/20 shimmer" />
    <div className="h-3 w-full rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.08s' }} />
    <div className="h-3 w-[92%] rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.16s' }} />
    <div className="h-3 w-[85%] rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.24s' }} />
    <div className="mt-4 h-3.5 w-1/3 rounded-full bg-primary/15 shimmer" style={{ animationDelay: '0.32s' }} />
    <div className="h-3 w-[88%] rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.40s' }} />
    <div className="h-3 w-[76%] rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.48s' }} />
    <div className="h-3 w-[80%] rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.56s' }} />
    <div className="mt-4 h-3.5 w-2/5 rounded-full bg-primary/15 shimmer" style={{ animationDelay: '0.64s' }} />
    <div className="h-3 w-full rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.72s' }} />
    <div className="h-3 w-[90%] rounded-full bg-white/10 shimmer" style={{ animationDelay: '0.80s' }} />
    <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">auto_awesome</span>
      Generating your plan...
    </p>
  </div>
);

export default AILoadingSkeleton;
