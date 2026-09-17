import { TrendingUp } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { benefitHeadlinesBySlug } from '@/data/nicheBenefitHeadlines';

export function NichePainPoints({ niche }: { niche: Niche }) {
  const headlines = benefitHeadlinesBySlug[niche.slug] ?? [];

  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-10">
          What&apos;s actually costing {niche.name.toLowerCase()} revenue
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {niche.painPoints.map((point, index) => (
            <div
              key={point}
              className="p-7 rounded-2xl border border-neutral-200 bg-white flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-950 mb-2">
                  {headlines[index] ?? niche.name}
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">{point}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
