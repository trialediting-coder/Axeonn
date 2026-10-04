import Link from 'next/link';
import { niches } from '@/data/nichesData';
import { NicheCard } from '@/components/niches/NicheCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/solutions',
  title: 'Marketing for Local Service Industries | Axeon Studio',
  description:
    'Websites, local SEO, and lead follow-up set up for 10 local service industries, from dental and HVAC to roofing and law firms, to get you more customers.',
});

export default function SolutionsHubPage() {
  return (
    <main className="w-full pt-32 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <BreadcrumbJsonLd items={[{ name: 'Industries', path: '/solutions' }]} />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4">
          More Customers for Your Industry
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-14">
          Every industry below gets a purpose-built intake workflow and Custom CRM Pipeline — not a
          find-and-replace template.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {niches.map((niche) => (
            <NicheCard key={niche.slug} niche={niche} />
          ))}
        </div>

        {/* Small Business Section */}
        <div
          id="small-business"
          className="mt-16 rounded-3xl bg-neutral-50 p-8 sm:p-12 border border-neutral-200/80 relative overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-4">
              Don&apos;t See Your Industry? We Get Any Local Business More Customers.
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed mb-8">
              Whether you run a specialty clinic, a regional distributor, or a niche local service, the same system works: get found on Google, get chosen over the competition, and answer every lead in seconds. We set it up around how your customers actually buy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
              >
                Book a Custom Small Business Strategy Call
              </Link>
              <Link
                href="/#axeoncore"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 font-semibold text-sm transition-all"
              >
                See how it works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
