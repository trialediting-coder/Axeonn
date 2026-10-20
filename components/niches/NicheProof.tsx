import Link from 'next/link';
import type { Niche } from '@/data/nichesData';

// Honest proof for a practice page (owner rule 2026-10-19): Axeon has no
// practice clients yet, so this section never shows a client result. It shows
// what a practice owner can check for themselves: what we find on their own
// practice (shown on the call after an area check), and AxeonPROOF, the portal every client gets.
export function NicheProof({ niche }: { niche: Niche }) {
  return (
    <section className="w-full bg-blue-600 px-4 py-20 text-white sm:px-10 sm:py-28 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
        <div>
          <p className="text-xs font-mono font-bold tracking-widest text-blue-100 uppercase">[ SEE IT ON YOUR OWN PRACTICE ]</p>
          <p
            aria-hidden="true"
            className="mt-6 whitespace-nowrap text-5xl font-extrabold font-display leading-none tracking-tight sm:text-[72px] lg:text-[88px]"
          >
            After hours &rarr; ?
          </p>
          <h2 className="mt-6 max-w-2xl text-2xl font-extrabold font-display tracking-tight leading-tight text-balance sm:text-3xl">
            Find out what happens when {niche.customerNoun} reach you after hours.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100">
            Check your area and we&apos;ll show you what we found: an after-hours test call, how fast your website answers
            an inquiry, and your reviews next to the top 3 nearby competitors.
          </p>
          <Link
            href="/check-your-area"
            data-track="cta_click"
            data-track-cta={`niche_proof_area_check_${niche.slug}`}
            className="mt-8 inline-flex items-center gap-1 rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Check if your area is open &rarr;
          </Link>
        </div>
        <div className="border-t border-white/25 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-100 uppercase">[ AXEONPROOF ]</p>
          <p className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
            Every client gets a live portal: a counter of recovered inquiries, change requests, and a monthly report.
          </p>
          <p className="mt-3 text-sm text-blue-100">You see every reply and every booking, not a summary we wrote.</p>
          <Link
            href="/axeonproof"
            className="mt-6 inline-flex items-center gap-1 rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Tour AxeonPROOF &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
