import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import type { Niche } from '@/data/nichesData';

export function NicheClosingCTA({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
          Ready to see it built for {niche.name}?
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
          A site and intake pipeline built for {niche.name}, priced upfront.
        </h2>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
          Book a free 20-minute strategy call. We walk through exactly how the site and intake pipeline
          would work for your business and leave you with a flat price, whether or not you hire us.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/25"
          >
            {niche.primaryCTA} <ArrowRight size={18} />
          </Link>
          <a
            href="tel:+15154938017"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-base transition-colors"
          >
            <Phone size={17} /> Call (515) 493-8017
          </a>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3">
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
            Not the right fit? Browse other industries
          </Link>
        </div>
      </div>
    </section>
  );
}
