import Link from 'next/link';
import { niches, type NicheCategory } from '@/data/nichesData';
import { NicheCard } from '@/components/niches/NicheCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/solutions',
  title: 'Marketing for Dental, Med Spa, Law & CPA Firms | Axeon',
  description:
    'More new patients and clients for dental practices, med spas, law firms and CPA firms in Des Moines: every call and inquiry answered in 60 seconds, 24/7.',
});

const GROUPS: { category: NicheCategory; label: string }[] = [
  { category: 'Healthcare', label: 'HEALTHCARE' },
  { category: 'Professional Services', label: 'PROFESSIONAL SERVICES' },
];

const EYEBROW = 'eyebrow';

export default function SolutionsHubPage() {
  return (
    <main className="w-full pt-28 sm:pt-40 pb-12 sm:pb-24 px-4 sm:px-10 lg:px-16 xl:px-24">
      <BreadcrumbJsonLd items={[{ name: 'Who we help', path: '/solutions' }]} />
      <div className="max-w-6xl mx-auto">
        {/* Purpose: who this is for, and the one problem all four share. */}
        <p className={`${EYEBROW} mb-3`}>WHO WE HELP</p>
        <h1 className="text-[32px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.08] sm:leading-[1.05] text-balance text-neutral-950 mb-4 sm:mb-5 max-w-4xl">
          Built for established practices and professional firms.
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 leading-snug sm:leading-normal max-w-2xl mb-8 sm:mb-14">
          Dental practices, med spas, law firms and CPA firms lose new patients and clients in the same place: the call or form
          nobody answers until tomorrow. Pick yours to see where it happens and how we answer it within 60 seconds. AxeonCORE
          starts at $799/mo with a 90-day performance commitment.
        </p>

        {/* Purpose: pick your practice type (each card leads with that practice's leak). */}
        <div className="flex flex-col gap-8 sm:gap-14">
          {GROUPS.map(({ category, label }) => {
            const group = niches.filter((n) => n.category === category);
            if (group.length === 0) return null;
            return (
              <section key={category} aria-label={category}>
                <p className={`${EYEBROW} mb-3 sm:mb-5`}>{label}</p>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-6">
                  {group.map((niche) => (
                    <NicheCard key={niche.slug} niche={niche} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Not one of the four? Point to the area check instead of promising "any business". */}
        {/* Purpose: a path for practices outside the four. */}
        <div
          id="other-practices"
          className="mt-10 sm:mt-16 rounded-3xl bg-neutral-950 text-white p-6 sm:p-12 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.28),transparent)]"
          />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-[28px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-3 sm:mb-4">
              A different kind of practice or firm?
            </h2>
            <p className="text-[15px] sm:text-lg text-neutral-300 leading-snug sm:leading-relaxed mb-6 sm:mb-8">
              If your practice or firm books consultations or appointments, it runs on the same thing: a call or an inquiry that
              needs an answer before the person calls someone else. Check if your area is open and we will tell
              you honestly whether the system fits.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
              <Link
                href="/check-your-area"
                data-track="cta_click"
                data-track-cta="solutions_hub_area_check"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
              >
                Check if your area is open
              </Link>
              <Link
                href="/marketing-solutions"
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
