import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { WorkCard, ConceptDisclaimer } from '@/components/work/WorkCard';

interface RecentWorkProps {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  /** How many projects to show; the first entries in WORK_PROJECTS are real clients. */
  limit?: number;
  tone?: 'light' | 'muted';
}

/** A portfolio teaser that links through to /work. */
export function RecentWork({
  eyebrow = 'Recent Work',
  heading = 'Built Around How Each Business Sells',
  intro = 'Every site starts from how that business actually wins work, not from a theme with the colors changed.',
  limit = 3,
  tone = 'light',
}: RecentWorkProps) {
  const projects = WORK_PROJECTS.slice(0, limit);
  return (
    <section
      className={`w-full py-20 sm:py-28 px-4 sm:px-8 lg:px-14 xl:px-20 ${tone === 'muted' ? 'bg-neutral-50/70' : ''}`}
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 sm:mb-14">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">{eyebrow}</p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08]">
              {heading}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">{intro}</p>
          </div>
          <Link
            href="/work"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-300 text-neutral-900 font-semibold hover:border-neutral-400 hover:bg-white transition-colors"
          >
            See all projects <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-8">
          {projects.map((project) => (
            <WorkCard key={project.name} project={project} />
          ))}
        </div>
        {projects.some((p) => p.concept) && <ConceptDisclaimer className="mt-10" />}
      </div>
    </section>
  );
}
