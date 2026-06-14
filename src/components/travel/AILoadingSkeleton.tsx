import React from 'react';

interface AILoadingSkeletonProps {
  progress?: number;
}

const AILoadingSkeleton: React.FC<AILoadingSkeletonProps> = ({ progress = 0 }) => (
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
    <div className="mt-5 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">auto_awesome</span>
          Generating your plan...
        </p>
        <span className="text-[10px] font-black tabular-nums text-primary">{progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  </div>
);

export default AILoadingSkeleton;
