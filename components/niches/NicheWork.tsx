import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Niche } from '@/data/nichesData';
import { projectsForNiche } from '@/data/workProjects';
import { WorkCard } from '@/components/work/WorkCard';

// Shows any /work projects tagged with this niche; renders nothing for niches without one.
export function NicheWork({ niche }: { niche: Niche }) {
  const projects = projectsForNiche(niche.slug);
  if (projects.length === 0) return null;

  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-mono font-semibold tracking-widest text-neutral-800 uppercase mb-3">
          [ RECENT WORK ]
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
            Sites we&rsquo;ve built for {niche.name}
          </h2>
          <Link
            href="/work"
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-950 hover:text-blue-600 transition-colors"
          >
            See all our work <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
          {projects.map((project) => (
            <WorkCard key={project.name} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
