import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Process } from '@/components/home/Process';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/process',
  title: 'Our Website Design & Marketing Process | Axeon Studio',
  description:
    'How we design, launch, and track a website and marketing system that gets you more customers, from the first call through your first 90 days.',
});

const CASE_STUDY = '/insights/a-1-auto-detailing-website-case-study';

export default function ProcessPage() {
  return (
    <main className="pt-24">
      <BreadcrumbJsonLd items={[{ name: 'Process', path: '/process' }]} />
      <h1 className="sr-only">How We Get You More Customers</h1>
      <Process />

      {/* Proof the process works: the A-1 result, as one big stat. */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3]">
        <Link
          href={CASE_STUDY}
          className="group max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end"
        >
          <span className="lg:col-span-4 block text-[110px] sm:text-[160px] lg:text-[190px] leading-[0.82] font-black font-display tracking-tighter text-blue-600">
            #1
          </span>
          <span className="lg:col-span-8 block">
            <span className="block text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
              [ THE PROCESS, IN PRACTICE ]
            </span>
            <span className="mt-3 block text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.15]">
              A-1 Auto Detailing ranks #1 for &ldquo;Pleasant Hill auto detailing,&rdquo; up from page 2.
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-blue-600 group-hover:text-blue-700">
              Read the A-1 case study <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </span>
        </Link>
      </section>

      <section className="w-full py-20 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ GET STARTED ]</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight mb-6">
            Ready for more customers?
          </h2>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Book a free 20-minute call. You&apos;ll see your new homepage before you pay anything.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              href="/book"
              data-track="cta_click"
              data-track-cta="process_closer"
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Free Strategy Call
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
