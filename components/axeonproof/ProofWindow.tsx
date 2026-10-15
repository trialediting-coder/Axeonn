'use client';

// components/axeonproof/ProofWindow.tsx
// The hero of /axeonproof: the example business's full Overview inside a browser window.
// The window starts tilted back and stands up as the page scrolls, and the
// dashboard inside pans slowly down the page by itself until the visitor takes
// over (wheel, touch or keyboard). Reduced motion: flat and still.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MousePointer2 } from 'lucide-react';
import { LiveFeed } from '@/components/axeonproof/LiveFeed';

export function ProofWindow({ children, caption }: { children: ReactNode; caption: string }) {
  const figureRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [flat, setFlat] = useState(0);
  const [driving, setDriving] = useState(false);

  // Tilt: 0 at the start, 1 (flat) once the window has risen to the middle of the screen.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFlat(1);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = figureRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const vh = window.innerHeight;
      setFlat(Math.min(1, Math.max(0, 1 - (top - vh * 0.12) / (vh * 0.45))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Slow pan down the dashboard while it is on screen, until the visitor takes over.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let visible = false;
    let taken = false;
    let dir = 1;
    let last = 0;
    const step = (t: number) => {
      raf = 0;
      if (!visible || taken) return;
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0) {
        el.scrollTop += dir * dt * 0.035;
        if (el.scrollTop >= max - 1) dir = -1;
        if (el.scrollTop <= 1) dir = 1;
      }
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (!raf && visible && !taken) {
        last = 0;
        raf = requestAnimationFrame(step);
      }
    };
    const takeOver = () => {
      taken = true;
      setDriving(true);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    const opts: AddEventListenerOptions = { passive: true };
    el.addEventListener('wheel', takeOver, opts);
    el.addEventListener('touchstart', takeOver, opts);
    el.addEventListener('pointerdown', takeOver, opts);
    el.addEventListener('keydown', takeOver);
    return () => {
      io.disconnect();
      el.removeEventListener('wheel', takeOver);
      el.removeEventListener('touchstart', takeOver);
      el.removeEventListener('pointerdown', takeOver);
      el.removeEventListener('keydown', takeOver);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const tilt = 14 * (1 - flat);

  return (
    <figure ref={figureRef} className="mx-auto w-full max-w-6xl proof-hero-stagger animate-proof-rise" style={{ perspective: '1800px', animationDelay: '3500ms', animationDuration: '0.9s' }}>
      {/* Glass bezel around the window, so it reads as a device floating over the flow. */}
      <div
        className="rounded-[22px] bg-white/[0.06] p-1.5 shadow-[0_50px_140px_-30px_rgba(37,99,235,0.45)] ring-1 ring-white/15 backdrop-blur-md sm:rounded-[28px] sm:p-2.5"
        style={{
          transform: `rotateX(${tilt.toFixed(2)}deg) scale(${(0.94 + 0.06 * flat).toFixed(3)})`,
          transformOrigin: '50% 0%',
          transition: 'transform 90ms linear',
          willChange: 'transform',
        }}
      >
      <div className="overflow-hidden rounded-2xl bg-[#f3f4f7] ring-1 ring-black/20 sm:rounded-[20px]">
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          </span>
          <span className="mx-auto flex h-7 w-full max-w-xs items-center justify-center rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-500 sm:text-xs">
            app.axeonstudio.co
          </span>
          <span className="hidden w-16 sm:block" aria-hidden />
        </div>
        <div className="relative">
          <LiveFeed />
          <div
            ref={scrollerRef}
            tabIndex={0}
            aria-label="Scroll the dashboard"
            className="proof-window-scroller relative h-[520px] w-full overflow-y-auto overscroll-contain focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:h-[600px] lg:h-[660px]"
          >
            {children}
          </div>
          {!driving ? (
            <p className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 rounded-full bg-neutral-950/80 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur sm:flex">
              <MousePointer2 size={12} /> Scroll inside
            </p>
          ) : null}
        </div>
      </div>
      </div>
      <figcaption className="mt-5 text-center text-xs leading-relaxed text-neutral-500 sm:text-sm">{caption}</figcaption>
    </figure>
  );
}
