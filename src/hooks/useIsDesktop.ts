import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 1024;

/**
 * True when viewport width is >= 1024px (laptop/desktop). Use for layout and showing desktop UI.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', handler);
    handler();
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
