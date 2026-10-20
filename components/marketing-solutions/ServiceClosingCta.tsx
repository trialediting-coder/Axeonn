import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { guaranteeSentence } from '@/data/pricingData';

// Shared closing CTA for /marketing-solutions and its six service pages.
// The performance commitment is the exact wording from data/pricingData.ts:
// never paraphrase it or attach a number of patients, revenue or rankings to it.

export const GUARANTEE_LINE = guaranteeSentence;
export const GUARANTEE_TERMS =
  'Included with AxeonCORE and AxeonGROWTH and written into your agreement. We don’t promise a number of new patients, clients, cases, revenue, or rankings. We promise the system does its job, and we stay on as your growth partner.';

// Purpose: the commitment in full and the one next step.
export function ServiceClosingCta({ trackId }: { trackId?: string }) {
  return (
    <section className="w-full bg-white px-4 sm:px-8 py-6 sm:py-24">
      <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl sm:rounded-[32px] bg-neutral-950 text-white px-5 py-9 sm:px-14 sm:py-20 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(37,99,235,0.32), transparent 70%)' }}
        />
        <div className="relative">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-3 sm:mb-5">[ 90-Day Performance Commitment ]</p>
          <h2 className="text-[28px] sm:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            Is your specialty still open in your area?
          </h2>
          <p className="mt-3 sm:mt-5 text-[15px] sm:text-xl text-neutral-300 leading-snug sm:leading-relaxed max-w-2xl mx-auto">{GUARANTEE_LINE}</p>
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-1 sm:gap-6">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta={trackId ? `${trackId}_closing` : undefined}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/30"
            >
              Check if your area is open <ArrowRight size={18} />
            </Link>
            <Link href="/book" className="min-h-11 inline-flex items-center justify-center gap-2 font-semibold text-white/80 hover:text-white transition-colors">
              Book a call <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-4 sm:mt-8 text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">{GUARANTEE_TERMS}</p>
        </div>
      </div>
    </section>
  );
}
