// components/axeonproof/ui.tsx
// The /axeonproof design language in one place, so every section matches the
// hero: glass pills over the flow, headlines with one serif-italic accent word,
// glass panels, and the glass bezel every dashboard frame sits in.
import type { ReactNode } from 'react';
import { Instrument_Serif } from 'next/font/google';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', display: 'swap' });

/** Frosted panel over the flow (cards, lists, the scrubber). */
export const GLASS = 'bg-neutral-950/55 ring-1 ring-white/15 backdrop-blur-md';
/** Glass frame around a light dashboard window. */
export const BEZEL = 'rounded-[22px] bg-white/[0.06] p-1.5 shadow-[0_50px_140px_-30px_rgba(37,99,235,0.45)] ring-1 ring-white/15 backdrop-blur-md sm:rounded-[28px] sm:p-2.5';
export const H2 = 'text-balance font-display text-[28px] font-extrabold leading-[1.08] sm:leading-[1.06] tracking-tight text-white sm:text-4xl lg:text-5xl';
export const CTA = 'inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500';
export const CTA_GLASS = 'inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-8 py-4 font-bold text-white ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/10';
/** Small label inside a card (replaces the bracket eyebrow on this page). */
export const LABEL = 'text-xs font-bold uppercase tracking-[0.14em] text-blue-300';

/** The one serif-italic word in a headline. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className={`${serif.className} font-normal text-blue-300`}>{children}</em>;
}

/** Glass pill above a headline. With `tag`, a blue chip leads (the hero's "New"); without, a blue dot. */
export function Pill({ children, tag, href, className = '' }: { children: ReactNode; tag?: string; href?: string; className?: string }) {
  const cls = `inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] py-1 pl-1 pr-4 text-xs font-semibold text-neutral-200 ring-1 ring-white/15 backdrop-blur-md sm:text-sm ${href ? 'transition-colors hover:bg-white/10' : ''} ${className}`;
  const lead = tag ? (
    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white sm:text-xs">{tag}</span>
  ) : (
    <span className="my-2 ml-2 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_2px_rgba(96,165,250,0.6)]" aria-hidden />
  );
  return href ? (
    <a href={href} className={cls}>
      {lead}
      {children}
    </a>
  ) : (
    <p className={cls}>
      {lead}
      {children}
    </p>
  );
}
