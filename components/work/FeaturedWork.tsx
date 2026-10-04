'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Quote } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { WorkCard } from '@/components/work/WorkCard';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

// The one real, published client leads as a before/after story; the grid
// below keeps WORK_PROJECTS order (MSH always first).
const FEATURED_NAME = 'A-1 Auto Detailing';

const A1_CHANGES = [
  '5.0 Google rating from 178 reviews, now shown where it helps people decide',
  'A quote form right in the hero, answered by Levi himself',
  'A new logo, plus 301s for every old URL so nothing was lost in search',
];

const NICHE_LABELS: Record<string, string> = {
  'real-estate': 'Real Estate',
  'auto-detailing': 'Auto Detailing',
  'home-remodeling': 'Remodeling',
  dental: 'Dental',
};
const labelFor = (slug: string) =>
  NICHE_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[1424/882] w-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-neutral-900 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/case-studies/a1/after-hero.webp"
        alt="A-1 Auto Detailing's new homepage, built by Axeon Studio"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/case-studies/a1/before-hero.webp"
        alt="A-1 Auto Detailing's old homepage"
        loading="lazy"
        decoding="async"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 rounded-full bg-neutral-950/80 text-white text-[11px] font-bold tracking-wider uppercase">
        Before
      </span>
      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold tracking-wider uppercase">
        After
      </span>
      <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white pointer-events-none" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-neutral-900 text-sm font-bold">
          ⇆
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare A-1's old and new homepage"
        style={{ touchAction: 'pan-y' }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  );
}

/**
 * Homepage portfolio, built for conversion: a real client's before/after
 * story with their own words, sites filtered by the visitor's industry, and
 * the free-mockup offer as the section's call to action.
 */
export function FeaturedWork() {
  // "All" skips the featured story (it's right above); an industry filter shows every match.
  const niches = Array.from(new Set(WORK_PROJECTS.map((p) => p.niche)));
  const [niche, setNiche] = useState<string | null>(null);
  const shown = (
    niche ? WORK_PROJECTS.filter((p) => p.niche === niche) : WORK_PROJECTS.filter((p) => p.name !== FEATURED_NAME)
  ).slice(0, 6);

  const tabClass = (active: boolean) =>
    `shrink-0 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
      active
        ? 'bg-neutral-950 border-neutral-950 text-white'
        : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
    }`;

  return (
    <section
      aria-labelledby="featured-work-heading"
      data-track-location="featured_work"
      className="w-full py-20 sm:py-28 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className="max-w-3xl mb-10 sm:mb-14">
          <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">Our Work</p>
          <h2
            id="featured-work-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08]"
          >
            Built Around How Each Business Sells
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">
            Every site starts from how that business actually wins work, not from a theme with the colors changed.
          </p>
        </div>

        {/* Client story: real before/after + the owner's own words */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center rounded-[28px] sm:rounded-[36px] border border-neutral-200 bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="lg:col-span-7">
            <BeforeAfter />
            <p className="mt-3 text-center text-xs text-neutral-500">Drag the handle to compare the old site with the one we built.</p>
          </div>
          <div className="lg:col-span-5 px-2 sm:px-4 lg:px-0 pb-4 lg:pb-0">
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-600">
              Client story · A-1 Auto Detailing
            </p>
            <h3 className="mt-3 text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.12]">
              178 five-star reviews. His website was hiding them.
            </h3>
            <ul className="mt-6 space-y-3">
              {A1_CHANGES.map((change) => (
                <li key={change} className="flex gap-3 text-[15px] text-neutral-700 leading-relaxed">
                  <Check size={18} className="mt-0.5 shrink-0 text-blue-600" strokeWidth={2.5} />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
            <figure className="mt-7 rounded-2xl bg-white border border-neutral-200 p-5">
              <Quote aria-hidden="true" className="h-5 w-5 text-blue-600" strokeWidth={2.4} />
              <blockquote className="mt-2 text-lg font-bold text-neutral-950 leading-snug">“{LEVI_QUOTE.text}”</blockquote>
              <figcaption className="mt-2 text-sm text-neutral-500">
                {LEVI_QUOTE.name}, {LEVI_QUOTE.role}
              </figcaption>
            </figure>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link
                href="/get-started"
                data-track="cta_click"
                data-track-cta="work_client_story"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/20"
              >
                Get a site like this <ArrowUpRight size={16} />
              </Link>
              <Link
                href={LEVI_QUOTE.href}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-neutral-800 font-semibold hover:text-blue-600 transition-colors"
              >
                Read the full story <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Self-selection: sites for the visitor's own industry */}
        <div className="mt-16 sm:mt-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-neutral-950">
              Sites for businesses like yours
            </h3>
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" aria-pressed={niche === null} onClick={() => setNiche(null)} className={tabClass(niche === null)}>
                All
              </button>
              {niches.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  aria-pressed={niche === slug}
                  onClick={() => setNiche(slug)}
                  data-track="industry_selected"
                  data-track-industry={slug}
                  className={tabClass(niche === slug)}
                >
                  {labelFor(slug)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-8">
            {shown.map((project) => (
              <WorkCard key={project.name} project={project} />
            ))}
          </div>
        </div>

        {/* The offer, right where the visitor is judging the work */}
        <div className="mt-16 sm:mt-20 rounded-[28px] sm:rounded-[36px] bg-neutral-950 text-white px-6 py-10 sm:px-12 sm:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h3 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-[1.12]">
              Want to see yours before you spend a dollar?
            </h3>
            <p className="mt-3 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Every free consultation includes a custom homepage mockup for your business and an AI visibility report. Both are yours to keep.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/get-started"
              data-track="cta_click"
              data-track-cta="work_free_mockup"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              Get my free mockup <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/[0.06] transition-colors"
            >
              See all projects
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
