'use client';

// components/axeonproof/motion.tsx
// Small motion helpers for /axeonproof: a hook that says when something is on
// screen, a number that counts up once it is, and a wrapper that holds its
// children's CSS animations paused until they scroll into view. All of it
// respects prefers-reduced-motion (the keyframes are switched off in
// globals.css, and CountUp jumps straight to the final value).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts from 0 to `value` over about a second, once on screen. */
export function CountUp({ value, prefix = '', duration = 1100, delay = 0, className = '' }: { value: number; prefix?: string; duration?: number; delay?: number; className?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.1);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduced()) {
      setShown(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start - delay) / duration);
      const eased = p <= 0 ? 0 : 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, delay]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {shown.toLocaleString('en-US')}
    </span>
  );
}

/**
 * Children's CSS animations stay paused (globals.css `.proof-paused`) until the
 * wrapper is on screen, so a chart far down the page still grows when reached.
 */
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`${inView ? '' : 'proof-paused'} ${className}`}>
      {children}
    </div>
  );
}
