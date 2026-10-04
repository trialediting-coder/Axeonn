import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { WorkCard, ConceptDisclaimer } from '@/components/work/WorkCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/work',
  title: 'Our Work: Iowa Website Design Portfolio | Axeon Studio',
  description:
    'Websites designed and built by Axeon Studio for local businesses in Iowa and beyond: auto detailing, remodeling, family dentistry and more.',
});

const CASE_STUDY = '/insights/a-1-auto-detailing-website-case-study';
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
      <BreadcrumbJsonLd items={[{ name: 'Our Work', path: '/work' }]} />
      <main className="pt-28 sm:pt-32 pb-20 lg:pb-28 px-4 sm:px-8 lg:px-14">
        <div className="w-full max-w-[1720px] mx-auto">
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3 sm:mb-4">
            [ OUR WORK ]
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-950 font-display tracking-tight leading-[1.08]">
              Sites built to bring in customers.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 max-w-xl leading-relaxed lg:text-right">
              Every site is designed around how that business actually gets customers. Click any project to see the
              live build.
            </p>
          </div>

          <div className="mb-8 sm:mb-10 text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase">
            [ ALL PROJECTS ]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-8">
            {rest.map((project) => (
              <WorkCard key={project.name} project={project} showConcept />
            ))}
          </div>


          {/* The one published client result, featured full-width below the grid (MSH stays first, owner rule). */}
          {featured && (
            <article className="mt-16 sm:mt-20 rounded-[28px] sm:rounded-[40px] bg-neutral-950 text-white overflow-hidden grid grid-cols-1 lg:grid-cols-12">
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
              <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col">
                <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                  [ CLIENT RESULT · {featured.location} ]
                </p>
                <p className="mt-5 text-[96px] sm:text-[130px] leading-[0.85] font-black font-display tracking-tighter text-white">
                  #1
                </p>
                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
                  on Google for &ldquo;Pleasant Hill auto detailing,&rdquo; up from page 2.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed">
                  {featured.name} &middot; {featured.industry} &middot; {featured.date}
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  {A1_PROOF.map((p) => (
                    <div key={p.label}>
                      <dt className="text-2xl sm:text-3xl font-black font-display tracking-tight">{p.value}</dt>
                      <dd className="mt-1 text-xs sm:text-sm text-neutral-400 leading-snug">{p.label}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 lg:mt-auto lg:pt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={CASE_STUDY}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
                  >
                    Read how A-1 went from page 2 to #1 <ArrowRight size={16} />
                  </Link>
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

          {hasConcepts && <ConceptDisclaimer className="mt-10" />}
        </div>
      </main>
    </>
  );
}
