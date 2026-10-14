'use client';

// components/axeonproof/ProofHotspots.tsx
// The analytics cards from the Overview, live, with a note that follows the
// card under the pointer (or the one tapped). The same notes are listed beside
// the grid so nothing depends on hovering.
import { useState } from 'react';
import { CARD_NOTES, CARD_ORDER } from '@/data/proofPage';
import { AnalyticsCards } from '@/components/axeonproof/screens';
import { Reveal } from '@/components/axeonproof/motion';

export function ProofHotspots() {
  const [active, setActive] = useState<string>(CARD_ORDER[0]);
  const note = CARD_NOTES[active];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-10">
      <Reveal className="@container rounded-2xl bg-[#f3f4f7] p-3 shadow-[0_40px_120px_-30px_rgba(37,99,235,0.3)] ring-1 ring-white/10 sm:p-4">
        <div className="-mt-4">
          <AnalyticsCards active={active} onActive={setActive} />
        </div>
      </Reveal>
      <div className="lg:pt-2">
        <div key={active} className="animate-proof-rise rounded-2xl bg-blue-600 p-6 text-white">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-blue-100">[ {note.title} ]</p>
          <p className="mt-3 text-lg font-semibold leading-snug">{note.body}</p>
        </div>
        <ul className="mt-4 divide-y divide-white/10 rounded-2xl bg-white/5 ring-1 ring-white/10">
          {CARD_ORDER.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setActive(key)}
                onMouseEnter={() => setActive(key)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${key === active ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                {CARD_NOTES[key].title}
                <span className={`h-2 w-2 shrink-0 rounded-full ${key === active ? 'bg-blue-500' : 'bg-white/15'}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
