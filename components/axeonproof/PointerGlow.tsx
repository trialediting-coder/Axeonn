'use client';

// components/axeonproof/PointerGlow.tsx
// The cursor effect on /axeonproof: three soft lights (cyan, blue, violet)
// that follow the pointer at different speeds, so the colours stretch apart
// while the cursor moves and blend back into one glow when it stops. Fixed
// to the viewport so no section edge clips them, additive (screen) over the
// black, under the content. Mouse and trackpad only; nothing on touch or
// under reduced motion.
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
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.35;
    const pos = LAYERS.map(() => ({ x, y }));
    let raf = 0;
    const tick = () => {
      raf = 0;
      let moving = false;
      LAYERS.forEach((l, i) => {
        const p = pos[i];
        p.x += (x - p.x) * l.ease;
        p.y += (y - p.y) * l.ease;
        const el = refs.current[i];
        if (el) el.style.transform = `translate(${p.x - l.size / 2}px, ${p.y - l.size / 2}px)`;
        if (Math.abs(x - p.x) > 0.4 || Math.abs(y - p.y) > 0.4) moving = true;
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      refs.current.forEach((el) => el && (el.style.opacity = '1'));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => refs.current.forEach((el) => el && (el.style.opacity = '0'));
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    tick();
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
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
