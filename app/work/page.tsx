import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/work',
  title: 'Our Work | Axeon Studio',
  description:
    'Websites designed and built by Axeon Studio for local businesses in Iowa and beyond: auto detailing, remodeling, family dentistry and more.',
});

interface Project {
  name: string;
  industry: string;
  location: string;
  summary: string;
  image: string;
  url: string;
  // Self-initiated redesigns, not paid engagements.
  concept?: boolean;
}

const PROJECTS: Project[] = [
  {
    name: 'A-1 Auto Detailing',
    industry: 'Auto Detailing',
    location: 'Pleasant Hill, IA',
    summary:
      'A full rebuild with service pages, before-and-after galleries, live Google reviews and tap-to-call quoting, plus 301s for every old URL so nothing was lost in search.',
    image: '/images/work/a1.webp',
    url: 'https://a1-auto-detailing-six.vercel.app/',
  },
  {
    name: 'Kaufman Construction',
    industry: 'Design-Build Remodeling',
    location: 'West Des Moines, IA',
    summary:
      'An editorial homepage for a design-build remodeler, with a "Which path fits your project?" selector that sorts visitors into the right service tier before they ever fill out a form.',
    image: '/images/work/kaufman.webp',
    url: 'https://kaufman-construction.vercel.app/',
    concept: true,
  },
  {
    name: 'Hintz Family Dentistry',
    industry: 'Family Dentistry',
    location: 'Ankeny, IA',
    summary:
      'A warm, family-first site with a full Spanish version and an insurance checker that answers the Medicaid and Hawk-I question in one tap.',
    image: '/images/work/hintz.webp',
    url: 'https://hintz-family-dentistry.vercel.app/',
    concept: true,
  },
  {
    name: 'Select Construction & Remodeling',
    industry: 'Home Remodeling',
    location: 'Des Moines, IA & Boise, ID',
    summary:
      'A clean, gallery-style site for a two-state remodeler, with an office switcher that swaps the phone number and quote form between Des Moines and Boise.',
    image: '/images/work/select.webp',
    url: 'https://select-construction.vercel.app/',
    concept: true,
  },
  {
    name: 'Stumptown Detailing',
    industry: 'Luxury Auto Detailing',
    location: 'Whitefish, MT',
    summary:
      'A cinematic, video-led site for a high-end detailer, with an animated logo intro and a mobile hero cut from the shop’s own footage.',
    image: '/images/work/stumptown.webp',
    url: 'https://stumptown-detailing.vercel.app/',
    concept: true,
  },
];

export default function WorkPage() {
  const hasConcepts = PROJECTS.some((p) => p.concept);

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
            {PROJECTS.map((project) => (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener"
                className="group flex flex-col"
              >
                <div className="relative aspect-[1440/1000] w-full rounded-[24px] sm:rounded-[32px] overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-sm group-hover:shadow-xl transition-all duration-500">
                  <img
                    src={project.image}
                    alt={`${project.name} website homepage`}
                    loading="lazy"
                    decoding="async"
                    width={1200}
                    height={833}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 pt-4 sm:pt-5 px-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-neutral-950 font-display tracking-tight group-hover:text-blue-600 transition-colors inline-flex items-center gap-1.5">
                      {project.name}
                      <ArrowUpRight className="w-5 h-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
                      {project.industry} &middot; {project.location}
                    </p>
                    <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed mt-3 max-w-xl">
                      {project.summary}
                    </p>
                  </div>
                  {project.concept && (
                    <span className="shrink-0 text-[11px] font-mono font-medium text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/60">
                      Concept
                    </span>
                  )}
                </div>
              </a>
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
            <p className="mt-10 text-[11px] text-neutral-400 leading-relaxed">
              Projects marked &ldquo;Concept&rdquo; are self-initiated designs by Axeon Studio and are not affiliated with or endorsed by the businesses shown.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
