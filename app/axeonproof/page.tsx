// app/axeonproof/page.tsx
// AxeonPROOF, shown off on black: the dashboard rendered live for a fictional
// demo dental practice in a window the visitor can scroll, every tab to click through,
// the analytics cards with notes, the 90-day performance commitment you can drag through,
// and what each plan switches on (each plan links to pricing). Example data
// lives in data/proofPage.ts. Owner 2026-10-13: whole page black, cleaner and
// wider, one Live pill, "Book My Free Demo". 2026-10-14: one silk flow behind
// the whole page (FlowField, fixed), no cursor effect, and every
// section in the hero's language (components/axeonproof/ui.tsx).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { GUARANTEE_LINE, GUARANTEE_TERMS } from '@/components/marketing-solutions/ServiceClosingCta';
import { ProofWindow } from '@/components/axeonproof/ProofWindow';
import { ProofTour } from '@/components/axeonproof/ProofTour';
import { ProofHotspots } from '@/components/axeonproof/ProofHotspots';
import { GuaranteeScrubber } from '@/components/axeonproof/GuaranteeScrubber';
import { PageIntro } from '@/components/axeonproof/PageIntro';
import { DashboardShell } from '@/components/axeonproof/DashboardShell';
import { OverviewScreen } from '@/components/axeonproof/screens';
import { FlowField } from '@/components/axeonproof/FlowField';
import { VerticalSwitcher } from '@/components/axeonproof/VerticalSwitcher';
import { Accent, CTA, CTA_GLASS, GLASS, H2, Pill } from '@/components/axeonproof/ui';
import { EXAMPLE } from '@/data/proofPage';

const DESCRIPTION =
  'AxeonPROOF is the client portal every AxeonCORE and AxeonGROWTH practice and firm signs into: a live counter of recovered calls and inquiries, booked consultations, review requests, change requests and monthly reports. The same dashboard runs for dental practices, med spas, law firms and CPA firms. Click through a demo.';

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
const SECTION = 'w-full px-4 py-20 sm:px-8 sm:py-28 lg:px-14';

const GUARANTEE_STEPS = [
  { n: '1', title: 'Live within 30 days', body: 'Once we have your materials and access, your website, phone and text numbers, booking and review requests go live within 30 days. The date is on your dashboard.' },
  { n: '2', title: 'Every reply timed', body: 'Every missed call and web inquiry is logged with how long the first reply took. You see the 60-second line, and every event against it.' },
  { n: '3', title: 'Every review request counted', body: 'Each completed appointment shows whether a review request went out. If something slips, it is on your screen, not buried in our report.' },
];

const PLANS = [
  { name: 'AxeonCORE', price: 'From $799/mo', note: 'Where most practices and firms start.', items: ['Overview with the live recovered-inquiry counter', 'Leads: every call, text, form and booking', 'Calls: tracked numbers, missed-call text-back', 'Bookings: online consultation booking', 'Reviews: a request after every appointment', '90-day performance commitment tracking', 'Change requests and monthly reports'], featured: true },
  { name: 'AxeonGROWTH', price: 'From $1,999/mo + ad spend', note: 'Intake plus active acquisition.', items: ['Everything in AxeonCORE', 'Ads: every dollar next to the inquiries it brought in', 'AI receptionist: every call answered, 24/7', 'Monthly strategy call and quarterly review'], featured: false },
];

/** Section header in the hero's language: pill, headline with an accent word, intro to the right. */
function SectionHead({ pill, title, intro }: { pill: string; title: ReactNode; intro?: string }) {
  return (
    <div className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16">
      <div>
        <Pill className="mb-6">{pill}</Pill>
        <h2 className={H2}>{title}</h2>
      </div>
      {intro ? <p className="max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:justify-self-end">{intro}</p> : null}
    </div>
  );
}

export default function AxeonProofPage() {
  return (
    <main className="relative isolate w-full bg-neutral-950 text-white">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'AxeonPROOF', path: '/axeonproof' }]} />
      <PageIntro />

      {/* One flow behind the whole page, fixed to the screen so every section
          sits on the same silk. No cursor effect (owner removed it 2026-10-14). */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <FlowField className="h-full w-full" />
        <div className="absolute inset-0 bg-neutral-950/30" />
      </div>

      {/* Hero: headline across the left, the pitch and buttons on the right,
          then the live dashboard rising out of the flow in a glass bezel. */}
      <section style={{ animationDelay: '2850ms' }} className="proof-hero-stagger animate-proof-settle relative px-4 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40 lg:px-14">
        <div className={`${WRAP} max-w-[1400px]`}>
          {/* Centered, but wide: the headline runs across two lines on desktop, with room between each piece. */}
          <div className="mx-auto flex max-w-[1240px] flex-col items-center text-center">
            <div className="proof-hero-stagger animate-proof-rise" style={{ animationDelay: '3000ms' }}>
              <Pill tag="New" href="#proof-live">
                Say hello to AxeonPROOF
              </Pill>
            </div>
            <h1 style={{ animationDelay: '3100ms' }} className="proof-hero-stagger animate-proof-rise mt-8 text-balance font-display text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-wrap lg:text-7xl xl:text-[5.25rem]">
              Every call, inquiry <Accent>and</Accent> booked consultation,
              <br className="hidden lg:block" /> on one screen.
            </h1>
            <p style={{ animationDelay: '3250ms' }} className="proof-hero-stagger animate-proof-rise mt-8 max-w-3xl text-lg leading-relaxed text-neutral-300 sm:text-xl">
              The portal every AxeonCORE and AxeonGROWTH practice and firm signs into. How many missed calls and after-hours inquiries were recovered, how fast each got a reply, and which turned into booked exams, consults, case reviews and client meetings.
            </p>
            <div style={{ animationDelay: '3400ms' }} className="proof-hero-stagger animate-proof-rise mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link href="/audit" data-track="cta_click" data-track-cta="axeonproof_hero" className={`${CTA} w-full max-w-xs sm:w-auto`}>
                Get your free after-hours audit <ArrowRight size={18} />
              </Link>
              <a href="#proof-live" className={`${CTA_GLASS} w-full max-w-xs sm:w-auto`}>
                See It Live
              </a>
            </div>
            <a href={APP_URL} style={{ animationDelay: '3450ms' }} className="proof-hero-stagger animate-proof-rise mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-200 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white">
              Already a client? Sign in <ExternalLink size={14} />
            </a>
          </div>

          <div id="proof-live" className="relative mt-16 scroll-mt-24 sm:mt-20">
            <ProofWindow caption={`${EXAMPLE.demoLabel}. Example month, not a client's results. The screens are the real app.`}>
              <DashboardShell tab="overview">
                <OverviewScreen />
              </DashboardShell>
            </ProofWindow>
            <VerticalSwitcher />
          </div>
        </div>
      </section>

      {/* Every tab, driven by the visitor. */}
      <section className={SECTION}>
        <div className={`${WRAP} max-w-[1400px]`}>
          <SectionHead
            pill="Every tab"
            title={
              <>
                Click around. It is the <Accent>real</Accent> thing.
              </>
            }
            intro="Every screen a practice or firm sees, from the first inquiry to the invoice. A tab outside your plan stays visible and shows an example month, so you always know what the next plan adds."
          />
          <ProofTour />
        </div>
      </section>

      {/* The analytics cards with notes. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <SectionHead
            pill="Numbers you can act on"
            title={
              <>
                Each card answers a question an owner <Accent>actually</Accent> asks.
              </>
            }
            intro="Hover or tap a card to see what it tells you. Every number comes straight from the site and the tracked phone number, not from a report someone typed up."
          />
          <ProofHotspots />
        </div>
      </section>

      {/* How the performance commitment is kept honest, and a scrubber to feel it. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <Pill className="mb-6">90-Day Performance Commitment</Pill>
              <h2 className={H2}>
                The commitment lives in your dashboard, <Accent>not</Accent> in our promises.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-200">{GUARANTEE_LINE}</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">{GUARANTEE_TERMS}</p>
            </div>
            <ol className="space-y-3">
              {GUARANTEE_STEPS.map((s) => (
                <li key={s.n} className={`flex gap-5 rounded-3xl p-5 sm:p-6 ${GLASS}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/30">{s.n}</span>
                  <div>
                    <h3 className="text-lg font-bold leading-snug">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-300 sm:text-base">{s.body}</p>
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
          <SectionHead
            pill="Included with your plan"
            title={
              <>
                Both plans get a sign-in. AxeonGROWTH switches on <Accent>more</Accent> tabs.
              </>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {PLANS.map((p) => (
              <Link
                key={p.name}
                href="/pricing"
                data-track="cta_click"
                data-track-cta={`axeonproof_plan_${p.name.toLowerCase()}`}
                className={`group flex flex-col rounded-3xl p-6 transition-colors sm:p-8 ${p.featured ? 'bg-blue-600/90 text-white shadow-2xl shadow-blue-600/30 ring-1 ring-white/25 backdrop-blur-xl hover:bg-blue-500/90' : `${GLASS} hover:ring-white/25`}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight">{p.name}</h3>
                    <p className={`mt-1 text-sm ${p.featured ? 'text-blue-100' : 'text-neutral-400'}`}>{p.note}</p>
                  </div>
                  {p.featured ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700">Most practices and firms</span> : null}
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
                <span className={`mt-8 inline-flex items-center gap-1.5 text-sm font-semibold ${p.featured ? 'text-white' : 'text-blue-300 group-hover:text-blue-200'}`}>
                  See pricing <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-neutral-400">12-month agreement · $3,000 setup included · month-to-month available.</p>
        </div>
      </section>

      {/* Closing: the hero's pitch again, in one glass panel. */}
      <section className={`${SECTION} pb-28 sm:pb-36`}>
        <div className={`${WRAP} rounded-[32px] px-6 py-14 text-center sm:px-12 sm:py-20 ${GLASS}`}>
          <Pill className="mb-6">See it with your numbers</Pill>
          <h2 className={`${H2} mx-auto max-w-3xl`}>
            Ready to see <Accent>your</Accent> own dashboard?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-300">
            Start with the free after-hours audit. We call your practice or firm after hours, time how fast your website answers an inquiry, and show you what PROOF would have caught.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/audit" data-track="cta_click" data-track-cta="axeonproof_closing" className={`${CTA} w-full max-w-xs sm:w-auto`}>
              Get your free after-hours audit <ArrowRight size={18} />
            </Link>
            <Link href="/book" data-track="cta_click" data-track-cta="axeonproof_closing_call" className={`${CTA_GLASS} w-full max-w-xs sm:w-auto`}>
              Book a call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
