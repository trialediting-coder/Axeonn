import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { nicheHeroTempImages } from '@/data/nicheHeroTempImages';
import type { VerticalExample } from '@/data/servicePages';
import { funnelPath, SERVICE_SHORT, VERTICAL_PLURAL, isFunnelService } from '@/data/serviceFunnels';

// Per-practice selector on the six service pages (owner, 2026-10-20): four
// cards, each going to that service's own funnel page for that practice type
// (/marketing-solutions/{service}/{vertical}). Phones get compact rows; tablets
// and up get photo cards. The card line is the example moment for that practice.
export function PracticeExamples({ items, service }: { items: VerticalExample[]; service: string }) {
  if (!isFunnelService(service)) return null;
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-5">
      {items.map((item) => (
        <li key={item.vertical}>
          <Link
            href={funnelPath(service, item.vertical)}
            data-spot
            className="group ix-card relative h-full flex md:flex-col rounded-2xl md:rounded-3xl border border-neutral-200 overflow-hidden hover:border-blue-300 transition-colors"
          >
            <div className="hidden md:block relative h-40 bg-neutral-900">
              <Image src={nicheHeroTempImages[item.vertical]} alt="" fill sizes="560px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
              <span className="absolute left-6 bottom-4 text-2xl font-black font-display tracking-tight text-white">{item.name}</span>
            </div>
            <div className="flex-1 flex items-center md:items-start justify-between gap-3 px-4 py-3.5 md:p-6">
              <div className="min-w-0">
                <p className="md:hidden font-bold text-neutral-950">{item.name}</p>
                <p className="text-sm md:text-base text-neutral-600 leading-snug">{item.scenario}</p>
                <p className="hidden md:inline-flex mt-3 items-center gap-1.5 font-semibold text-blue-600">
                  {SERVICE_SHORT[service]} for {VERTICAL_PLURAL[item.vertical]} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
              <ArrowRight size={18} className="md:hidden shrink-0 text-neutral-400 group-hover:text-blue-600" aria-hidden="true" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
