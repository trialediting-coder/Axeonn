import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { TrustBadges } from '@/components/common/TrustBadges';
import { nicheHeroTempImages, defaultNicheHeroTempImage } from '@/data/nicheHeroTempImages';
import { pricingTiers } from '@/data/pricingData';

const corePrice = pricingTiers.find((t) => t.id === 'core-web-build')?.price ?? '$2,800';

export function NicheHero({ niche }: { niche: Niche }) {
  const heroImage = nicheHeroTempImages[niche.slug] || defaultNicheHeroTempImage;

  return (
    <section className="relative w-full min-h-[92svh] sm:min-h-screen flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-16 bg-neutral-950 text-white overflow-hidden">
      {/* TEMPORARY placeholder background — see data/nicheHeroTempImages.ts */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        {/* Geo + service line: the message-match a paid click needs to see first */}
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
          Websites &amp; lead systems for {niche.name} &middot; Des Moines metro &amp; Iowa
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          {niche.headline}
        </h1>
        <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-8">
          {niche.subheadline}
        </p>

        {/* Price anchor: the #1 objection, answered before the first scroll */}
        <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] border border-white/15 px-4 py-2 text-sm sm:text-base text-neutral-200 mb-8">
          <span className="font-bold text-white">Flat-rate builds from {corePrice}</span>
          <span className="text-neutral-400">&middot; published pricing, no proposals</span>
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
          className="inline-block text-sm sm:text-base text-neutral-300 hover:text-white underline underline-offset-4 mb-10"
        >
          See both builds and what each includes
        </Link>

        <div className="flex justify-center">
          <TrustBadges variant="dark" />
        </div>
      </div>
    </section>
  );
}
