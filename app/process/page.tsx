import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Process } from '@/components/home/Process';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/process',
  title: 'Our Process: Live in 30 Days | Axeon Studio',
  description:
    'How Axeon installs a website, 60-second intake and review requests for practices and firms: area check, live within 30 days, then your first 90 days together.',
});


export default function ProcessPage() {
  return (
    <main className="pt-24">
      <BreadcrumbJsonLd items={[{ name: 'Process', path: '/process' }]} />
      <h1 className="sr-only">How We Install Patient and Client Intake</h1>
      {/* Purpose: the four steps from area check to live. Rendered by components/home/Process (shared with the homepage, owned outside this page). */}
      <Process />

      {/* What we hold ourselves to through the first 90 days (no client results claimed). */}
      {/* Purpose: the 90-day performance commitment in full. */}
      <section className="w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
          <span className="lg:col-span-4 block text-[96px] sm:text-[160px] lg:text-[190px] leading-[0.82] font-black font-display tracking-tighter text-blue-600">
            90
          </span>
          <div className="lg:col-span-8">
            <span className="block text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
              [ THE 90-DAY PERFORMANCE COMMITMENT ]
            </span>
            <p className="mt-2 sm:mt-3 text-[22px] sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.15]">
              Live in 30 days, 60-second replies, review requests on every visit. Or walk away.
            </p>
            <p className="mt-3 sm:mt-4 text-[15px] sm:text-lg text-neutral-600 leading-relaxed">
              Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60
              seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and
              don&apos;t fix it within 15 days, you can walk away and owe nothing for the rest of the term.
            </p>
          </div>
        </div>
      </section>

      {/* Purpose: the next step: check your area (exclusivity, $0 to start), or see pricing. */}
      <section className="w-full py-12 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ STEP ONE ]</span>
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight mb-4 sm:mb-6">
            Start by checking your area
          </h2>
          <p className="text-base sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            One practice or firm per specialty within 5 miles. We&apos;ll confirm yours within one business day, then show
            you what we found about your practice or firm on a short call. $0 to start. Nothing due until it&apos;s working.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="process_closer"
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Check if your area is open
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-base transition-colors"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
