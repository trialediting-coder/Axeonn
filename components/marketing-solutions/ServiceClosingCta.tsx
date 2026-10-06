import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Shared closing CTA for /marketing-solutions and its six service pages.
// The guarantee copy is the approved wording from content/brand-guardrails.md:
// never paraphrase it or attach a number to it.

export const GUARANTEE_LINE =
  'More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do.';
export const GUARANTEE_TERMS =
  'Included with AxeonCORE and AxeonGROWTH. Baseline set together on your kickoff call. Applies while you’re on your plan and answering new leads within one business day.';

export function ServiceClosingCta({ trackId }: { trackId?: string }) {
  return (
    <section className="w-full bg-white px-4 sm:px-8 py-16 sm:py-24">
      <div className="relative max-w-5xl mx-auto overflow-hidden rounded-[32px] bg-neutral-950 text-white px-6 py-14 sm:px-14 sm:py-20 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(37,99,235,0.32), transparent 70%)' }}
        />
        <div className="relative">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-5">[ 90-Day Customer Guarantee ]</p>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            Ready for more customers?
          </h2>
          <p className="mt-5 text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl mx-auto">{GUARANTEE_LINE}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/book"
              data-track="cta_click"
              data-track-cta={trackId ? `${trackId}_closing` : undefined}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/30"
            >
              Book My Free Call <ArrowRight size={18} />
            </Link>
            <Link href="/pricing" className="py-2 inline-flex items-center gap-2 font-semibold text-white/80 hover:text-white transition-colors">
              Compare plans <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-8 text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">{GUARANTEE_TERMS}</p>
        </div>
      </div>
    </section>
  );
}
