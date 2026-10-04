import Link from 'next/link';
import { Process } from '@/components/home/Process';
import { ClientQuote } from '@/components/common/ClientQuote';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/process',
  title: 'Our Website Design & Marketing Process | Axeon Studio',
  description:
    'How we design, launch, and track a website and marketing system that gets you more customers, from the first call through your first 90 days.',
});

export default function ProcessPage() {
  return (
    <main className="pt-24">
      <BreadcrumbJsonLd items={[{ name: 'Process', path: '/process' }]} />
      <h1 className="sr-only">How We Get You More Customers</h1>
      <Process />
      <ClientQuote />
      <section className="w-full py-20 sm:py-24 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ GET STARTED ]</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight mb-6">
            Ready for more customers?
          </h2>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do.
          </p>
          <p className="mt-3 text-sm text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Baseline set together on your kickoff call. Applies while you&apos;re on a monthly plan and answering new leads within one business day.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
