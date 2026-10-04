import Link from 'next/link';
import { Quote } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

// The page's single A-1 proof block. Approved facts only (content/brand-guardrails.md).
// Outside auto detailing it is labelled as our published case study so it never
// reads as a same-industry result.
export function NicheProof({ niche }: { niche: Niche }) {
  const sameIndustry = niche.slug === 'auto-detailing';

  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">
          {sameIndustry ? '[ A DETAILING SHOP WE BUILT FOR ]' : '[ OUR PUBLISHED CASE STUDY: A-1 AUTO DETAILING ]'}
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 text-balance">
          A-1 Auto Detailing went from page 2 to #1 on Google
        </h2>
        <p className="mt-4 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
          For &ldquo;Pleasant Hill auto detailing,&rdquo; with a 5.0 Google rating from 180+ reviews front and center.
        </p>
        <figure className="mt-10 rounded-[28px] border border-neutral-200 bg-white px-6 py-10 sm:px-12 shadow-sm">
          <Quote aria-hidden="true" className="mx-auto mb-5 h-9 w-9 text-blue-600" strokeWidth={2.2} />
          <blockquote className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug text-neutral-950">
            &ldquo;{LEVI_QUOTE.text}&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-neutral-500">
            <span className="font-bold text-neutral-950">{LEVI_QUOTE.name}</span>, {LEVI_QUOTE.role} &middot; {LEVI_QUOTE.place}
          </figcaption>
        </figure>
        <Link
          href={LEVI_QUOTE.href}
          className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Read the A-1 case study &rarr;
        </Link>
      </div>
    </section>
  );
}
