import Link from 'next/link';
import type { Niche } from '@/data/nichesData';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

// The page's single A-1 proof block. Approved facts only (content/brand-guardrails.md).
// The result leads in huge type; outside auto detailing it is framed as the same
// system in a different trade so it never reads as a same-industry result.
export function NicheProof({ niche }: { niche: Niche }) {
  const sameIndustry = niche.slug === 'auto-detailing';

  return (
    <section className="w-full bg-blue-600 px-4 py-20 text-white sm:px-10 sm:py-28 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
        <div>
          <p className="text-xs font-mono font-bold tracking-widest text-blue-100 uppercase">
            {sameIndustry ? '[ CLIENT SPOTLIGHT ]' : '[ SAME SYSTEM, DIFFERENT TRADE ]'}
          </p>
          <p
            aria-hidden="true"
            className="mt-6 whitespace-nowrap text-5xl font-extrabold font-display leading-none tracking-tight sm:text-[72px] lg:text-[88px]"
          >
            Page 2 &rarr; #1
          </p>
          <h2 className="mt-6 max-w-2xl text-2xl font-extrabold font-display tracking-tight leading-tight text-balance sm:text-3xl">
            {sameIndustry ? 'A-1 went from page 2 to #1.' : 'Same system took A-1 from page 2 to #1.'}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100">
            A-1 Auto Detailing, for &ldquo;Pleasant Hill auto detailing,&rdquo; with a 5.0 Google rating from 180+
            reviews front and center.
          </p>
        </div>
        <figure className="border-t border-white/25 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <blockquote className="text-xl font-bold leading-snug sm:text-2xl">&ldquo;{LEVI_QUOTE.text}&rdquo;</blockquote>
          <figcaption className="mt-4 text-sm text-blue-100">
            <span className="font-bold text-white">{LEVI_QUOTE.name}</span>, {LEVI_QUOTE.role} &middot; {LEVI_QUOTE.place}
          </figcaption>
          <Link
            href={LEVI_QUOTE.href}
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Read the A-1 case study &rarr;
          </Link>
        </figure>
      </div>
    </section>
  );
}
