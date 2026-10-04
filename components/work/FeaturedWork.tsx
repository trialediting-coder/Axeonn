'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

// The one real, published client leads as a Problem -> Solution -> Results
// case study (the pattern proof-first agencies like Blue Corona use). Every
// figure below is from the A-1 build record in data/solutionDetails.ts; never
// add a lift percentage or an unverified number here.
const FEATURED_NAME = 'A-1 Auto Detailing';

const A1_STORY = [
  {
    label: 'The problem',
    tone: 'text-rose-600',
    text: '178 five-star reviews, buried. A business-card logo. Dozens of copy-paste town pages Google ignored.',
  },
  {
    label: 'What we built',
    tone: 'text-blue-600',
    text: 'A custom 18-page site with real service pages, before-and-after photos, and a quote form right up top.',
  },
];

const A1_RESULTS = [
  { value: '178', label: 'five-star reviews now front and center' },
  { value: '~56', label: 'old URLs redirected, no search traffic lost' },
  { value: '0.3–0.8s', label: 'page loads on phones' },
];

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[1424/882] w-full overflow-hidden rounded-[20px] sm:rounded-[28px] bg-neutral-900 shadow-2xl shadow-neutral-900/15 ring-1 ring-neutral-200 select-none">
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
      <span className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 px-3 py-1.5 rounded-full bg-neutral-950/85 text-white text-[11px] sm:text-xs font-bold tracking-wider uppercase">
        Before
      </span>
      <span className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-[11px] sm:text-xs font-bold tracking-wider uppercase">
        After
      </span>
      <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white pointer-events-none" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-neutral-900 text-sm font-bold">
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
 * Homepage proof section, one beat at a time: the before/after, the story in
 * two lines, three numbers, the owner's words with the CTA, then the rest of
 * the portfolio as a compact strip.
 */
export function FeaturedWork() {
  const more = WORK_PROJECTS.filter((p) => p.name !== FEATURED_NAME).slice(0, 5);

  return (
    <section
      aria-labelledby="featured-work-heading"
      data-track-location="featured_work"
      className="w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="w-full max-w-[1180px] mx-auto">
        {/* 1. Header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase">Client Results</p>
          <h2
            id="featured-work-heading"
            className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08] text-balance"
          >
            A-1 Auto Detailing, Rebuilt
          </h2>
          <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed">
            25 years in Pleasant Hill, and a website that finally shows it.
          </p>
        </div>

        {/* 2. The before/after, on its own */}
        <div className="mt-12 sm:mt-16">
          <BeforeAfter />
          <p className="mt-4 text-center text-sm text-neutral-500">Drag to compare</p>
        </div>

        {/* 3. The story, two short lines */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-4xl mx-auto">
          {A1_STORY.map((s) => (
            <div key={s.label}>
              <p className={`text-xs font-bold tracking-[0.18em] uppercase ${s.tone}`}>{s.label}</p>
              <p className="mt-3 text-xl sm:text-2xl font-semibold text-neutral-900 leading-snug">{s.text}</p>
            </div>
          ))}
        </div>

        {/* 4. Three numbers */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-0 sm:divide-x divide-neutral-200 border-y border-neutral-200 py-10 sm:py-12">
          {A1_RESULTS.map((r) => (
            <div key={r.value} className="text-center sm:px-6">
              <p className="font-display font-black tracking-tight text-5xl sm:text-6xl text-neutral-950 tabular-nums">{r.value}</p>
              <p className="mt-2 text-sm sm:text-base text-neutral-600">{r.label}</p>
            </div>
          ))}
        </div>

        {/* 5. The owner's words + the next step */}
        <figure className="mt-16 sm:mt-20 text-center max-w-3xl mx-auto">
          <blockquote className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.2]">
            “{LEVI_QUOTE.text}”
          </blockquote>
          <figcaption className="mt-5 text-sm sm:text-base text-neutral-500">
            {LEVI_QUOTE.name}, {LEVI_QUOTE.role}
          </figcaption>
        </figure>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <Link
            href="/get-started"
            data-track="cta_click"
            data-track-cta="work_case_study"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/25"
          >
            Get results like this <ArrowUpRight size={16} />
          </Link>
          <Link
            href={LEVI_QUOTE.href}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-neutral-700 hover:text-blue-600 transition-colors"
          >
            Read the full case study <ArrowRight size={16} />
          </Link>
        </div>

        {/* 6. The rest of the portfolio, kept compact */}
        <div className="mt-24 sm:mt-28">
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
