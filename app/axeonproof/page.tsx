// app/axeonproof/page.tsx
// AxeonPROOF, shown off on black: the dashboard rendered live for an example
// business in a window the visitor can scroll, every tab to click through,
// the analytics cards with notes, the 90-day guarantee you can drag through,
// and what each plan switches on (each plan links to pricing). Example data
// lives in data/proofPage.ts. Owner 2026-10-13: whole page black, cleaner and
// wider, no custom cursor, one Live pill, "Book My Free Demo".
import Link from 'next/link';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { Eyebrow } from '@/components/marketing-solutions/SolutionSections';
import { GUARANTEE_LINE, GUARANTEE_TERMS } from '@/components/marketing-solutions/ServiceClosingCta';
import { ProofWindow } from '@/components/axeonproof/ProofWindow';
import { ProofTour } from '@/components/axeonproof/ProofTour';
import { ProofHotspots } from '@/components/axeonproof/ProofHotspots';
import { PointerGlow } from '@/components/axeonproof/PointerGlow';
import { GuaranteeScrubber } from '@/components/axeonproof/GuaranteeScrubber';
import { PageIntro } from '@/components/axeonproof/PageIntro';
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
const WRAP = 'mx-auto w-full max-w-7xl';
const SECTION = 'w-full border-t border-white/10 px-4 py-20 sm:px-8 sm:py-28 lg:px-14';
const H2 = 'text-balance font-display text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl';
const CTA = 'inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500';

const GUARANTEE_STEPS = [
  { n: '1', title: 'Kickoff: your starting point, set together', body: 'On the kickoff call we agree how many calls and leads you were getting before. That number is written into your dashboard.' },
  { n: '2', title: 'Day one: every call and form counted', body: 'From the day your site goes live, every call, text, form and booking lands in PROOF with the page and campaign behind it.' },
  { n: '3', title: 'Day 90: the comparison is on your screen', body: 'Your baseline sits next to this month, in the open, in your own dashboard. Not in our slide deck.' },
];

const PLANS = [
  { name: 'Essentials', price: '$149/mo', note: 'The basics, live from your site.', items: ['Overview: visits, who reached out, estimated customers', 'Leads: every call, text, form and booking', 'Business email and spam checks', 'Billing and invoices'], featured: false },
  { name: 'AxeonCORE', price: '$299/mo', note: 'Where PROOF comes alive. Recommended.', items: ['Everything in Essentials', 'Calls: tracked numbers, missed-call text-back', 'Bookings: online scheduling and AI chat', 'Reviews: requests after every job', '90-Day Customer Guarantee tracking'], featured: true },
  { name: 'AxeonGROWTH', price: '$999/mo + ad spend', note: 'Ads and the phone, handled.', items: ['Everything in AxeonCORE', 'Ads: every dollar next to the jobs it brought in', 'AI receptionist: every call answered, 24/7', 'Monthly strategy call'], featured: false },
];

export default function AxeonProofPage() {
  return (
    <main className="relative isolate w-full bg-neutral-950 text-white">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'AxeonPROOF', path: '/axeonproof' }]} />
      <PageIntro />
      <PointerGlow />

      {/* Hero: centered headline, then the live dashboard standing up out of the dark. */}
      <section style={{ animationDelay: '1700ms' }} className="proof-hero-stagger animate-proof-settle relative overflow-hidden px-4 pb-14 pt-32 sm:px-8 sm:pb-20 sm:pt-40 lg:px-14">
        <div className={`relative ${WRAP}`}>
          <div className="mx-auto max-w-4xl text-center">
            <div className="proof-hero-stagger animate-proof-rise" style={{ animationDelay: '1850ms' }}>
              <Eyebrow label="AxeonPROOF" onDark className="mb-6" />
            </div>
            <h1 style={{ animationDelay: '1950ms' }} className="proof-hero-stagger animate-proof-rise text-balance font-display text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Every call, lead and booked job. One screen.
            </h1>
            <p style={{ animationDelay: '2100ms' }} className="proof-hero-stagger animate-proof-rise mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
              The dashboard every Axeon client signs into. What your marketing brought in this month, where each customer came from, and what we are building next.
            </p>
            <div style={{ animationDelay: '2250ms' }} className="proof-hero-stagger animate-proof-rise mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link href="/book" data-track="cta_click" data-track-cta="axeonproof_hero" className={CTA}>
                Book My Free Demo <ArrowRight size={18} />
              </Link>
              <a href={APP_URL} className="inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-neutral-400 transition-colors hover:text-white">
                Already a client? Sign in <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-20 sm:px-8 sm:pb-28 lg:px-14">
        <div className={`${WRAP} max-w-[1400px]`}>
          <ProofWindow caption={`${EXAMPLE.name} is an example business and this is an example month, not a client's results. The screens are the real app.`}>
            <DashboardShell tab="overview">
              <OverviewScreen />
            </DashboardShell>
          </ProofWindow>
        </div>
      </section>

      {/* Every tab, driven by the visitor. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <div>
              <Eyebrow label="Every tab" onDark className="mb-4" />
              <h2 className={H2}>Click around. It is the real thing.</h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg lg:justify-self-end">
              Every screen a client sees, from the first lead to the invoice. A tab outside your plan stays visible and shows an example month, so you always know what the next plan adds.
            </p>
          </div>
          <ProofTour />
        </div>
      </section>

      {/* The analytics cards with notes. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <div>
              <Eyebrow label="Numbers you can act on" onDark className="mb-4" />
              <h2 className={H2}>Each card answers a question an owner actually asks.</h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg lg:justify-self-end">
              Hover or tap a card. Every number comes straight from the site and the tracked phone number, not from a report someone typed up.
            </p>
          </div>
          <ProofHotspots />
        </div>
      </section>

      {/* How the guarantee is kept honest, and a scrubber to feel it. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <Eyebrow label="90-Day Customer Guarantee" onDark className="mb-4" />
              <h2 className={H2}>The guarantee lives in your dashboard, not in our promises.</h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-300">{GUARANTEE_LINE}</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">{GUARANTEE_TERMS}</p>
            </div>
            <ol className="space-y-3">
              {GUARANTEE_STEPS.map((s) => (
                <li key={s.n} className="flex gap-5 rounded-2xl p-5 ring-1 ring-white/10 sm:p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{s.n}</span>
                  <div>
                    <h3 className="text-lg font-bold leading-snug">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-400 sm:text-base">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-12 sm:mt-16">
            <GuaranteeScrubber />
          </div>
        </div>
      </section>

      {/* What each plan switches on; every card goes to pricing. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="mb-12 max-w-3xl">
            <Eyebrow label="Included with your plan" onDark className="mb-4" />
            <h2 className={H2}>Every plan gets a sign-in. Bigger plans switch on more tabs.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => (
              <Link
                key={p.name}
                href="/pricing"
                data-track="cta_click"
                data-track-cta={`axeonproof_plan_${p.name.toLowerCase()}`}
                className={`group flex flex-col rounded-3xl p-6 transition-colors sm:p-8 ${p.featured ? 'bg-blue-600 text-white hover:bg-blue-500' : 'ring-1 ring-white/10 hover:bg-white/5 hover:ring-white/20'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight">{p.name}</h3>
                    <p className={`mt-1 text-sm ${p.featured ? 'text-blue-100' : 'text-neutral-400'}`}>{p.note}</p>
                  </div>
                  {p.featured ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700">Recommended</span> : null}
                </div>
                <p className="mt-5 text-2xl font-black tracking-tight">{p.price}</p>
                <ul className={`mt-6 space-y-2.5 text-sm ${p.featured ? 'text-blue-50' : 'text-neutral-300'}`}>
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check size={16} className={`mt-0.5 shrink-0 ${p.featured ? 'text-white' : 'text-blue-400'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <span className={`mt-8 inline-flex items-center gap-1.5 text-sm font-semibold ${p.featured ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'}`}>
                  See pricing <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-neutral-500">$99 to start on Essentials and AxeonCORE. Three-month minimum, then month to month.</p>
        </div>
      </section>

      {/* Closing. */}
      <section className={SECTION}>
        <div className={`${WRAP} grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center`}>
          <div>
            <Eyebrow label="See it with your numbers" onDark className="mb-4" />
            <h2 className={H2}>Ready to see your own dashboard?</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-400">
              A free 30-minute call. We walk through what PROOF would show for your business, and where customers are slipping away today.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <Link href="/book" data-track="cta_click" data-track-cta="axeonproof_closing" className={CTA}>
              Book My Free Demo <ArrowRight size={18} />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-neutral-400 transition-colors hover:text-white">
              Compare plans <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
