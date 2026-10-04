import Link from 'next/link';
import type { Niche } from '@/data/nichesData';

// The whole card is the link; one outcome line, one clear next step.
export function NicheCard({ niche }: { niche: Niche }) {
  return (
    <Link
      href={`/solutions/${niche.slug}`}
      className="group p-7 rounded-2xl border border-neutral-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between"
    >
      <div>
        <h3 className="text-xl font-bold font-display text-neutral-950 mb-2">{niche.name}</h3>
        <p className="text-neutral-600 leading-relaxed">{niche.cardLine}</p>
      </div>
      <span className="mt-6 text-blue-600 font-semibold text-sm">
        See {niche.name}{' '}
        <span aria-hidden="true" className="inline-block group-hover:translate-x-1 transition-transform">
          &rarr;
        </span>
      </span>
    </Link>
  );
}
