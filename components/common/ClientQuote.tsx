import Link from 'next/link';
import { Quote } from 'lucide-react';

// Real words from Axeon's one published client (approved in content/brand-guardrails.md).
// Keep the wording verbatim: never turn it into a number or a lead-lift claim.
export const LEVI_QUOTE = {
  text: '…Whatever you have been doing, it’s working. Getting lots of leads.',
  name: 'Levi Rench',
  role: 'Owner, A-1 Auto Detailing',
  place: 'Pleasant Hill, Iowa',
  href: '/insights/a-1-auto-detailing-website-case-study',
};

interface ClientQuoteProps {
  /** 'section' = full-width homepage band; 'card' = fits inside a page container. */
  variant?: 'section' | 'card';
}

export function ClientQuote({ variant = 'section' }: ClientQuoteProps) {
  const card = (
    <figure className="relative mx-auto max-w-4xl rounded-[32px] border border-neutral-200/90 bg-white px-6 py-10 sm:px-14 sm:py-14 text-center shadow-sm">
      <Quote aria-hidden="true" className="mx-auto mb-6 h-10 w-10 text-[#2563eb]" strokeWidth={2.2} />
      <blockquote className="text-2xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display tracking-tight leading-[1.2] text-neutral-950">
        “{LEVI_QUOTE.text}”
      </blockquote>
      <figcaption className="mt-8 flex flex-col items-center gap-1">
        <span className="text-base sm:text-lg font-bold text-neutral-950">{LEVI_QUOTE.name}</span>
        <span className="text-sm sm:text-base text-neutral-500">
          {LEVI_QUOTE.role} · {LEVI_QUOTE.place}
        </span>
        <Link
          href={LEVI_QUOTE.href}
          className="inline-block py-2 mt-4 text-sm font-semibold text-[#2563eb] hover:text-blue-700 transition-colors"
        >
          Read the A-1 case study →
        </Link>
      </figcaption>
    </figure>
  );

  if (variant === 'card') return card;

  return (
    <section
      aria-label="What our client says"
      className="w-full px-4 sm:px-8 lg:px-14 xl:px-20 py-16 sm:py-24"
    >
      <p className="mb-6 text-center text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase">
        [ From a client ]
      </p>
      {card}
    </section>
  );
}
