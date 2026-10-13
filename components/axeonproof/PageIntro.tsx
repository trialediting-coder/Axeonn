'use client';

// components/axeonproof/PageIntro.tsx
// The page's entrance, cinematic: the AxeonPROOF wordmark pushes in slowly
// on black, then the whole frame zooms out and fades, and the hero settles
// in from a slight zoom of its own (app/axeonproof/page.tsx). Plays once per visit (sessionStorage), about 1.4 seconds, and never
// under reduced motion. The hero copy underneath staggers in on its own
// (app/axeonproof/page.tsx), so skipping the curtain still looks finished.
import { useEffect, useState } from 'react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';

const KEY = 'axeon:proof-intro';

export function PageIntro() {
  // Rendered on the server already showing, so the hero never flashes before the curtain.
  const [stage, setStage] = useState<'show' | 'out' | 'done'>('show');
  useEffect(() => {
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
    const a = window.setTimeout(() => setStage('out'), 900);
    const b = window.setTimeout(() => setStage('done'), 1550);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  if (stage === 'done') return null;
  return (
    <div aria-hidden className={`fixed inset-0 z-[9998] flex items-center justify-center bg-neutral-950 ${stage === 'out' ? 'animate-proof-zoom-out' : ''}`}>
      <div className="animate-proof-zoom-in">
        <AxeonLogo product="PROOF" tone="light" size="lg" />
      </div>
    </div>
  );
}
