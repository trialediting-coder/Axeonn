import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Niche } from '@/data/nichesData';

export function NicheCard({ niche }: { niche: Niche }) {
  return (
    <Link
      href={`/solutions/${niche.slug}`}
      className="group p-7 rounded-2xl border border-neutral-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between"
    >
      <div>
        <h3 className="text-xl font-bold text-neutral-950 mb-3">{niche.name}</h3>
        <p className="text-neutral-600 text-sm leading-relaxed">{niche.subheadline}</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-blue-600 font-semibold text-sm">
        <span>Learn More</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
