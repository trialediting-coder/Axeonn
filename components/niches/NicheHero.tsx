import Link from 'next/link';
import type { Niche } from '@/data/nichesData';
import { TrustBadges } from '@/components/common/TrustBadges';
import { nicheHeroTempImages, defaultNicheHeroTempImage } from '@/data/nicheHeroTempImages';

export function NicheHero({ niche }: { niche: Niche }) {
  const heroImage = nicheHeroTempImages[niche.slug] || defaultNicheHeroTempImage;

  return (
    <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
      {/* TEMPORARY placeholder background — see data/nicheHeroTempImages.ts */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
          {niche.name}
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          {niche.headline}
        </h1>
        <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-10">
          {niche.subheadline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
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
        <div className="flex justify-center">
          <TrustBadges variant="dark" />
        </div>
      </div>
    </section>
  );
}
