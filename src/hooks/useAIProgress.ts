import { useEffect, useRef, useState } from 'react';

export function useAIProgress(active: boolean, done: boolean): number {
  const [pct, setPct] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setPct(done ? 100 : 0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    if (done) {
      setPct(100);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    setPct(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPct(prev => {
        if (prev >= 92) return prev;
        const increment = prev < 40 ? 3.5 : prev < 70 ? 1.8 : 0.4;
        return Math.min(92, prev + increment + Math.random() * 1.2);
      });
    }, 180);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [active, done]);

  return Math.round(pct);
}
