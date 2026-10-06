import Link from 'next/link';
import { niches, type NicheCategory } from '@/data/nichesData';
import { NicheCard } from '@/components/niches/NicheCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/solutions',
  title: 'Marketing for Local Service Industries | Axeon Studio',
  description:
    'Websites, local SEO, and lead follow-up set up for 10 local service industries, from dental and HVAC to roofing and law firms, to get you more customers.',
});

const GROUPS: { category: NicheCategory; label: string }[] = [
  { category: 'Home & Trade Services', label: '[ HOME & TRADE ]' },
  { category: 'Professional Services', label: '[ PROFESSIONAL ]' },
  { category: 'Healthcare', label: '[ HEALTHCARE ]' },
];

const EYEBROW = 'text-xs font-mono font-bold tracking-widest text-blue-600 uppercase';

export default function SolutionsHubPage() {
  return (
    <main className="w-full pt-36 sm:pt-40 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <BreadcrumbJsonLd items={[{ name: 'Industries', path: '/solutions' }]} />
      <div className="max-w-6xl mx-auto">
        <p className={`${EYEBROW} mb-3`}>[ WHO WE HELP ]</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.05] text-balance text-neutral-950 mb-5 max-w-4xl">
          Every trade leaks customers somewhere different.
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-14">
          Find yours below. Each page shows where your customers slip away and the system that plugs it, backed by our
          90-Day Customer Guarantee.
        </p>

        <div className="flex flex-col gap-14">
          {GROUPS.map(({ category, label }) => {
            const group = niches.filter((n) => n.category === category);
            if (group.length === 0) return null;
            return (
              <section key={category} aria-label={category}>
                <p className={`${EYEBROW} mb-5`}>{label}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.map((niche) => (
                    <NicheCard key={niche.slug} niche={niche} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Small Business Section */}
        <div
          id="small-business"
          className="mt-16 rounded-3xl bg-neutral-950 text-white p-8 sm:p-12 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.28),transparent)]"
          />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-4">
              Don&apos;t See Your Industry? We Get Any Local Business More Customers.
            </h2>
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-8">
              The same system works for any local business: get found on Google, get chosen over the competition, and
              get booked. We set it up around how your customers actually buy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
              >
                Book My Free Call
              </Link>
              <Link
                href="/#axeoncore"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-sm transition-all"
              >
                See how it works &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
