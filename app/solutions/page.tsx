import Link from 'next/link';
import { niches, type NicheCategory } from '@/data/nichesData';
import { NicheCard } from '@/components/niches/NicheCard';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/solutions',
  title: 'Patient & Client Intake for Practices & Firms | Axeon Studio',
  description:
    'Intake infrastructure for dental practices, med spas, law firms and accounting firms: every missed call and web inquiry answered within 60 seconds, 24/7, consultations booked, and a review request after every visit.',
});

const GROUPS: { category: NicheCategory; label: string }[] = [
  { category: 'Healthcare', label: '[ HEALTHCARE ]' },
  { category: 'Professional Services', label: '[ PROFESSIONAL SERVICES ]' },
];

const EYEBROW = 'text-xs font-mono font-bold tracking-widest text-blue-600 uppercase';

export default function SolutionsHubPage() {
  return (
    <main className="w-full pt-36 sm:pt-40 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <BreadcrumbJsonLd items={[{ name: 'Who we help', path: '/solutions' }]} />
      <div className="max-w-6xl mx-auto">
        <p className={`${EYEBROW} mb-3`}>[ WHO WE HELP ]</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.05] text-balance text-neutral-950 mb-5 max-w-4xl">
          Built for established practices and professional firms.
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-14">
          Dental practices, med spas, law firms and CPA firms lose new patients and clients in the same place: the call or form
          nobody answers until tomorrow. Pick yours to see where it happens and how we answer it within 60 seconds. AxeonCORE
          starts at $799/mo with a 90-day performance commitment.
        </p>

        <div className="flex flex-col gap-14">
          {GROUPS.map(({ category, label }) => {
            const group = niches.filter((n) => n.category === category);
            if (group.length === 0) return null;
            return (
              <section key={category} aria-label={category}>
                <p className={`${EYEBROW} mb-5`}>{label}</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  {group.map((niche) => (
                    <NicheCard key={niche.slug} niche={niche} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Not one of the four? Point to the audit instead of promising "any business". */}
        <div
          id="other-practices"
          className="mt-16 rounded-3xl bg-neutral-950 text-white p-8 sm:p-12 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.28),transparent)]"
          />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-4">
              A different kind of practice or firm?
            </h2>
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-8">
              If your practice or firm books consultations or appointments, it runs on the same thing: a call or an inquiry that
              needs an answer before the person calls someone else. Start with the free after-hours audit and we will tell
              you honestly whether the system fits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/audit"
                data-track="cta_click"
                data-track-cta="solutions_hub_audit"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all"
              >
                Get your free after-hours audit
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
