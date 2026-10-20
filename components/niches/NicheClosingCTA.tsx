import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { guaranteeSentence } from '@/data/pricingData';

export function NicheClosingCTA({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-4">
          [ 90-DAY PERFORMANCE COMMITMENT ]
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight mb-6">
          Stop losing {niche.customerNoun} to voicemail.
        </h2>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
          {guaranteeSentence}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/audit"
            data-track="cta_click"
            data-track-cta={`niche_${niche.slug}_closing_audit`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/25"
          >
            Get your free after-hours audit <ArrowRight size={18} />
          </Link>
          <Link
            href="/book"
            data-track="cta_click"
            data-track-cta={`niche_${niche.slug}_closing_call`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-base transition-colors"
          >
            Book a call
          </Link>
        </div>
        <p className="mt-6 text-xs text-neutral-500 max-w-xl mx-auto leading-relaxed">
          Included with AxeonCORE and AxeonGROWTH and written into your agreement. We don&apos;t promise a number of new
          {' '}{niche.customerNoun}, revenue, or rankings. We promise the system does its job, and we stay on as your growth partner. Or call{' '}
          <a href="tel:+15154938017" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-white">
            <Phone size={12} /> (515) 493-8017
          </a>
          .
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3">
          <Link
            href="/pricing"
            className="py-2 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            {niche.secondaryCTA}
          </Link>
          <Link
            href="/solutions"
            className="py-2 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            Not your specialty? See the practices and firms we serve
          </Link>
        </div>
      </div>
    </section>
  );
}
