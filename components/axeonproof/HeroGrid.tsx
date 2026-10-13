'use client';

// components/axeonproof/HeroGrid.tsx
// The hero background on /axeonproof: a dot grid that lights up around the
// pointer, so the page reads as a product screen rather than the glow the
// service pages use. Pure CSS variables moved by one pointer handler; on
// touch screens the light sits still near the headline.
import { useRef } from 'react';

export function HeroGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={onMove} aria-hidden className="absolute inset-0" style={{ ['--mx' as string]: '50%', ['--my' as string]: '30%' }}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(360px circle at var(--mx) var(--my), black 0%, rgba(0,0,0,0.35) 45%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(360px circle at var(--mx) var(--my), black 0%, rgba(0,0,0,0.35) 45%, transparent 75%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(520px circle at var(--mx) var(--my), rgba(37,99,235,0.28), transparent 70%)' }}
      />
    </div>
  );
}
