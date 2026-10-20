'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { nicheHeroTempImages } from '@/data/nicheHeroTempImages';
import type { VerticalExample } from '@/data/servicePages';

// Per-practice examples on the service pages. Phones get a 2x2 set of tabs and
// one example at a time, so the whole set fits one screen; tablets and up show
// all four cards side by side. Every example is in the HTML either way.
export function PracticeExamples({ items }: { items: VerticalExample[] }) {
  const [active, setActive] = useState(0);

  return (
    <>
      <div role="tablist" aria-label="Practice type" className="md:hidden grid grid-cols-2 gap-2 mb-3">
        {items.map((item, i) => (
          <button
            key={item.vertical}
            type="button"
            role="tab"
            id={`example-tab-${item.vertical}`}
            aria-selected={i === active}
            aria-controls={`example-${item.vertical}`}
            onClick={() => setActive(i)}
            className={`min-h-11 rounded-full px-2 text-sm leading-tight font-bold transition-colors cursor-pointer ${
              i === active
                ? 'bg-neutral-950 text-white'
                : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:ring-blue-300'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item, i) => (
          <article
            key={item.vertical}
            id={`example-${item.vertical}`}
            role="tabpanel"
            aria-labelledby={`example-tab-${item.vertical}`}
            className={`rounded-3xl border border-neutral-200 overflow-hidden flex-col ${i === active ? 'flex' : 'hidden md:flex'}`}
          >
            <div className="relative h-20 sm:h-40 bg-neutral-900">
              <Image
                src={nicheHeroTempImages[item.vertical]}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover opacity-70"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 to-neutral-950/10" />
              <Link
                href={`/solutions/${item.vertical}`}
                className="absolute left-5 sm:left-6 bottom-2 sm:bottom-4 min-h-11 inline-flex items-end pb-1 gap-1.5 text-xl sm:text-2xl font-black font-display tracking-tight text-white hover:text-blue-300 transition-colors"
              >
                {item.name} <ArrowRight size={18} className="mb-1 md:hidden" aria-hidden="true" />
              </Link>
            </div>
            <div className="p-5 sm:p-7 flex-1">
              <p className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-400">Example</p>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg font-semibold leading-snug">{item.scenario}</p>
              <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
                {item.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm sm:text-[15px] leading-snug sm:leading-relaxed text-neutral-600">
                    <Check size={16} strokeWidth={2.6} className="shrink-0 mt-0.5 sm:mt-1 text-blue-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
