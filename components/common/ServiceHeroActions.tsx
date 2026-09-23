import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

interface ServiceHeroActionsProps {
  /** Price anchor shown above the buttons, e.g. "Websites from $2,800 flat". */
  priceLine: string;
  /** Optional muted qualifier after the price line. */
  note?: string;
  primaryLabel?: string;
}

/**
 * Shared hero action row for the five /marketing-solutions service pages:
 * a real price anchor (the #1 objection), one primary booking CTA, a
 * click-to-call, and pricing demoted to a text link. Dark-hero styling.
 */
export function ServiceHeroActions({
  priceLine,
  note,
  primaryLabel = 'Book a Free Strategy Call',
}: ServiceHeroActionsProps) {
  return (
    <div className="mb-10">
      <p className="inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-white/[0.07] border border-white/15 px-4 py-2 text-sm sm:text-base text-neutral-200 mb-6">
        <span className="font-bold text-white">{priceLine}</span>
        {note && <span className="text-neutral-400">&middot; {note}</span>}
      </p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
        <Link
          href="/book"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/25"
        >
          {primaryLabel} <ArrowRight size={18} />
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
        className="inline-block mt-5 text-sm sm:text-base text-neutral-300 hover:text-white underline underline-offset-4"
      >
        See both builds and what each includes
      </Link>
    </div>
  );
}
