'use client';

// components/axeonproof/PageIntro.tsx
// The page's entrance: a dark curtain with the AxeonPROOF wordmark and a
// line resolving into a check, then the curtain lifts and the hero is
// there. Plays once per visit (sessionStorage), about 1.4 seconds, and never
// under reduced motion. The hero copy underneath staggers in on its own
// (app/axeonproof/page.tsx), so skipping the curtain still looks finished.
import { useEffect, useState } from 'react';
import { AxeonLogo } from '@/components/brand/AxeonLogo';

const KEY = 'axeon:proof-intro';

export function PageIntro() {
  // Rendered on the server already showing, so the hero never flashes before the curtain.
  const [stage, setStage] = useState<'show' | 'lift' | 'done'>('show');
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
    const a = window.setTimeout(() => setStage('lift'), 950);
    const b = window.setTimeout(() => setStage('done'), 1600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  if (stage === 'done') return null;
  return (
    <div aria-hidden className={`fixed inset-0 z-[9998] flex items-center justify-center bg-neutral-950 ${stage === 'lift' ? 'animate-proof-curtain' : ''}`}>
      <div className="animate-proof-pop flex flex-col items-center gap-5">
        <AxeonLogo product="PROOF" tone="light" size="lg" />
        <svg viewBox="0 0 160 24" className="h-6 w-40" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12 H118 l10 9 l24 -18" pathLength={1} strokeDasharray={1} className="animate-proof-draw" style={{ animationDuration: '0.8s', animationDelay: '150ms' }} />
        </svg>
      </div>
    </div>
  );
}
