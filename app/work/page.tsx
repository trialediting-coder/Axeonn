import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { WorkCard, ConceptDisclaimer } from '@/components/work/WorkCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/work',
  title: 'Recent Builds: Website Portfolio | Axeon Studio',
  description:
    'Recent websites designed and built by Axeon Studio for businesses in Iowa and beyond, including concept builds. Every build is custom and mobile-first.',
});

const FEATURED_NAME = 'A-1 Auto Detailing';

// Approved A-1 facts only (content/brand-guardrails.md; same figures as /about).
const A1_PROOF = [
  { value: '5.0', label: 'Google rating from 180+ reviews' },
  { value: '0.3–0.8s', label: 'page loads on the new site' },
];

export default function WorkPage() {
  const featured = WORK_PROJECTS.find((p) => p.name === FEATURED_NAME);
  // The grid keeps the data order (MSH stays pinned first among the rest).
  const rest = WORK_PROJECTS.filter((p) => p.name !== FEATURED_NAME);
  const hasConcepts = WORK_PROJECTS.some((p) => p.concept);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Recent builds', path: '/work' }]} />
      <main className="pt-28 sm:pt-32 pb-20 lg:pb-28 px-4 sm:px-8 lg:px-14">
        <div className="w-full max-w-[1720px] mx-auto">
          {/* Purpose: what this page is (real builds plus labeled concepts); each card below links to a live build. */}
          <div className="eyebrow mb-3 sm:mb-4">
            RECENT BUILDS
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-950 font-display tracking-tight leading-[1.08]">
              Recent builds.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 max-w-xl leading-relaxed lg:text-right">
              Real sites we have designed and built, plus a few labeled concept builds. Click any project to see the live
              build.
            </p>
          </div>

          <div className="eyebrow mb-8 sm:mb-10 text-neutral-500">
            ALL PROJECTS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-8">
            {rest.map((project) => (
              <WorkCard key={project.name} project={project} showConcept />
            ))}
          </div>


          {/* The one published client result, featured full-width below the grid (MSH stays first, owner rule). */}
          {/* Purpose: the one published client result (A-1: page 2 to #1), with proof numbers and the case study. */}
          {featured && (
            <article className="mt-12 sm:mt-20 rounded-[28px] sm:rounded-[40px] bg-neutral-950 text-white overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              <a
                href={featured.url}
                target="_blank"
                rel="noopener"
                className="group lg:col-span-7 block relative bg-neutral-900"
              >
                <img
                  src={featured.image}
                  alt={`${featured.name} website homepage`}
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={833}
                  className="w-full h-full object-cover object-top aspect-[1440/1000] lg:aspect-auto group-hover:scale-[1.02] transition-transform duration-700"
                />
              </a>
              <div className="lg:col-span-5 p-5 sm:p-10 lg:p-12 flex flex-col">
                <p className="eyebrow eyebrow-dark">
                  CLIENT BUILD · {featured.location}
                </p>
                <p className="mt-3 sm:mt-5 text-[72px] sm:text-[130px] leading-[0.85] font-black font-display tracking-tighter text-white">
                  #1
                </p>
                <h2 className="mt-2 sm:mt-4 text-xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
                  on Google for &ldquo;Pleasant Hill auto detailing,&rdquo; up from page 2.
                </h2>
                <p className="mt-1.5 sm:mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed">
                  {featured.name} &middot; {featured.industry} &middot; {featured.date}
                </p>
                <dl className="mt-4 sm:mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:pt-6">
                  {A1_PROOF.map((p) => (
                    <div key={p.label}>
                      <dt className="text-2xl sm:text-3xl font-black font-display tracking-tight">{p.value}</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-neutral-400 leading-snug">{p.label}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 sm:mt-8 lg:mt-auto lg:pt-8 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <a
                    href={featured.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/25 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
                  >
                    See the live site <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </article>
          )}

          {/* Purpose: the next step for a practice owner: check if your specialty is open. */}
          <div className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-neutral-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-xs font-mono font-semibold tracking-wider text-neutral-500 uppercase mb-1.5">
                RUN A PRACTICE?
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-neutral-950 font-display tracking-tight">
                Check if your specialty is still open in your area.
              </h2>
            </div>
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_work"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm tracking-tight transition-colors"
            >
              Check your area
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {hasConcepts && <ConceptDisclaimer className="mt-10" />}
        </div>
      </main>
    </>
  );
}
