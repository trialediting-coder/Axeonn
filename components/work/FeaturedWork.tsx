'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { WORK_PROJECTS, type WorkProject } from '@/data/workProjects';

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] sm:rounded-[22px] overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_40px_120px_-30px_rgba(37,99,235,0.45)]">
      <div className="flex items-center gap-3 px-4 h-9 sm:h-11 border-b border-white/10 bg-neutral-900">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <div className="flex-1 min-w-0 flex justify-center">
          <span className="truncate max-w-full px-3 py-1 rounded-md bg-white/[0.06] text-[11px] sm:text-xs font-mono text-neutral-400">
            {hostOf(url)}
          </span>
        </div>
        <span className="w-[42px] shrink-0" />
      </div>
      <div className="relative aspect-[1200/833] bg-neutral-800">{children}</div>
    </div>
  );
}

function Screenshot({ project, visible = true }: { project: WorkProject; visible?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={project.image}
      alt={`${project.name} website homepage`}
      loading="lazy"
      decoding="async"
      width={1200}
      height={833}
      className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ease-out ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
      }`}
    />
  );
}

/**
 * Homepage portfolio "showroom": a numbered project index that auto-advances
 * (desktop) beside a browser-framed live preview, and a swipeable rail of
 * framed cards on phones. /work and the service pages keep the WorkCard grid.
 */
export function FeaturedWork({ limit = 6 }: { limit?: number }) {
  const projects = WORK_PROJECTS.slice(0, limit);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = projects[active];

  return (
    <section
      aria-labelledby="featured-work-heading"
      className="relative w-full overflow-hidden bg-neutral-950 text-white py-20 sm:py-28 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="absolute -top-40 right-[10%] w-[720px] h-[720px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.18),transparent)] pointer-events-none" />

      <div className="relative w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 sm:mb-14">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-400 uppercase mb-3">Our Work</p>
            <h2
              id="featured-work-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.08]"
            >
              Built Around How Each Business Sells
            </h2>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Every site starts from how that business actually wins work, not from a theme with the colors changed.
            </p>
          </div>
          <Link
            href="/work"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white font-semibold hover:border-white/40 hover:bg-white/[0.06] transition-colors"
          >
            See all projects <ArrowRight size={16} />
          </Link>
        </div>

        {/* Desktop: index + live preview */}
        <div
          className="hidden lg:grid grid-cols-12 gap-10 xl:gap-16 items-start"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <ol className="col-span-5 border-t border-white/10">
            {projects.map((project, i) => {
              const isActive = i === active;
              return (
                <li key={project.name} className="border-b border-white/10">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className="group relative w-full text-left py-5 xl:py-6 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-5">
                      <span
                        className={`font-mono text-sm tabular-nums transition-colors ${isActive ? 'text-blue-400' : 'text-neutral-600'}`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-4">
                          <span
                            className={`text-2xl xl:text-3xl font-bold font-display tracking-tight transition-colors ${
                              isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
                            }`}
                          >
                            {project.name}
                          </span>
                          <span className="shrink-0 text-xs font-medium text-neutral-500">{project.date}</span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">
                          {project.industry} &middot; {project.location}
                        </p>
                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                            isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <p className="overflow-hidden text-[15px] text-neutral-300 leading-relaxed">
                            <span className="block pt-3">{project.summary}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <span
                        key={active}
                        aria-hidden="true"
                        onAnimationEnd={() => setActive((a) => (a + 1) % projects.length)}
                        className={`work-progress absolute left-0 right-0 -bottom-px h-px bg-blue-400 origin-left ${paused ? '[animation-play-state:paused]' : ''}`}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="col-span-7 sticky top-28">
            <a href={current.url} target="_blank" rel="noopener" className="group block">
              <BrowserFrame url={current.url}>
                {projects.map((project, i) => (
                  <Screenshot key={project.name} project={project} visible={i === active} />
                ))}
                <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-950 text-sm font-bold shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Visit live site <ArrowUpRight size={15} />
                </span>
              </BrowserFrame>
            </a>
          </div>
        </div>

        {/* Phones/tablets: swipeable rail of framed cards */}
        <div className="lg:hidden -mx-4 sm:-mx-8 px-4 sm:px-8 flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {projects.map((project, i) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener"
              className="snap-start shrink-0 w-[86%] sm:w-[60%]"
            >
              <BrowserFrame url={project.url}>
                <Screenshot project={project} />
              </BrowserFrame>
              <div className="flex items-baseline gap-3 pt-4 px-1">
                <span className="font-mono text-xs text-blue-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold font-display tracking-tight inline-flex items-center gap-1.5">
                    {project.name} <ArrowUpRight size={16} className="text-neutral-500" />
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {project.industry} &middot; {project.location} &middot; {project.date}
                  </p>
                  <p className="text-sm text-neutral-400 leading-relaxed mt-2">{project.summary}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
