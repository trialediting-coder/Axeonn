'use client';

// components/axeonproof/PointerGlow.tsx
// The cursor effect on /axeonproof: a soft blue light that follows the pointer
// across the whole black page, easing behind it, fixed to the viewport so no
// section edge clips it. Sits under the content (negative z inside the page's
// own stacking context) and over the black. Mouse and trackpad devices only;
// nothing on touch or under reduced motion.
import { useEffect, useRef, useState } from 'react';

export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setOn(true);
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.35;
    let gx = x;
    let gy = y;
    let raf = 0;
    const tick = () => {
      raf = 0;
      gx += (x - gx) * 0.12;
      gy += (y - gy) * 0.12;
      if (ref.current) ref.current.style.transform = `translate(${gx - 350}px, ${gy - 350}px)`;
      if (Math.abs(x - gx) > 0.5 || Math.abs(y - gy) > 0.5) raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (ref.current) ref.current.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      if (ref.current) ref.current.style.opacity = '0';
    };
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
      <div
        ref={ref}
        className="absolute left-0 top-0 h-[700px] w-[700px] rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.38) 0%, rgba(37,99,235,0.14) 35%, transparent 68%)',
          filter: 'blur(28px)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
