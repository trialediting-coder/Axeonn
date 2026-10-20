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
  description: 'AxeonPROOF is the client portal every Axeon practice and firm gets: a live counter of recovered inquiries, every reply and booking, and a monthly report.',
});

const jsonLd = serviceJsonLd({
  path: '/axeonproof',
  serviceType: 'Client marketing dashboard',
  name: 'AxeonPROOF',
  description: DESCRIPTION,
});

const APP_URL = 'https://app.axeonstudio.co';
const WRAP = 'mx-auto w-full max-w-7xl';
const SECTION = 'w-full px-4 py-10 sm:px-8 sm:py-28 lg:px-14';

const GUARANTEE_STEPS = [
  { n: '1', title: 'Live within 30 days', body: 'Once we have your materials and access, your website, phone and text numbers, booking and review requests go live within 30 days. The date is on your dashboard.', short: 'Your go-live date is on your dashboard.' },
  { n: '2', title: 'Every reply timed', body: 'Every missed call and web inquiry is logged with how long the first reply took. You see the 60-second line, and every event against it.', short: 'Every missed call and inquiry, logged against the 60-second line.' },
  { n: '3', title: 'Every review request counted', body: 'Each completed appointment shows whether a review request went out. If something slips, it is on your screen, not buried in our report.', short: 'Each completed appointment shows whether a request went out.' },
];

const PLANS = [
  { name: 'AxeonCORE', price: 'From $799/mo', note: 'Where most practices and firms start.', items: ['Overview with the live recovered-inquiry counter', 'Leads: every call, text, form and booking', 'Calls: tracked numbers, missed-call text-back', 'Bookings: online consultation booking', 'Reviews: a request after every appointment', '90-day performance commitment tracking', 'Change requests and monthly reports'], chips: ['Overview + live counter', 'Leads', 'Calls + missed-call text-back', 'Bookings', 'Reviews', '90-day commitment tracking', 'Change requests', 'Monthly reports'], featured: true },
  { name: 'AxeonGROWTH', price: 'From $1,999/mo + ad spend', note: 'Intake plus active acquisition.', items: ['Everything in AxeonCORE', 'Ads: every dollar next to the inquiries it brought in', 'AI receptionist: every call answered, 24/7', 'Monthly strategy call and quarterly review'], chips: ['Everything in CORE', 'Ads + the inquiries they bring', 'AI receptionist, 24/7', 'Monthly strategy call', 'Quarterly review'], featured: false },
];

/** Section header in the hero's language: pill, headline with an accent word, intro to the right. */
function SectionHead({ pill, title, intro, introShort, pillOnPhones = true }: { pill: string; title: ReactNode; intro?: string; introShort?: string; pillOnPhones?: boolean }) {
  return (
    <div className="mb-4 grid gap-2 sm:mb-12 sm:gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16">
      <div>
        <div className={pillOnPhones ? '' : 'hidden sm:block'}>
          <Pill className="mb-3 sm:mb-6">{pill}</Pill>
        </div>
        <h2 className={H2}>{title}</h2>
      </div>
      {intro ? (
        <p className="max-w-xl text-[15px] leading-snug text-neutral-300 sm:text-lg sm:leading-relaxed lg:justify-self-end">
          {introShort ? (
            <>
              <span className="sm:hidden">{introShort}</span>
              <span className="hidden sm:inline">{intro}</span>
            </>
          ) : (
            intro
          )}
        </p>
      ) : null}
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
      {/* Purpose: what AxeonPROOF is, the first CTA, then the live demo dashboard (legible on a phone, labelled demo). */}
      <section style={{ animationDelay: '2850ms' }} className="proof-hero-stagger animate-proof-settle relative px-4 pb-10 pt-28 sm:px-8 sm:pb-28 sm:pt-40 lg:px-14">
        <div className={`${WRAP} max-w-[1400px]`}>
          {/* Centered, but wide: the headline runs across two lines on desktop, with room between each piece. */}
          <div className="mx-auto flex max-w-[1240px] flex-col items-center text-center">
            <div className="proof-hero-stagger animate-proof-rise" style={{ animationDelay: '3000ms' }}>
              <Pill tag="New" href="#proof-live">
                Say hello to AxeonPROOF
              </Pill>
            </div>
            <h1 style={{ animationDelay: '3100ms' }} className="proof-hero-stagger animate-proof-rise mt-5 text-balance font-display text-[36px] font-extrabold leading-[1.06] tracking-tight sm:mt-8 sm:text-6xl sm:leading-[1.04] lg:text-wrap lg:text-7xl xl:text-[5.25rem]">
              Every call, inquiry <Accent>and</Accent> booked consultation,
              <br className="hidden lg:block" /> on one screen.
            </h1>
            <p style={{ animationDelay: '3250ms' }} className="proof-hero-stagger animate-proof-rise mt-4 max-w-3xl text-base leading-relaxed text-neutral-300 sm:mt-8 sm:text-xl">
              The portal every AxeonCORE and AxeonGROWTH practice and firm signs into. How many missed calls and after-hours inquiries were recovered, how fast each got a reply, and which turned into booked exams, consults, case reviews and client meetings.
            </p>
            <div style={{ animationDelay: '3400ms' }} className="proof-hero-stagger animate-proof-rise mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
              <Link href="/check-your-area" data-track="cta_click" data-track-cta="axeonproof_hero" className={`${CTA} w-full max-w-xs sm:w-auto`}>
                Check if your area is open <ArrowRight size={18} />
              </Link>
              <a href="#proof-live" className={`${CTA_GLASS} w-full max-w-xs sm:w-auto`}>
                See It Live
              </a>
            </div>
            <a href={APP_URL} style={{ animationDelay: '3450ms' }} className="proof-hero-stagger animate-proof-rise mt-3 inline-flex min-h-11 items-center sm:mt-7 sm:min-h-0 gap-1.5 text-sm font-semibold text-neutral-200 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white">
              Already a client? Sign in <ExternalLink size={14} />
            </a>
          </div>

          <div id="proof-live" className="relative mt-10 scroll-mt-24 sm:mt-20">
            <ProofWindow caption={`${EXAMPLE.demoLabel}. Example month, not a client's results. The screens are the real app.`}>
              <DashboardShell tab="overview">
                <OverviewScreen />
              </DashboardShell>
            </ProofWindow>
          </div>
          <VerticalSwitcher />
        </div>
      </section>

      {/* Every tab, driven by the visitor. */}
      {/* Purpose: click through every tab of the real app, with what each tab is for and which plan has it. */}
      <section className={SECTION}>
        <div className={`${WRAP} max-w-[1400px]`}>
          <SectionHead
            pill="Every tab"
            title={
              <>
                Click around.{' '}<span className="whitespace-nowrap">It is the</span> <Accent>real</Accent> thing.
              </>
            }
            intro="Every screen a practice or firm sees, from the first inquiry to the invoice. A tab outside your plan stays visible and shows an example month, so you always know what the next plan adds."
            introShort="Every screen a practice or firm sees. Tabs outside your plan show an example month."
          />
          <ProofTour />
        </div>
      </section>

      {/* The analytics cards with notes. */}
      {/* Purpose: what each analytics card tells an owner (tap a card for its note). */}
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
            introShort="Tap a card to see what it tells you. Every number comes straight from the site and the tracked phone number."
          />
          <ProofHotspots />
        </div>
      </section>

      {/* How the performance commitment is kept honest, and a scrubber to feel it. */}
      {/* Purpose: the 90-day commitment and where each part shows in the dashboard; then the scrubber
          (its own heading, so it gets its own screen on phones) to feel the first 90 days. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <div className="grid gap-4 sm:gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <Pill className="mb-3 sm:mb-6">90-Day Performance Commitment</Pill>
              <h2 className={H2}>
                The commitment lives in your dashboard, <Accent>not</Accent> in our promises.
              </h2>
              <p className="mt-3 text-[15px] leading-snug text-neutral-200 sm:mt-6 sm:text-lg sm:leading-relaxed">{GUARANTEE_LINE}</p>
              <p className="mt-2 text-xs leading-snug text-neutral-400 sm:mt-4 sm:text-sm sm:leading-relaxed">{GUARANTEE_TERMS}</p>
            </div>
            <ol className="space-y-2 sm:space-y-3">
              {GUARANTEE_STEPS.map((s) => (
                <li key={s.n} className={`flex gap-3 rounded-2xl px-4 py-3 sm:gap-5 sm:rounded-3xl sm:p-6 ${GLASS}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/30 sm:h-10 sm:w-10">{s.n}</span>
                  <div>
                    <h3 className="text-base font-bold leading-snug sm:text-lg">{s.title}</h3>
                    <p className="mt-0.5 text-sm leading-snug text-neutral-300 sm:mt-1.5 sm:text-base sm:leading-relaxed">
                      <span className="sm:hidden">{s.short}</span>
                      <span className="hidden sm:inline">{s.body}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-10 sm:mt-16">
            <GuaranteeScrubber />
          </div>
        </div>
      </section>

      {/* What each plan switches on; every card goes to pricing. */}
      {/* Purpose: which tabs each plan switches on, with prices and the $0-to-start terms. */}
      <section className={SECTION}>
        <div className={WRAP}>
          <SectionHead
            pill="Included with your plan"
            pillOnPhones={false}
            title={
              <>
                Both plans get a sign‑in. AxeonGROWTH switches on <Accent>more</Accent> tabs.
              </>
            }
          />
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            {PLANS.map((p) => (
              <Link
                key={p.name}
                href="/pricing"
                data-track="cta_click"
                data-track-cta={`axeonproof_plan_${p.name.toLowerCase()}`}
                className={`group flex flex-col rounded-2xl px-4 py-4 transition-colors sm:rounded-3xl sm:p-8 ${p.featured ? 'bg-blue-600/90 text-white shadow-2xl shadow-blue-600/30 ring-1 ring-white/25 backdrop-blur-xl hover:bg-blue-500/90' : `${GLASS} hover:ring-white/25`}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight">{p.name}</h3>
                    <p className={`mt-1 text-sm ${p.featured ? 'text-blue-100' : 'text-neutral-400'}`}>{p.note}</p>
                  </div>
                  {p.featured ? <span className="hidden rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 sm:inline">Most practices and firms</span> : null}
                  <ArrowRight size={18} aria-hidden className={`mt-1 shrink-0 sm:hidden ${p.featured ? 'text-white' : 'text-blue-300'}`} />
                </div>
                <p className="mt-2 text-xl font-black tracking-tight sm:mt-5 sm:text-2xl">{p.price}</p>
                {/* Phones: the tabs each plan switches on, as chips. */}
                <ul className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                  {p.chips.map((chip) => (
                    <li key={chip} className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${p.featured ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-neutral-200 ring-1 ring-white/10'}`}>
                      {chip}
                    </li>
                  ))}
                </ul>
                <ul className={`mt-6 hidden space-y-2.5 text-sm sm:block ${p.featured ? 'text-blue-50' : 'text-neutral-300'}`}>
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check size={16} className={`mt-0.5 shrink-0 ${p.featured ? 'text-white' : 'text-blue-400'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <span className={`mt-8 hidden items-center sm:inline-flex gap-1.5 text-sm font-semibold ${p.featured ? 'text-white' : 'text-blue-300 group-hover:text-blue-200'}`}>
                  See pricing <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-neutral-400 sm:mt-6">$0 to start · $3,000 build waived on the 12-month agreement · nothing due until it&apos;s working.</p>
        </div>
      </section>

      {/* Closing: the hero's pitch again, in one glass panel. */}
      {/* Purpose: the closing ask: check your area (and what the call shows you), or book a call. */}
      <section className={`${SECTION} pb-16 sm:pb-36`}>
        <div className={`${WRAP} rounded-3xl px-5 py-8 text-center sm:rounded-[32px] sm:px-12 sm:py-20 ${GLASS}`}>
          <Pill className="mb-4 sm:mb-6">See it with your numbers</Pill>
          <h2 className={`${H2} mx-auto max-w-3xl`}>
            Ready to see <Accent>your</Accent> own dashboard?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-neutral-300 sm:mt-5 sm:text-lg">
            Start by checking your area. On the call we show you what happens when we call your practice or firm after hours, how fast your website answers an inquiry, and what PROOF would have caught.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-4">
            <Link href="/check-your-area" data-track="cta_click" data-track-cta="axeonproof_closing" className={`${CTA} w-full max-w-xs sm:w-auto`}>
              Check if your area is open <ArrowRight size={18} />
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
