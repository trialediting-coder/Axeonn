import Link from 'next/link';
import { servicePillars } from '@/data/servicesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import type { Niche } from '@/data/nichesData';

// Maps a service pillar key to its corresponding marketing-solutions page id,
// for the pillars that have a dedicated page to link to.
const PILLAR_TO_SOLUTION_ID: Record<string, string> = {
  website: 'website',
  seo: 'seo',
  'ai-automation': 'ai-chat-scheduling',
  'lead-capture': 'lead-generation',
  'video-photography': 'video-photography',
};

export function NicheServices({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-10">
          What You Get
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicePillars.map(({ key, icon: Icon, title, description }) => {
            const solutionId = PILLAR_TO_SOLUTION_ID[key];
            const solution = solutionId
              ? marketingSolutions.find((s) => s.id === solutionId)
              : undefined;

            const cardContent = (
              <>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-950 mb-2">{title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {description} Built for {niche.name.toLowerCase()}.
                  </p>
                </div>
              </>
            );

            if (solution) {
              return (
                <Link
                  key={key}
                  href={solution.href}
                  className="p-7 rounded-2xl border border-neutral-200 bg-white flex flex-col gap-4 hover:border-blue-400 transition-colors"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div key={key} className="p-7 rounded-2xl border border-neutral-200 bg-white flex flex-col gap-4">
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
