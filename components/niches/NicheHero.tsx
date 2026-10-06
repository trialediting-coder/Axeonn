import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { nicheHeroTempImages, defaultNicheHeroTempImage } from '@/data/nicheHeroTempImages';
import { pricingTiers } from '@/data/pricingData';

const corePrice = pricingTiers.find((t) => t.id === 'core-web-build')?.price ?? '$149';

export function NicheHero({ niche }: { niche: Niche }) {
  const heroImage = nicheHeroTempImages[niche.slug] ?? defaultNicheHeroTempImage;

  return (
    <section className="relative w-full min-h-[92svh] sm:min-h-screen flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-16 bg-neutral-950 text-white overflow-hidden">
      {heroImage ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        </>
      ) : (
        // No-photo treatment: brand glow on a dark gradient, never a borrowed image.
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950">
          <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.30),transparent)]" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.16),transparent)]" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        {/* Geo + service line: the message-match a paid click needs to see first */}
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
          More {niche.customerNoun} for {niche.name} &middot; Des Moines metro &amp; Iowa
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-tight mb-6">
          {niche.headline}
        </h1>
        <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-8">
          {niche.subheadline}
        </p>

        {/* Price anchor: the #1 objection, answered before the first scroll */}
        <p className="inline-flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-2xl sm:rounded-full bg-white/[0.07] border border-white/15 px-4 py-2 text-sm sm:text-base text-neutral-200 mb-8">
          <span className="font-bold text-white">Plans from {corePrice}/mo</span>
          <span className="text-neutral-400">
            <span className="hidden sm:inline">&middot; </span>backed by our 90-Day Customer Guarantee
          </span>
        </p>

        {/* One primary action, one fast path, one text link */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-5">
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
        <Link
          href="/pricing"
          className="py-2 inline-block text-sm sm:text-base text-neutral-300 hover:text-white underline underline-offset-4"
        >
          See all three plans and what each includes
        </Link>
      </div>
    </section>
  );
}
