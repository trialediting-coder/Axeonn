'use client';

// components/axeonproof/VerticalSwitcher.tsx
// Under the hero dashboard: the same AxeonPROOF counter for each vertical we
// serve (dental, med spa, law, accounting). Each tab shows a fictional demo
// business and three example events from data/proofPage.ts (VERTICAL_DEMOS),
// labelled as a demo. Never a client's results.
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { VERTICAL_DEMOS } from '@/data/proofPage';
import { GLASS, LABEL } from '@/components/axeonproof/ui';

export function VerticalSwitcher() {
  const [key, setKey] = useState(VERTICAL_DEMOS[0].key);
  const demo = VERTICAL_DEMOS.find((d) => d.key === key) ?? VERTICAL_DEMOS[0];
  return (
    <div className={`mx-auto mt-8 max-w-4xl rounded-3xl p-5 text-left sm:p-7 ${GLASS}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={LABEL}>Same dashboard, every practice and firm</p>
          <p className="mt-1.5 text-sm text-neutral-300">See what the counter logs for each kind of office.</p>
        </div>
        <div role="tablist" aria-label="Demo business type" className="flex flex-wrap gap-2">
          {VERTICAL_DEMOS.map((d) => (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={d.key === key}
              onClick={() => setKey(d.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition-colors sm:text-sm ${
                d.key === key ? 'bg-blue-600 text-white ring-blue-500' : 'bg-white/[0.04] text-neutral-200 ring-white/15 hover:bg-white/10'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="mt-5">
        <p className="text-sm font-semibold text-white">
          {demo.name} <span className="font-normal text-neutral-400">· Demo, a fictional business</span>
        </p>
        <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
          {demo.events.map((e) => (
            <li key={e.when} className="grid gap-1 py-3 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <span className="font-mono text-xs text-neutral-400">{e.when}</span>
              <span className="text-neutral-200">{e.what}</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-blue-300">
                <ArrowRight size={13} aria-hidden />
                {e.result}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-400">
          Example events, not a client&apos;s results. Booked {demo.booking} count toward the same recovered-inquiry counter.
        </p>
      </div>
    </div>
  );
}
