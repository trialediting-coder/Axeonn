import Link from 'next/link';
import { PricingSection } from '@/components/PricingSection';
import { SpeedToLeadBand } from '@/components/home/Testimonials';
import { GrowthEngine } from '@/components/common/GrowthEngine';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/pricing',
  title: 'Pricing: Plans to Get More Customers | Axeon Studio',
  description:
    'Website and marketing pricing: Essentials ($2,800 setup, from $284/mo) or AxeonCORE ($5,800 setup, from $574/mo). Backed by a 90-day guarantee.',
});

// Order: guarantee + plans -> 21x band (why AxeonCORE) -> add-ons + engine -> FAQ -> CTA.
// The guarantee is stated once, in the blue band above the plans.
export default function PricingPage() {
  return (
    <main className="pt-24">
      <BreadcrumbJsonLd items={[{ name: 'Pricing', path: '/pricing' }]} />
      <h1 className="sr-only">Website Design &amp; Digital Marketing Pricing — Des Moines, Iowa</h1>
      <PricingSection
        includeFaqSchema
        tightTop
        afterPlans={<SpeedToLeadBand />}
        beforeFaq={
          <div className="mt-16 sm:mt-20 max-w-6xl mx-auto">
            <GrowthEngine variant="card" showBuilds={false} />
          </div>
        }
      />
      <section className="w-full py-20 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ GET STARTED ]</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight mb-6">
            Ready for more customers?
          </h2>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Book a free 20-minute call. We&apos;ll tell you straight which plan fits, and you&apos;ll see your new
            homepage before you pay anything.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
            <Link
              href="/book"
              data-track="cta_click"
              data-track-cta="pricing_closer"
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Free Strategy Call
            </Link>
            <a
              href="tel:+15154938017"
              className="px-8 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-base transition-colors"
            >
              Call (515) 493-8017
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
