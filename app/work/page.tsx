import Link from 'next/link';
import { Work } from '@/components/home/Work';
import { Testimonials } from '@/components/home/Testimonials';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/work',
  title: 'Web Design Portfolio & Concept Builds | Axeon Studio',
  description: 'Concept builds and example layouts showing how Axeon Studio approaches high-conversion websites and intake systems across our core industries.',
});

export default function WorkPage() {
  return (
    <main className="pt-24">
      <BreadcrumbJsonLd items={[{ name: 'Work', path: '/work' }]} />
      <h1 className="sr-only">Web Design Portfolio &amp; Concept Builds</h1>
      <Work />
      <Testimonials />
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Want the real proof?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            See exactly how an Axeon build compares to a typical agency — side by side, not just
            in theory.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/why-axeon"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              See Why Axeon
            </Link>
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
