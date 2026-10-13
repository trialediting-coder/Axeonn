'use client';

// components/axeonproof/CustomCursor.tsx
// A product-page cursor for /axeonproof only: a small blue dot that tracks the
// pointer exactly, and a ring that eases after it and grows over anything you
// can click or drag. Only on devices with a fine pointer and hover; phones,
// keyboard users and reduced-motion never see it. The native cursor is hidden
// only inside the page (globals.css `.proof-cursor-page`).
import { useEffect, useRef, useState } from 'react';

const TARGETS = 'a, button, [role="tab"], [role="slider"], input, summary, [data-cursor]';

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    setOn(true);
    document.documentElement.classList.add('proof-cursor-page');
    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let big = false;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = (e.target as Element | null)?.closest?.(TARGETS);
      big = !!t;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      raf = 0;
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate(${rx}px, ${ry}px) scale(${big ? 1.8 : 1})`;
        ring.current.style.opacity = big ? '0.9' : '0.6';
      }
      if (Math.abs(x - rx) > 0.3 || Math.abs(y - ry) > 0.3) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      if (dot.current) dot.current.style.opacity = '0';
      if (ring.current) ring.current.style.opacity = '0';
    };
    const enter = () => {
      if (dot.current) dot.current.style.opacity = '1';
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
      document.documentElement.classList.remove('proof-cursor-page');
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  if (!on) return null;
  return (
    <>
      <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999] -ml-1 -mt-1 h-2 w-2 rounded-full bg-blue-600 mix-blend-difference" style={{ transform: 'translate(-100px, -100px)' }} />
      <div ref={ring} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999] -ml-4 -mt-4 h-8 w-8 rounded-full border-2 border-blue-500 transition-[opacity] duration-200" style={{ transform: 'translate(-100px, -100px)', opacity: 0 }} />
    </>
  );
}
