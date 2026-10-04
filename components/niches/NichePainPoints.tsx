import Link from 'next/link';
import type { Niche, NicheLeak } from '@/data/nichesData';

// "The leaks": one niche-specific story about where customers slip away.
// Leak 01 is the featured dark slab; 02-04 are ruled rows. No icons, no cards,
// so the loss reads as a loss instead of a feature list.
//
// variant="compact" is the /go ad-funnel version: tighter spacing, and the plug
// chips are plain labels because ad pages don't link out.

const pad = (n: number) => String(n).padStart(2, '0');

function PlugChip({ leak, linked, dark = false }: { leak: NicheLeak; linked: boolean; dark?: boolean }) {
  const base =
    'inline-flex max-w-full items-start gap-2 rounded-full px-4 py-2 text-sm font-semibold leading-snug transition-colors';
  const tone = dark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
  const hover = dark ? 'hover:bg-blue-500' : 'hover:bg-blue-100';
  const content = (
    <>
      <span
        className={`shrink-0 pt-[3px] font-mono text-[11px] font-bold tracking-widest ${dark ? 'text-blue-100' : 'text-blue-600'}`}
      >
        [ PLUG ]
      </span>
      <span>{leak.plug}</span>
    </>
  );
  if (!linked) return <span className={`${base} ${tone}`}>{content}</span>;
  return (
    <Link href={leak.plugHref} className={`${base} ${tone} ${hover}`}>
      {content}
    </Link>
  );
}

function CostLine({ cost, dark = false }: { cost: string; dark?: boolean }) {
  return (
    <p className={`font-bold leading-snug ${dark ? 'text-lg sm:text-xl text-white' : 'text-base sm:text-lg text-neutral-950'}`}>
      <span className={`mr-2 font-mono text-xs font-bold tracking-widest ${dark ? 'text-red-300' : 'text-red-600'}`}>
        COSTS YOU &rarr;
      </span>
      {cost}
    </p>
  );
}

export function NichePainPoints({
  niche,
  variant = 'full',
  closerHref = '#how-it-works',
  closerLabel = 'See how',
  closerArrow = 'down',
}: {
  niche: Niche;
  variant?: 'full' | 'compact';
  /** Where the closer points: the workflow on niche pages, the booking form on /go. */
  closerHref?: string;
  closerLabel?: string;
  closerArrow?: 'down' | 'up';
}) {
  const [featured, ...rest] = niche.painPoints;
  if (!featured) return null;
  const compact = variant === 'compact';
  const linked = !compact;

  return (
    <section
      id="the-leaks"
      className={`w-full bg-stone-100 px-4 sm:px-10 lg:px-16 xl:px-24 ${compact ? 'py-16 sm:py-20' : 'py-20 sm:py-28'}`}
    >
      <div className="max-w-6xl mx-auto">
        <p className="mb-4 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
          [ THE LEAKS &middot; {niche.name} ]
        </p>
        <h2
          className={`max-w-4xl font-extrabold font-display tracking-tight leading-[1.05] text-balance text-neutral-950 ${
            compact ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-5xl lg:text-[56px]'
          }`}
        >
          {niche.leakHeadline}
        </h2>

        {/* Leak 01: the featured story */}
        <article
          className={`${compact ? 'mt-10' : 'mt-12 sm:mt-16'} rounded-[28px] bg-neutral-950 p-7 text-white sm:p-12 lg:p-14`}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs font-bold tracking-widest">
            <span className="text-blue-400">LEAK 01</span>
            {featured.stamp && <span className="text-neutral-400">[ {featured.stamp} ]</span>}
          </div>
          <h3 className="mt-5 max-w-3xl text-3xl font-extrabold font-display tracking-tight leading-[1.1] text-balance sm:text-4xl lg:text-[40px]">
            {featured.title}
          </h3>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-300">{featured.scenario}</p>
          <div className="mt-6 max-w-2xl">
            <CostLine cost={featured.cost} dark />
          </div>
          <div className="mt-8">
            <PlugChip leak={featured} linked={linked} dark />
          </div>
        </article>

        {/* Leaks 02-04: ruled rows */}
        <ol className={`${compact ? 'mt-6' : 'mt-10'} border-t border-neutral-300`}>
          {rest.map((leak, i) => (
            <li
              key={leak.title}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-4 border-b border-neutral-300 py-8 sm:gap-x-8 sm:py-10 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,300px)]"
            >
              <span
                aria-hidden="true"
                className="font-display text-5xl font-extrabold leading-none tabular-nums text-blue-600/30 sm:text-[72px]"
              >
                {pad(i + 2)}
              </span>
              <div className="min-w-0">
                <h3 className="text-2xl font-extrabold font-display tracking-tight leading-tight text-neutral-950 sm:text-[28px]">
                  <span className="sr-only">Leak {pad(i + 2)}: </span>
                  {leak.title}
                </h3>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-700">{leak.scenario}</p>
                <div className="mt-4">
                  <CostLine cost={leak.cost} />
                </div>
              </div>
              <div className="col-start-2 lg:col-start-3 lg:row-start-1 lg:self-center lg:justify-self-end">
                <PlugChip leak={leak} linked={linked} />
              </div>
            </li>
          ))}
        </ol>

        <p
          className={`${compact ? 'mt-8' : 'mt-12'} text-xl font-extrabold font-display tracking-tight text-neutral-950 sm:text-2xl`}
        >
          {niche.painPoints.length} leaks. One system plugs all of them.{' '}
          <a href={closerHref} className="whitespace-nowrap text-blue-600 hover:text-blue-700">
            {closerLabel} <span aria-hidden="true">{closerArrow === 'up' ? '↑' : '↓'}</span>
          </a>
        </p>
      </div>
    </section>
  );
}
