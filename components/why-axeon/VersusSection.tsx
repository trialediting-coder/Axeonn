import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';

export interface VersusStat {
  value: string;
  label: string;
  source: string;
  href: string;
}

export function VersusRows({ typical, axeon }: { typical: string[]; axeon: string[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
      <div className="rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white px-4 py-4 sm:p-8">
        <div className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-2.5 sm:mb-5">
          Typical agency
        </div>
        <ul className="space-y-2 sm:space-y-4">
          {typical.map((item) => (
            <li key={item} className="flex gap-2.5 sm:gap-3 text-[15px] sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">
              <X size={18} className="mt-0.5 sm:mt-1 shrink-0 text-neutral-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl sm:rounded-3xl bg-neutral-950 text-white px-4 py-4 sm:p-8">
        <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-2.5 sm:mb-5">
          Axeon
        </div>
        <ul className="space-y-2 sm:space-y-4">
          {axeon.map((item) => (
            <li key={item} className="flex gap-2.5 sm:gap-3 text-[15px] sm:text-base text-neutral-200 leading-snug sm:leading-relaxed">
              <Check size={18} className="mt-0.5 sm:mt-1 shrink-0 text-blue-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Plain before/after lists with no cards, for the giant-stat layout. */
function VersusLists({ typical, axeon }: { typical: string[]; axeon: string[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 sm:gap-8 border-t border-neutral-200 pt-4 sm:pt-8">
      <div>
        <div className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-2 sm:mb-4">Typical agency</div>
        <ul className="space-y-1.5 sm:space-y-3">
          {typical.map((item) => (
            <li key={item} className="flex gap-2.5 sm:gap-3 text-[15px] sm:text-base text-neutral-500 leading-snug sm:leading-relaxed">
              <X size={18} className="mt-0.5 sm:mt-1 shrink-0 text-neutral-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-2 sm:mb-4">Axeon</div>
        <ul className="space-y-1.5 sm:space-y-3">
          {axeon.map((item) => (
            <li key={item} className="flex gap-2.5 sm:gap-3 text-[15px] sm:text-base text-neutral-900 font-medium leading-snug sm:leading-relaxed">
              <Check size={18} className="mt-0.5 sm:mt-1 shrink-0 text-blue-600" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * 'cards' (default): eyebrow, heading, inline stat, then grey-vs-black cards.
 * 'giant': the stat IS the section -- a full-width giant number with its
 * source, the heading beside it, and plain lists underneath. Use it on
 * alternating sections so consecutive sections don't look alike.
 */
export function VersusSection({
  id,
  eyebrow,
  heading,
  stat,
  typical,
  axeon,
  layout = 'cards',
  tone = 'plain',
  children,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  stat?: VersusStat;
  typical: string[];
  axeon: string[];
  layout?: 'cards' | 'giant';
  tone?: 'plain' | 'warm';
  children?: ReactNode;
}) {
  const bg = tone === 'warm' ? 'bg-[#F7F6F3]' : '';

  if (layout === 'giant' && stat) {
    return (
      // Purpose: one stat that proves the point, the claim, then typical-vs-Axeon in plain lists.
      <section id={id} className={`w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24 ${bg}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3 sm:mb-6">[ {eyebrow} ]</div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-12 items-end mb-5 sm:mb-12">
            <a
              href={stat.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group lg:col-span-6 block"
            >
              <span className="block text-[80px] sm:text-[170px] lg:text-[210px] leading-[0.82] font-black tracking-tighter text-blue-600 font-display">
                {stat.value}
              </span>
              <span className="mt-2 sm:mt-4 block text-lg sm:text-2xl text-neutral-950 font-bold leading-snug">{stat.label}</span>
              <span className="block text-xs font-mono text-neutral-500 mt-1 sm:mt-2 py-1 sm:py-0 group-hover:text-blue-600 transition-colors">
                Source: {stat.source} ↗
              </span>
            </a>
            <h2 className="lg:col-span-6 text-[26px] sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.1] sm:leading-[1.08]">
              {heading}
            </h2>
          </div>
          <VersusLists typical={typical} axeon={axeon} />
          {children}
        </div>
      </section>
    );
  }

  return (
    // Purpose: the claim, one stat behind it, then typical-vs-Axeon side by side.
    <section id={id} className={`w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 ${bg}`}>
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl mb-4 sm:mb-10">
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3 sm:mb-4">[ {eyebrow} ]</div>
          <h2 className="text-[26px] sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.1] sm:leading-[1.08]">
            {heading}
          </h2>
        </div>

        {stat && (
          <a
            href={stat.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-4 sm:mb-8 flex flex-row items-start sm:items-baseline gap-3 sm:gap-5"
          >
            <span className="text-4xl sm:text-6xl font-extrabold tracking-tight text-blue-600 font-display shrink-0">
              {stat.value}
            </span>
            <span className="text-[15px] sm:text-lg text-neutral-800 font-semibold leading-snug sm:leading-normal">
              {stat.label}
              <span className="block text-xs font-mono font-normal text-neutral-500 mt-1 group-hover:text-blue-600 transition-colors">
                Source: {stat.source} ↗
              </span>
            </span>
          </a>
        )}

        <VersusRows typical={typical} axeon={axeon} />
        {children}
      </div>
    </section>
  );
}
