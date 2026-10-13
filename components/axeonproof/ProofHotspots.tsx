'use client';

// components/axeonproof/ProofHotspots.tsx
// The analytics cards from the Overview with pins on them. Hover, focus or tap a
// pin and it says what that card is for, in the owner's words. The same notes
// are listed beside the image so nothing depends on hitting a pin.
import { useState } from 'react';
import Image from 'next/image';
import { PROOF_HOTSPOTS, PROOF_IMAGES } from '@/data/proofPage';

export function ProofHotspots() {
  const [active, setActive] = useState<string>(PROOF_HOTSPOTS[0].key);
  const img = PROOF_IMAGES.analytics;
  const current = PROOF_HOTSPOTS.find((h) => h.key === active) ?? PROOF_HOTSPOTS[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-10">
      <div className="relative overflow-hidden rounded-2xl bg-[#f3f4f7] p-2 shadow-[0_24px_80px_-30px_rgba(16,24,40,0.35)] ring-1 ring-neutral-200 sm:p-3">
        <div className="relative">
          <Image
            src={img.src}
            alt="AxeonPROOF analytics cards: most clicked buttons, where visitors came from, most visited pages, how people visit, pages that bring customers, where visitors are, and when customers reach out"
            width={img.width}
            height={img.height}
            sizes="(min-width: 1280px) 820px, 100vw"
            className="block h-auto w-full rounded-xl"
          />
          {PROOF_HOTSPOTS.map((h) => {
            const on = h.key === active;
            return (
              <button
                key={h.key}
                type="button"
                aria-label={h.title}
                aria-pressed={on}
                onMouseEnter={() => setActive(h.key)}
                onFocus={() => setActive(h.key)}
                onClick={() => setActive(h.key)}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span className="relative flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-blue-500 ${on ? 'opacity-0' : 'animate-ping opacity-40'}`} />
                  <span className={`relative inline-flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white transition-transform sm:h-5 sm:w-5 ${on ? 'scale-125 bg-neutral-950' : 'bg-blue-600'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:pt-2">
        <div key={current.key} className="proof-rise rounded-2xl bg-neutral-950 p-6 text-white">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400">[ {current.title} ]</p>
          <p className="mt-3 text-lg font-semibold leading-snug">{current.body}</p>
        </div>
        <ul className="mt-4 divide-y divide-neutral-200 rounded-2xl bg-white ring-1 ring-neutral-200">
          {PROOF_HOTSPOTS.map((h) => (
            <li key={h.key}>
              <button
                type="button"
                onClick={() => setActive(h.key)}
                onMouseEnter={() => setActive(h.key)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${h.key === active ? 'text-blue-700' : 'text-neutral-700 hover:text-neutral-950'}`}
              >
                {h.title}
                <span className={`h-2 w-2 shrink-0 rounded-full ${h.key === active ? 'bg-blue-600' : 'bg-neutral-200'}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
