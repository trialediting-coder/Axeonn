'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Quote } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

// The one real, published client leads as a Problem -> Solution -> Results
// case study (the pattern proof-first agencies like Blue Corona use). Every
// figure below is from the A-1 build record in data/solutionDetails.ts; never
// add a lift percentage or an unverified number here.
const FEATURED_NAME = 'A-1 Auto Detailing';

const A1_PROBLEM =
  '25 years in business and a 5.0 Google rating from 178 reviews, but the old site hid nearly all of it. The logo was a tiny business card with a phone number printed on it, and a “Service Areas” menu led to dozens of copy-paste town pages Google ignores.';

const A1_SOLUTION =
  'We rebuilt it from the logo up: 18 pages with real service pages and guides, before-and-after sliders of customer cars, published starting prices, and a quote form right in the hero that Levi answers himself.';

const A1_RESULTS = [
  { value: '178', unit: 'five-star reviews', label: 'now shown where customers decide, at a 5.0 rating' },
  { value: '~56', unit: 'old URLs', label: '301-redirected, so no search traffic was lost' },
  { value: '0.3–0.8s', unit: 'page loads', label: 'measured on the finished site, so phone visitors don’t bounce' },
];

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[1424/882] w-full overflow-hidden rounded-[18px] sm:rounded-[22px] bg-neutral-900 select-none">
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
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-neutral-950/80 text-white text-[11px] font-bold tracking-wider uppercase">
        Old site
      </span>
      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold tracking-wider uppercase">
        Our rebuild
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
 * Homepage proof section. Shows the work as a client outcome (story, owner,
 * facts) instead of a gallery of homepages, then the rest of the portfolio as
 * a compact strip.
 */
export function FeaturedWork() {
  const featured = WORK_PROJECTS.find((p) => p.name === FEATURED_NAME);
  const more = WORK_PROJECTS.filter((p) => p.name !== FEATURED_NAME).slice(0, 5);

  return (
    <section
      aria-labelledby="featured-work-heading"
      data-track-location="featured_work"
      className="w-full py-20 sm:py-28 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="w-full max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-10 sm:mb-12">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase mb-3">Client Results</p>
            <h2
              id="featured-work-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08]"
            >
              Real Iowa Business. Real Rebuild.
            </h2>
          </div>
          <p className="max-w-md text-base sm:text-lg text-neutral-600 leading-relaxed">
            We measure a website by the calls and quote requests it brings in, not by how it looks in a portfolio.
          </p>
        </div>

        {/* Case study card */}
        <article className="rounded-[28px] sm:rounded-[36px] bg-neutral-950 text-white overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-10 pt-7 sm:pt-9">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/iowa/a1-auto-detailing.png" alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight">A-1 Auto Detailing</h3>
                <p className="text-sm text-neutral-400">
                  Pleasant Hill, Iowa · Website rebuild{featured ? ` · ${featured.date}` : ''}
                </p>
              </div>
            </div>
            <Link
              href={LEVI_QUOTE.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-white transition-colors"
            >
              Read the full case study <ArrowRight size={15} />
            </Link>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-6 sm:px-10 pt-7 sm:pt-9">
            <div className="lg:col-span-7">
              <BeforeAfter />
              <p className="mt-3 text-center text-xs text-neutral-500">Drag to compare the old site with our rebuild.</p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-7">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-rose-300">The problem</p>
                <p className="mt-2 text-[15px] sm:text-base text-neutral-300 leading-relaxed">{A1_PROBLEM}</p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-300">What we built</p>
                <p className="mt-2 text-[15px] sm:text-base text-neutral-300 leading-relaxed">{A1_SOLUTION}</p>
              </div>
              <figure className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                <Quote aria-hidden="true" className="h-5 w-5 text-blue-300" strokeWidth={2.4} />
                <blockquote className="mt-2 text-lg sm:text-xl font-bold leading-snug">“{LEVI_QUOTE.text}”</blockquote>
                <figcaption className="mt-2 text-sm text-neutral-400">
                  {LEVI_QUOTE.name}, {LEVI_QUOTE.role}
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="px-6 sm:px-10 pt-9 pb-7 sm:pb-10">
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-emerald-300 mb-4">The results</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {A1_RESULTS.map((r) => (
                <div key={r.unit} className="rounded-2xl bg-white text-neutral-950 p-5 sm:p-6">
                  <p className="font-display font-black tracking-tight text-3xl sm:text-4xl tabular-nums">
                    {r.value} <span className="text-base sm:text-lg font-bold text-neutral-500">{r.unit}</span>
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 leading-snug">{r.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                href="/get-started"
                data-track="cta_click"
                data-track-cta="work_case_study"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/25"
              >
                Get results like this <ArrowUpRight size={16} />
              </Link>
              <p className="text-sm text-neutral-400 sm:ml-3">
                Your free consultation includes a custom homepage mockup for your business.
              </p>
            </div>
          </div>
        </article>

        {/* The rest of the portfolio, kept compact */}
        <div className="mt-14 sm:mt-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-neutral-950">More sites we’ve built</h3>
            <Link href="/work" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-800 hover:text-blue-600 transition-colors">
              See all projects <ArrowRight size={15} />
            </Link>
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {more.map((project) => (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener"
                className="group snap-start shrink-0 w-[70%] sm:w-auto"
              >
                <div className="aspect-[1200/833] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={`${project.name} website homepage`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <p className="mt-2.5 text-sm font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">{project.name}</p>
                <p className="text-xs text-neutral-500">{project.industry} · {project.location}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
