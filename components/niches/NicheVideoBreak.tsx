import Link from 'next/link';
import { nicheVideoMap, defaultNicheVideoAsset } from '@/data/nicheVideoMap';

export function NicheVideoBreak({
  slug,
  headline,
  ctaLabel,
}: {
  slug: string;
  headline: string;
  ctaLabel?: string;
}) {
  const asset = nicheVideoMap[slug] || defaultNicheVideoAsset;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-neutral-950 flex items-center justify-center">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        poster={asset.poster}
        src={asset.video}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-neutral-950/60" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {headline}
        </p>
        {ctaLabel && (
          <Link
            href="/book"
            className="inline-block mt-6 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
