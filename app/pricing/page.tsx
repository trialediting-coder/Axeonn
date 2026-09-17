import Link from 'next/link';
import { PricingSection } from '@/components/PricingSection';
import { Testimonials } from '@/components/home/Testimonials';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/pricing',
  title: 'Website & Marketing Pricing | Axeon Studio',
  description:
    'Flat-rate web builds, an Acquisition Engine build, and AxeonCORE, our monthly technology partnership — transparent pricing, no proposals.',
});

export default function PricingPage() {
  return (
    <main className="pt-24">
      <h1 className="sr-only">Web & CRM Pipeline Pricing</h1>
      <PricingSection />
      <Testimonials />
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Still deciding?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we'll walk through exactly which tier fits your business.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="/why-axeon"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              See Why Axeon
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
