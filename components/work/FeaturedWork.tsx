import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { WORK_PROJECTS } from '@/data/workProjects';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';

// The one real, published client leads as a Problem -> Solution -> Results
// case study (the pattern proof-first agencies like Blue Corona use). Every
// figure below is from the A-1 build record in data/solutionDetails.ts; never
// add a lift percentage or an unverified number here.
const FEATURED_NAME = 'A-1 Auto Detailing';

const A1_RESULTS = [
  { value: '#1', label: 'on Google for “Pleasant Hill auto detailing,” up from page 2' },
  { value: '180+', label: 'Google reviews at a 5.0 rating, now front and center' },
  { value: '~56', label: 'old URLs redirected, so no search traffic was lost' },
];

/**
 * Homepage proof section, one beat at a time (owner, 2026-10-05: keep it
 * light): the real Google result, three numbers, the owner's words with the
 * CTA, then the rest of the portfolio. The before/after slider lives on the
 * A-1 case study page, not here.
 */
export function FeaturedWork() {
  // Six fills two full rows of three on desktop.
  const more = WORK_PROJECTS.filter((p) => p.name !== FEATURED_NAME).slice(0, 6);

  return (
    <section
      aria-labelledby="featured-work-heading"
      data-track-location="featured_work"
      className="w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="w-full max-w-[1180px] mx-auto">
        {/* 1. Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase">Client Spotlight</p>
            {/* A-1 is on the AxeonCORE plan (owner, 2026-10-05). */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-neutral-950 hover:border-blue-300 transition-colors"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              <span>
                Axeon<span className="text-blue-600">CORE</span>{' '}<span className="font-semibold text-neutral-600">client</span>
              </span>
            </Link>
          </div>
          <h2
            id="featured-work-heading"
            className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08] text-balance"
          >
            A-1 Auto Detailing: Page 2 to #1 on Google
          </h2>
          <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed">
            25 years in Pleasant Hill. Now he’s the first detailer local customers find.
          </p>
        </div>

        {/* 2. The proof: a real Google search (competitor listings blurred) */}
        <figure className="mt-10 sm:mt-14 max-w-[820px] mx-auto">
          <div className="rounded-[20px] sm:rounded-[28px] overflow-hidden bg-[#202124] p-2 sm:p-3 shadow-2xl shadow-neutral-900/20 ring-1 ring-neutral-200">
            {/* Phones get a tighter crop (listing + #1 result, no map) so the text stays legible. */}
            <picture>
              <source media="(max-width: 639px)" srcSet="/images/case-studies/a1/google-rank-1-mobile.webp" width={671} height={601} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/case-studies/a1/google-rank-1.webp"
                width={1159}
                height={931}
                loading="lazy"
                decoding="async"
                alt="Google results for “Pleasant Hill auto detailing”: A-1 Auto Detailing is first in the map listings with a 5.0 rating from 181 reviews and first in the search results."
                className="w-full h-auto rounded-xl sm:rounded-2xl"
              />
            </picture>
          </div>
          <figcaption className="mt-4 text-center text-sm sm:text-base text-neutral-500">
            A real Google search for “Pleasant Hill auto detailing”, October 2026. Other businesses blurred.{' '}
            <a
              href="https://www.google.com/search?q=Pleasant+Hill+auto+detailing"
              target="_blank"
              rel="noopener"
              className="inline-block py-2 font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Search it yourself ↗
            </a>
          </figcaption>
        </figure>

        {/* 3. Three numbers */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-0 sm:divide-x divide-neutral-200 border-y border-neutral-200 py-10 sm:py-12">
          {A1_RESULTS.map((r) => (
            <div key={r.value} className="text-center sm:px-6">
              <p className="font-display font-black tracking-tight text-5xl sm:text-6xl text-neutral-950 tabular-nums">{r.value}</p>
              <p className="mt-2 text-sm sm:text-base text-neutral-600">{r.label}</p>
            </div>
          ))}
        </div>

        {/* 4. The owner's words + the next step */}
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
            className="py-2 inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-neutral-700 hover:text-blue-600 transition-colors"
          >
            Read the full case study <ArrowRight size={16} />
          </Link>
        </div>

        {/* 5. The rest of the portfolio, as large cards */}
        <div className="mt-24 sm:mt-28">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h3 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950">More sites we’ve built</h3>
            <Link href="/work" className="shrink-0 inline-flex items-center gap-1.5 py-2 text-sm sm:text-base font-semibold text-neutral-800 hover:text-blue-600 transition-colors">
              See all projects <ArrowRight size={15} />
            </Link>
          </div>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 overflow-x-auto snap-x snap-mandatory sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {more.map((project) => (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener"
                className="group snap-start shrink-0 w-[85%] sm:w-auto"
              >
                <div className="aspect-[1200/833] rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-lg shadow-neutral-900/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={`${project.name} website homepage`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <p className="mt-4 text-lg sm:text-xl font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">{project.name}</p>
                <p className="mt-0.5 text-sm sm:text-base text-neutral-500">{project.industry} · {project.location}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
