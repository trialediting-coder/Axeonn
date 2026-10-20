'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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

export default function GetFoundComparison() {
  return (
    <section id="get-found" className="w-full py-20 sm:py-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-10"
        >
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ 01 · GET FOUND ]
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08]">
            A template gets you a website. A site built for your practice or firm gets you booked.
          </h2>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">Example: the same practice or firm, two ways.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <ExampleCard title="Example · Typical site" rows={EXAMPLE_TYPICAL} />
          <ExampleCard title="Example · Axeon site" rows={EXAMPLE_AXEON} dark />
        </div>

        <VersusRows
          typical={[
            'One layout for every industry. Swap the logo, ship it.',
            'Search setup treated as a separate project, if it happens at all.',
          ]}
          axeon={[
            'Designed around how your practice or firm books new patients, clients and cases.',
            'Set up to show up on Google, Maps and AI answers.',
          ]}
        />

        <Link
          href="/check-your-area"
          data-track="cta_click"
          data-track-cta="area_check_why_get_found"
          className="group mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8 hover:border-blue-300 transition-colors"
        >
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-2">[ SEE YOUR OWN ]</div>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-display">
              How does your site answer an inquiry at 9 PM? Check your area and we&apos;ll time it.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 shrink-0">
            Check your area
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>
    </section>
  );
}
