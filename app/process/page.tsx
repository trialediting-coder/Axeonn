import Link from 'next/link';
import { Process } from '@/components/home/Process';
import { Testimonials } from '@/components/home/Testimonials';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/process',
  title: 'Our Process | Axeon Studio',
  description:
    'The async 7-to-14-day framework we use to design, build, and launch every Axeon Studio project.',
});

export default function ProcessPage() {
  return (
    <main className="pt-24">
      <BreadcrumbJsonLd items={[{ name: 'Process', path: '/process' }]} />
      <h1 className="sr-only">Our 7–14 Day Website Design Process</h1>
      <Process />
      <Testimonials />
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to get started?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we'll map out exactly how your 7-14 day build would run.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              See Pricing
            </Link>
          </div>
          <Link
            href="/why-axeon"
            className="inline-block mt-8 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            See exactly how we compare to a typical agency →
          </Link>
        </div>
      </section>
    </main>
  );
}
