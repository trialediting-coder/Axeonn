'use client';

// components/axeonproof/ProofWindow.tsx
// The hero of /axeonproof: the example business's full Overview inside a browser window.
// The window starts tilted back and stands up as the page scrolls, and the
// dashboard inside pans slowly down the page by itself until the visitor takes
// over (wheel, touch or keyboard). Reduced motion: flat and still.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MousePointer2 } from 'lucide-react';

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
    <figure ref={figureRef} className="hero-rise mx-auto w-full max-w-6xl" style={{ perspective: '1800px' }}>
      <div
        className="overflow-hidden rounded-2xl bg-[#f3f4f7] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/15 sm:rounded-[20px]"
        style={{
          transform: `rotateX(${tilt.toFixed(2)}deg) scale(${(0.94 + 0.06 * flat).toFixed(3)})`,
          transformOrigin: '50% 0%',
          transition: 'transform 90ms linear',
          willChange: 'transform',
        }}
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          </span>
          <span className="mx-auto flex h-7 w-full max-w-xs items-center justify-center rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-500 sm:text-xs">
            app.axeonstudio.co
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <div className="relative">
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
      <figcaption className="mt-5 text-center text-xs leading-relaxed text-neutral-400 sm:text-sm">{caption}</figcaption>
    </figure>
  );
}
