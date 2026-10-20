import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { nicheHeroTempImages, defaultNicheHeroTempImage } from '@/data/nicheHeroTempImages';

// Purpose: the result, the price anchor and the one next step, before the first scroll.
export function NicheHero({ niche }: { niche: Niche }) {
  const heroImage = nicheHeroTempImages[niche.slug] ?? defaultNicheHeroTempImage;

  return (
    <section className="relative w-full sm:min-h-screen flex items-center px-5 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-10 sm:pt-28 sm:pb-16 bg-neutral-950 text-white overflow-hidden">
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
        <p className="text-xs sm:text-sm font-mono uppercase tracking-wider text-blue-400 mb-3 sm:mb-4">
          Patient &amp; client intake for {niche.name} &middot; Des Moines metro &amp; Iowa
        </p>
        <h1 className="text-[32px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.1] sm:leading-tight mb-4 sm:mb-6">
          {niche.headline}
        </h1>
        <p className="text-base sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-5 sm:mb-8">
          {niche.subheadline}
        </p>

        {/* Price anchor: the #1 objection, answered before the first scroll */}
        <p className="inline-flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 rounded-2xl sm:rounded-full bg-white/[0.07] border border-white/15 px-4 py-2 text-sm sm:text-base text-neutral-200 mb-5 sm:mb-8">
          <span className="font-bold text-white">From $799/mo</span>
          <span className="text-neutral-400">
            <span className="hidden sm:inline">&middot; </span>$0 to start. Nothing due until it&apos;s working.
          </span>
        </p>

        {/* One primary action, one fast path, one text link */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 mb-2 sm:mb-5">
          <Link
            href="/check-your-area"
            data-track="cta_click"
            data-track-cta={`niche_hero_area_check_${niche.slug}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/25"
          >
            {niche.primaryCTA} <ArrowRight size={18} />
          </Link>
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-base transition-colors"
          >
            <CalendarDays size={17} /> Book a call
          </Link>
        </div>
        <Link
          href="/pricing"
          className="py-2 inline-block text-sm sm:text-base text-neutral-300 hover:text-white underline underline-offset-4"
        >
          See AxeonCORE and AxeonGROWTH, and what each includes
        </Link>
      </div>
    </section>
  );
}
