'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { VersusRows } from './VersusSection';

// Section 01 of /why-axeon, told through one example site that holds for all
// four verticals (dental, med spa, law, CPA). Until 2026-10-19 this showed an HVAC template gallery next to our
// trade builds; practice visitors now see their own kind of site instead. No
// screenshots of other businesses, no client results.
const EXAMPLE_TYPICAL = [
  { label: 'Hero', value: 'A stock photo of a handshake or a smiling patient, and “Welcome”' },
  { label: 'Your team', value: 'One paragraph, three clicks deep' },
  { label: 'Next step', value: 'A contact form that emails the front desk or intake inbox' },
];

const EXAMPLE_AXEON = [
  { label: 'Hero', value: 'Your people, your reviews and one clear ask in the first screen: “Book a new-patient exam”, “Book a consult”, “Free case review” or “Schedule a tax consult”' },
  { label: 'Your team', value: 'Real photos and credentials for each dentist, injector, attorney or CPA, and what each one handles' },
  { label: 'Next step', value: 'Online booking, plus a reply within 60 seconds to every inquiry' },
];

function ExampleCard({ title, rows, dark = false }: { title: string; rows: typeof EXAMPLE_TYPICAL; dark?: boolean }) {
  return (
    <div className={`rounded-3xl p-6 sm:p-8 ${dark ? 'bg-neutral-950 text-white' : 'border border-neutral-200 bg-white'}`}>
      <div className={`text-xs font-mono font-bold tracking-widest uppercase mb-5 ${dark ? 'text-blue-400' : 'text-neutral-400'}`}>
        {title}
      </div>
      <dl className={`divide-y ${dark ? 'divide-white/10' : 'divide-neutral-200'}`}>
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-3.5">
            <dt className={`text-sm font-semibold ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{r.label}</dt>
            <dd className={`leading-relaxed ${dark ? 'text-neutral-100' : 'text-neutral-700'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const TYPICAL_POINTS = [
  'One layout for every industry. Swap the logo, ship it.',
  'Search setup treated as a separate project, if it happens at all.',
];
const AXEON_POINTS = [
  'Designed around how your practice or firm books new patients, clients and cases.',
  'Set up to show up on Google, Maps and AI answers.',
];

// Phones: one example at a time behind a two-way switch, rows stacked label-over-value.
const MOBILE_ROWS: Record<'typical' | 'axeon', { rows: { label: string; value: string }[]; points: string[] }> = {
  typical: { rows: EXAMPLE_TYPICAL, points: TYPICAL_POINTS },
  axeon: {
    rows: [
      { label: 'Hero', value: 'Your people, your reviews and one clear ask, like “Book a consult”, in the first screen' },
      { label: 'Your team', value: 'Real photos and credentials for each provider, and what each one handles' },
      EXAMPLE_AXEON[2],
    ],
    points: AXEON_POINTS,
  },
};

function MobileExample() {
  const [side, setSide] = useState<'typical' | 'axeon'>('axeon');
  const dark = side === 'axeon';
  const { rows, points } = MOBILE_ROWS[side];
  const Mark = dark ? Check : X;
  return (
    <div className="md:hidden">
      <div role="tablist" aria-label="Example site" className="grid grid-cols-2 gap-1 rounded-full bg-neutral-100 p-1 mb-3">
        {(['typical', 'axeon'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={side === k}
            onClick={() => setSide(k)}
            className={`min-h-11 rounded-full text-sm font-semibold transition-colors ${
              side === k ? (k === 'axeon' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 shadow-sm') : 'text-neutral-500'
            }`}
          >
            {k === 'axeon' ? 'Example: Axeon site' : 'Example: typical site'}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={`rounded-2xl px-4 py-3 ${dark ? 'bg-neutral-950 text-white' : 'border border-neutral-200 bg-white'}`}>
        <dl className={`divide-y ${dark ? 'divide-white/10' : 'divide-neutral-200'}`}>
          {rows.map((r) => (
            <div key={r.label} className="py-2">
              <dt className={`text-xs font-mono font-bold uppercase tracking-widest ${dark ? 'text-blue-400' : 'text-neutral-400'}`}>{r.label}</dt>
              <dd className={`mt-0.5 text-[15px] leading-snug ${dark ? 'text-neutral-100' : 'text-neutral-700'}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <ul className={`mt-1 space-y-1.5 border-t pt-3 pb-1 ${dark ? 'border-white/10' : 'border-neutral-200'}`}>
          {points.map((item) => (
            <li key={item} className={`flex gap-2.5 text-[15px] leading-snug ${dark ? 'text-neutral-200' : 'text-neutral-600'}`}>
              <Mark size={18} className={`mt-0.5 shrink-0 ${dark ? 'text-blue-400' : 'text-neutral-400'}`} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Purpose: show, on one example practice, what a template site does vs. a site built to book; then the area-check CTA.
export default function GetFoundComparison() {
  return (
    <section id="get-found" className="w-full py-8 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-4 sm:mb-10"
        >
          <div className="eyebrow mb-3 sm:mb-4">
            01 · GET FOUND
          </div>
          <h2 className="text-[26px] sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.1] sm:leading-[1.08]">
            A template gets you a website. A site built for your practice or firm gets you booked.
          </h2>
          <p className="hidden sm:block mt-4 text-lg text-neutral-600 leading-relaxed">Example: the same practice or firm, two ways.</p>
        </motion.div>

        <MobileExample />

        <div className="hidden md:block">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <ExampleCard title="Example · Typical site" rows={EXAMPLE_TYPICAL} />
            <ExampleCard title="Example · Axeon site" rows={EXAMPLE_AXEON} dark />
          </div>

          <VersusRows typical={TYPICAL_POINTS} axeon={AXEON_POINTS} />
        </div>

        <Link
          href="/check-your-area"
          data-track="cta_click"
          data-track-cta="area_check_why_get_found"
          data-spot
          className="group ix-card relative mt-3 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 rounded-2xl sm:rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3.5 sm:p-8 hover:border-blue-300 transition-colors"
        >
          <div>
            <div className="eyebrow hidden sm:block mb-2">SEE YOUR OWN</div>
            <p className="text-base sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-display leading-snug">
              How does your site answer an inquiry at 9 PM? Check your area and we&apos;ll time it.
              <span className="sm:hidden inline-flex h-[1lh] items-center align-top ml-1.5">
                <ArrowRight size={16} className="text-blue-600" aria-hidden="true" />
              </span>
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-blue-600 shrink-0">
            Check your area
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>
    </section>
  );
}
