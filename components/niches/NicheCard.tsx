import Link from 'next/link';
import type { Niche } from '@/data/nichesData';

// The whole card is the link. It leads with the niche's leak in big type so a
// visitor recognizes their own problem before they read the industry name.
export function NicheCard({ niche }: { niche: Niche }) {
  return (
    <Link
      href={`/solutions/${niche.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 transition-all hover:border-blue-400 hover:shadow-lg"
    >
      <div>
        <p className="mb-4 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ {niche.name} ]</p>
        <h3 className="text-2xl font-extrabold font-display tracking-tight leading-[1.15] text-balance text-neutral-950 sm:text-[26px]">
          {niche.leakHeadline}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">{niche.cardLine}</p>
      </div>
      <span className="mt-8 text-sm font-semibold text-blue-600">
        See {niche.name}{' '}
        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
          &rarr;
        </span>
      </span>
    </Link>
  );
}
