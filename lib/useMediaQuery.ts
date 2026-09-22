'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether `query` currently matches, or `null` before hydration so
 * callers can avoid rendering viewport-specific media (e.g. autoplay video)
 * until the real viewport is known.
 */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/** Tailwind `sm` breakpoint is 640px; anything narrower is treated as a phone. */
export function useIsMobile(): boolean | null {
  return useMediaQuery('(max-width: 639px)');
}
