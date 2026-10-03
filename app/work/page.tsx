import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { WorkCard, ConceptDisclaimer } from '@/components/work/WorkCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/work',
  title: 'Our Work | Axeon Studio',
  description:
    'Websites designed and built by Axeon Studio for local businesses in Iowa and beyond: auto detailing, remodeling, family dentistry and more.',
});

export default function WorkPage() {
  const hasConcepts = WORK_PROJECTS.some((p) => p.concept);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Our Work', path: '/work' }]} />
      <main className="pt-28 sm:pt-32 pb-20 lg:pb-28 px-4 sm:px-8 lg:px-14">
        <div className="w-full max-w-[1720px] mx-auto">
          <div className="text-xs font-mono font-semibold tracking-widest text-neutral-800 uppercase mb-3 sm:mb-4">
            [ OUR WORK ]
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-950 font-display tracking-tight leading-[1.08]">
              Sites we&rsquo;ve built
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 max-w-xl leading-relaxed lg:text-right">
              Every site is designed around how that business actually gets customers. Click any project to see the live build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 xl:gap-16">
            {WORK_PROJECTS.map((project) => (
              <WorkCard key={project.name} project={project} showConcept />
            ))}
          </div>

          <div className="mt-16 sm:mt-20 pt-8 sm:pt-10 border-t border-neutral-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-xs font-mono font-semibold tracking-wider text-neutral-500 uppercase mb-1.5">
                [ WANT ONE FOR YOUR BUSINESS? ]
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-neutral-950 font-display tracking-tight">
                Book a free consultation and we&rsquo;ll mock up your homepage.
              </h2>
            </div>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm tracking-tight transition-colors"
            >
              Get Started
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {hasConcepts && (
            <ConceptDisclaimer tagged className="mt-10" />
          )}
        </div>
      </main>
    </>
  );
}
