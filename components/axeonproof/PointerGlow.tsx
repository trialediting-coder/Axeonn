'use client';

// components/axeonproof/PointerGlow.tsx
// The cursor effect on /axeonproof: three soft lights (cyan, blue, violet)
// that follow the pointer at different speeds, so the colours stretch apart
// while the cursor moves and blend back into one glow when it stops. Fixed
// to the viewport so no section edge clips them, additive (screen) over the
// black, under the content. Mouse and trackpad only; nothing on touch or
// under reduced motion. The listeners attach after the lights render, the
// lights start on the pointer, and the easing is time-based.
import { useEffect, useRef, useState } from 'react';

const LAYERS = [
  { color: 'rgba(34,211,238,0.52)', size: 420, ease: 0.22 },   // cyan, quick
  { color: 'rgba(37,99,235,0.46)', size: 640, ease: 0.11 },    // blue, the body
  { color: 'rgba(139,92,246,0.5)', size: 560, ease: 0.055 },  // violet, trailing
];

export function PointerGlow() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setOn(true);
  }, []);
  useEffect(() => {
    if (!on) return;
    let x = 0;
    let y = 0;
    let shown = false;
    const pos = LAYERS.map(() => ({ x: 0, y: 0 }));
    let raf = 0;
    let last = 0;
    const place = (i: number) => {
      const el = refs.current[i];
      const l = LAYERS[i];
      if (el) el.style.transform = `translate3d(${pos[i].x - l.size / 2}px, ${pos[i].y - l.size / 2}px, 0)`;
    };
    // Time-based easing: each layer's `ease` is its catch-up per 60 Hz frame,
    // so the trail looks the same on 60, 120 or 144 Hz screens and never
    // crawls when the browser drops frames.
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(now - (last || now - 16.7), 100);
      last = now;
      let moving = false;
      LAYERS.forEach((l, i) => {
        const p = pos[i];
        const k = 1 - Math.pow(1 - l.ease, dt / 16.7);
        p.x += (x - p.x) * k;
        p.y += (y - p.y) * k;
        place(i);
        if (Math.abs(x - p.x) > 0.4 || Math.abs(y - p.y) > 0.4) moving = true;
      });
      if (moving) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const setOpacity = (v: string) => refs.current.forEach((el) => el && (el.style.opacity = v));
    const move = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        // First move, or back from outside the window: start the lights on
        // the pointer instead of flying in from where they were left.
        pos.forEach((p, i) => {
          p.x = x;
          p.y = y;
          place(i);
        });
        shown = true;
        setOpacity('1');
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      shown = false;
      setOpacity('0');
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) leave();
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', out);
    window.addEventListener('blur', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', out);
      window.removeEventListener('blur', leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [on]);
  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {LAYERS.map((l, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute left-0 top-0 rounded-full opacity-0 mix-blend-screen transition-opacity duration-500"
          style={{
            width: l.size,
            height: l.size,
            background: `radial-gradient(circle, ${l.color} 0%, transparent 65%)`,
            filter: 'blur(26px)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}
