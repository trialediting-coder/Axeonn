'use client';

// components/axeonproof/PageIntro.tsx
// The page's entrance, built from the Axeon mark: the two bars rise, the dot
// lands, "Axeon" slides in, then "PROOF" punches in from behind it. Then the
// camera flies through the lockup, slow at first then fast, out of frame
// while the black holds, the black clears, and the page is
// there, settling in from a slight zoom of its own (app/axeonproof/page.tsx). Once per session, never
// under reduced motion. Rendered on the server already showing, so the hero
// never flashes before it.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const KEY = 'axeon:proof-intro';
const d = (ms: number) => ({ animationDelay: `${ms}ms` });

export function PageIntro() {
  const [stage, setStage] = useState<'show' | 'out' | 'done'>('show');
  // Inline for the server paint, then moved to <body> so it sits above the site header too.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
    } catch {}
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('proof-no-intro');
      setStage('done');
      return;
    }
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {}
    const a = window.setTimeout(() => setStage('out'), 1750);
    const b = window.setTimeout(() => setStage('done'), 3200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  if (stage === 'done') return null;
  const node = (
    <div aria-hidden className={`fixed inset-0 z-[9998] flex items-center justify-center bg-neutral-950 ${stage === 'out' ? 'animate-proof-backdrop' : ''}`}>
      <div className={`flex items-center gap-4 ${stage === 'out' ? 'animate-proof-fly' : ''}`}>
        <svg viewBox="0 0 24 20" fill="currentColor" className="h-9 w-auto text-blue-600 sm:h-12">
          <polygon points="6,0 2,20 6,20 10,0" className="animate-proof-grow [transform-box:fill-box] [transform-origin:bottom]" style={d(100)} />
          <polygon points="14,0 10,20 14,20 18,0" className="animate-proof-grow [transform-box:fill-box] [transform-origin:bottom]" style={d(280)} />
          <circle cx="21" cy="18" r="2" className="animate-proof-pop [transform-box:fill-box] [transform-origin:center]" style={d(520)} />
        </svg>
        <span className="flex items-baseline overflow-hidden text-4xl font-extrabold leading-none tracking-tight text-white sm:text-6xl">
          <span className="relative z-10 inline-block animate-proof-nudge" style={d(1080)}>
            <span className="inline-block animate-proof-slide bg-neutral-950" style={d(650)}>
              Axeon
            </span>
          </span>
          <span className="inline-block animate-proof-punch font-black tracking-[0.02em] text-blue-500" style={d(1000)}>
            PROOF
          </span>
        </span>
      </div>
    </div>
  );
  return mounted ? createPortal(node, document.body) : node;
}
