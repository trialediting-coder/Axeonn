// app/axeonproof/page.tsx
// AxeonPROOF, shown off: the dashboard rendered live for an example business in a
// window the visitor can scroll, every tab to click through, the analytics
// cards with notes, how the 90-day guarantee is tracked, and what each plan
// switches on. Example data lives in data/proofPage.ts.
import Link from 'next/link';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { Eyebrow } from '@/components/marketing-solutions/SolutionSections';
import { ServiceClosingCta, GUARANTEE_LINE, GUARANTEE_TERMS } from '@/components/marketing-solutions/ServiceClosingCta';
import { ProofWindow } from '@/components/axeonproof/ProofWindow';
import { ProofTour } from '@/components/axeonproof/ProofTour';
import { ProofHotspots } from '@/components/axeonproof/ProofHotspots';
import { HeroGrid } from '@/components/axeonproof/HeroGrid';
import { GuaranteeScrubber } from '@/components/axeonproof/GuaranteeScrubber';
import { PageIntro } from '@/components/axeonproof/PageIntro';
import { CustomCursor } from '@/components/axeonproof/CustomCursor';
import { DashboardShell } from '@/components/axeonproof/DashboardShell';
import { OverviewScreen } from '@/components/axeonproof/screens';
import { EXAMPLE } from '@/data/proofPage';

const DESCRIPTION =
  'AxeonPROOF is the client dashboard every Axeon client signs into: every call, lead and booked job, where each one came from, and how the 90-day guarantee is tracking. Click through a live example.';

export const metadata = buildMetadata({
  path: '/axeonproof',
  title: 'AxeonPROOF Client Dashboard | Axeon Studio',
  description: DESCRIPTION,
});

const jsonLd = serviceJsonLd({
  path: '/axeonproof',
  serviceType: 'Client marketing dashboard',
  name: 'AxeonPROOF',
  description: DESCRIPTION,
});

const APP_URL = 'https://app.axeonstudio.co';

const GUARANTEE_STEPS = [
  {
    n: '1',
    title: 'Kickoff: your starting point, set together',
    body: 'On the kickoff call we agree how many calls and leads you were getting before. That number is written into your dashboard.',
  },
  {
    n: '2',
    title: 'Day one: every call and form counted',
    body: 'From the day your site goes live, every call, text, form and booking lands in PROOF with the page and campaign behind it.',
  },
  {
    n: '3',
    title: 'Day 90: the comparison is on your screen',
    body: 'Your baseline sits next to this month, in the open, in your own dashboard. Not in our slide deck.',
  },
];

const PLANS = [
  {
    name: 'Essentials',
    price: '$149/mo',
    note: 'The basics, live from your site.',
    items: ['Overview: visits, who reached out, estimated customers', 'Leads: every call, text, form and booking', 'Business email and spam checks', 'Billing and invoices'],
    featured: false,
  },
  {
    name: 'AxeonCORE',
    price: '$299/mo',
    note: 'Where PROOF comes alive. Recommended.',
    items: ['Everything in Essentials', 'Calls: tracked numbers, missed-call text-back', 'Bookings: online scheduling and AI chat', 'Reviews: requests after every job', '90-Day Customer Guarantee tracking'],
    featured: true,
  },
  {
    name: 'AxeonGROWTH',
    price: '$999/mo + ad spend',
    note: 'Ads and the phone, handled.',
    items: ['Everything in AxeonCORE', 'Ads: every dollar next to the jobs it brought in', 'AI receptionist: every call answered, 24/7', 'Monthly strategy call'],
    featured: false,
  },
];

export default function AxeonProofPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'AxeonPROOF', path: '/axeonproof' }]} />
      <PageIntro />
      <CustomCursor />

      {/* Hero: the headline, then the dashboard standing up out of the dark. */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 pb-20 pt-28 text-white sm:px-8 sm:pb-28 sm:pt-36 lg:px-16">
        <HeroGrid />
        <div className="pointer-events-none relative mx-auto max-w-4xl text-center [&_a]:pointer-events-auto">
          <div className="proof-hero-stagger animate-proof-rise" style={{ animationDelay: '1050ms' }}>
            <Eyebrow label="AxeonPROOF" onDark className="mb-5" />
          </div>
          <h1 style={{ animationDelay: '1150ms' }} className="proof-hero-stagger animate-proof-rise text-balance font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Every call, lead and booked job. One screen.
          </h1>
          <p style={{ animationDelay: '1300ms' }} className="mx-auto mt-6 max-w-2xl proof-hero-stagger animate-proof-rise text-lg leading-relaxed text-neutral-300 sm:text-xl">
            The dashboard every Axeon client signs into. See what your marketing brought in this month, where each customer came from, and what we are building next. No report to decode.
          </p>
          <div style={{ animationDelay: '1450ms' }} className="mt-9 flex proof-hero-stagger animate-proof-rise flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/book"
              data-track="cta_click"
              data-track-cta="axeonproof_hero"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-700"
            >
              Book My Free Call <ArrowRight size={18} />
            </Link>
            <a href={APP_URL} className="inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-neutral-300 transition-colors hover:text-white">
              Already a client? Sign in <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="relative bg-white px-4 pb-16 sm:px-8 sm:pb-24 lg:px-16">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-neutral-950 sm:h-56" />
        <div className="relative">
          <ProofWindow caption={`${EXAMPLE.name} is an example business and this is an example month, not a client's results. The screens are the real app.`}>
            <DashboardShell tab="overview">
              <OverviewScreen />
            </DashboardShell>
          </ProofWindow>
        </div>
      </section>

      {/* Every tab, driven by the visitor. */}
      <section className="w-full bg-white px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl sm:mb-14">
            <Eyebrow label="Every tab" className="mb-4" />
            <h2 className="text-balance font-display text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Click around. It is the real thing.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
              Every screen a client sees, from the first lead to the invoice. A tab outside your plan stays visible and shows an example month, so you always know what the next plan adds and what it would cost you not to.
            </p>
          </div>
          <ProofTour />
        </div>
      </section>

      {/* The analytics cards with notes. */}
      <section className="w-full bg-neutral-50 px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl sm:mb-14">
            <Eyebrow label="Numbers you can act on" className="mb-4" />
            <h2 className="text-balance font-display text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Each card answers a question an owner actually asks.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
              Hover or tap a card. Every number comes straight from the site and the tracked phone number, not from a report someone typed up.
            </p>
          </div>
          <ProofHotspots />
        </div>
      </section>

      {/* How the guarantee is kept honest. */}
      <section className="w-full bg-neutral-950 px-4 py-16 text-white sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <Eyebrow label="90-Day Customer Guarantee" onDark className="mb-4" />
              <h2 className="text-balance font-display text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                The guarantee lives in your dashboard, not in our promises.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-300">{GUARANTEE_LINE}</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">{GUARANTEE_TERMS}</p>
            </div>
            <ol className="space-y-4">
              {GUARANTEE_STEPS.map((s) => (
                <li key={s.n} className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{s.n}</span>
                  <div>
                    <h3 className="text-lg font-bold leading-snug">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-400 sm:text-base">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-10 sm:mt-14">
            <GuaranteeScrubber />
          </div>
        </div>
      </section>

      {/* What each plan switches on. */}
      <section className="w-full bg-white px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl sm:mb-14">
            <Eyebrow label="Included with your plan" className="mb-4" />
            <h2 className="text-balance font-display text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Every plan gets a sign-in. Bigger plans switch on more tabs.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-3xl p-6 sm:p-8 ${p.featured ? 'bg-neutral-950 text-white ring-2 ring-blue-600' : 'bg-white text-neutral-950 ring-1 ring-neutral-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight">{p.name}</h3>
                    <p className={`mt-1 text-sm ${p.featured ? 'text-neutral-400' : 'text-neutral-500'}`}>{p.note}</p>
                  </div>
                  {p.featured ? <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">Recommended</span> : null}
                </div>
                <p className="mt-5 text-2xl font-black tracking-tight">{p.price}</p>
                <ul className={`mt-6 space-y-2.5 text-sm ${p.featured ? 'text-neutral-200' : 'text-neutral-700'}`}>
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check size={16} className={`mt-0.5 shrink-0 ${p.featured ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-neutral-500">
            $99 to start on Essentials and AxeonCORE.{' '}
            <Link href="/pricing" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">
              Compare plans <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </section>

      <ServiceClosingCta trackId="axeonproof" />
    </main>
  );
}
