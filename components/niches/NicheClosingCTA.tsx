import Link from 'next/link';
import type { Niche } from '@/data/nichesData';

export function NicheClosingCTA({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
          Ready to see it built for {niche.name.toLowerCase()}?
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
          Your Business. Your Partner.
        </h2>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
          Book a strategy session and we'll walk through exactly how the site and intake pipeline would work for your business.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/book"
            className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            {niche.primaryCTA}
          </Link>
          <Link
            href="/pricing"
            className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
          >
            {niche.secondaryCTA}
          </Link>
        </div>
        <Link
          href="/why-axeon"
          className="inline-block mt-8 py-3 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
        >
          See exactly how we compare to a typical agency →
        </Link>
        <Link
          href="/solutions"
          className="inline-block mt-8 py-3 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
        >
          Not the right fit? Browse other industries →
        </Link>
      </div>
    </section>
  );
}
