import LineIcon from '@/components/common/LineIcon';
import { notFound } from 'next/navigation';
import { SetupPrice } from '@/components/common/SetupPrice';
import type { Metadata } from 'next';
import { ArrowRight, Check, Phone, ShieldCheck, PhoneCall, Timer, Star } from 'lucide-react';
import { adFunnels, adFunnelFor } from '@/data/adFunnels';
import { niches } from '@/data/nichesData';
import { nicheFaqData } from '@/data/nicheFaqData';
import { FunnelBooking } from '@/components/funnel/FunnelBooking';
import { NichePainPoints } from '@/components/niches/NichePainPoints';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { WORK_PROJECTS } from '@/data/workProjects';
import { TrustBadges } from '@/components/common/TrustBadges';

// Paid-ad landing pages. Not linked from the site, not in the sitemap, noindexed.
export const dynamicParams = false;

export function generateStaticParams() {
  return adFunnels.map((f) => ({ industry: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const { industry } = await params;
  const funnel = adFunnelFor(industry);
  if (!funnel) return {};
  return {
    title: `Get more ${funnel.customers} | ${funnel.titleLabel}`,
    description: `Intake for your ${funnel.business}: every missed call and web inquiry answered within 60 seconds, 24/7, consultations booked, reviews requested. From $799/mo. $0 to start, nothing due until it's working. Check if your area is open.`,
    robots: { index: false, follow: false },
  };
}

const PHONE = '(515) 493-8017';
const PHONE_HREF = 'tel:+15154938017';

// Placeholders for industry proof we don't have yet: visible on Vercel preview
// deploys and local dev so the owner can see what's missing. Opt-in, so a
// production build anywhere (Vercel or not) never renders them.
const SHOW_PLACEHOLDERS = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development';

const COMMITMENT =
  'Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don’t fix it within 15 days, you can walk away and owe nothing for the rest of the term.';

// What we show on the call after an area check: the proof, not the hook.
const CALL_FINDINGS = [
  { icon: PhoneCall, t: 'We call your practice or firm after hours', d: 'The way a new patient or client would, and note what they hear.' },
  { icon: Timer, t: 'We time your website’s reply', d: 'We send an inquiry through your site and clock how long the first answer takes.' },
  { icon: Star, t: 'We compare your reviews', d: 'Your Google reviews next to the top 3 nearby competitors: count, rating and how recent.' },
];

function CTA({ label = 'Check if your area is open', dark = false }: { label?: string; dark?: boolean }) {
  return (
    <a
      href="#book"
      data-track="cta_click"
      data-track-cta="ad_funnel_scroll"
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-colors ${
        dark ? 'bg-white text-neutral-950 hover:bg-neutral-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
      }`}
    >
      {label} <ArrowRight size={18} />
    </a>
  );
}

function Placeholder({ label }: { label: string }) {
  if (!SHOW_PLACEHOLDERS) return null;
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-6 text-center text-amber-900">
      <p className="text-xs font-bold uppercase tracking-wider">Placeholder (preview only, hidden on the live site)</p>
      <p className="mt-2 font-semibold">{label}</p>
    </div>
  );
}

export default async function AdFunnelPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const funnel = adFunnelFor(industry);
  const niche = niches.find((n) => n.slug === industry);
  if (!funnel || !niche) notFound();

  // Only a concept build in this same practice type is shown, and it is always labeled.
  const example = funnel.example ? WORK_PROJECTS.find((p) => p.name === funnel.example) : undefined;
  const showExample = Boolean(example && example.niche === niche.slug);
  const faqs = [
    {
      question: 'What does checking my area mean?',
      answer:
        "We work with one practice or firm per specialty within 5 miles. Tell us your specialty and city and we'll confirm within one business day whether your area is open. On a short call we show you what we found: an after-hours test call, your website's reply speed, and your reviews next to the top 3 nearby competitors.",
    },
    {
      question: 'Is it really $0 to start?',
      answer:
        "Yes. On the 12-month agreement setup is $0 (normally $3,000), and your first monthly payment is charged only once you're live and every call and inquiry is answered within 60 seconds.",
    },
    {
      question: 'What does it cost?',
      answer:
        'AxeonCORE is from $799/mo on a 12-month agreement: $0 setup (normally $3,000) and nothing due until it is working. Month-to-month is available if you pay the $3,000 upfront. AxeonGROWTH, which adds Google Local Services Ads and search ads management, is from $1,999/mo plus ad spend.',
    },
    {
      question: 'What if it doesn’t work?',
      answer: `Our 90-day performance commitment: ${COMMITMENT}`,
    },
    {
      question: 'What do we own?',
      answer:
        'Your domain, your Google Business Profile, and your patient and client contact data are always yours. The website design and code become yours once the 12-month term is paid. The intake system, phone and text numbers, and AxeonPROOF are a service and stop if you leave.',
    },
    ...(nicheFaqData[niche.slug] ?? []),
  ];

  return (
    <main className="bg-white text-neutral-950">
      {/* Top bar: no menu, no links out. Logo + phone only. */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-3">
            <svg width="30" height="25" viewBox="0 0 24 20" fill="currentColor" className="text-blue-600" aria-hidden="true">
              <polygon points="6,0 2,20 6,20 10,0" />
              <polygon points="14,0 10,20 14,20 18,0" />
              <circle cx="21" cy="18" r="2" />
            </svg>
            <span className="font-extrabold text-2xl tracking-tight text-white">Axeon</span>
          </span>
          <a href={PHONE_HREF} className="inline-flex items-center gap-2 min-h-11 px-3 -mr-3 sm:px-0 sm:mr-0 text-sm font-semibold text-white/90 hover:text-white">
            <Phone size={15} /> <span className="hidden sm:inline">{PHONE}</span><span className="sm:hidden">Call</span>
          </a>
        </div>
      </div>

      {/* 1. The offer + the form */}
      {/* Purpose: the offer (result, price, $0 to start) and the form, in the first screen. */}
      <section className="relative bg-neutral-950 text-white pt-24 sm:pt-32 pb-12 sm:pb-24 px-4 sm:px-8 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.28),transparent)]" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7 lg:pt-6">
            <p className="text-sm font-bold tracking-[0.18em] uppercase text-blue-400">For {funnel.audience}</p>
            {/* 31px on phones: every funnel's headline wraps to the same 3 lines in the
                fallback font and in Plus Jakarta Sans, so the font swap moves nothing (CLS). */}
            <h1 className="mt-3 sm:mt-4 text-[31px] min-h-[3lh] sm:min-h-0 sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.05] text-balance">
              Get more {funnel.customers}. Every one answered in 60 seconds.
            </h1>
            <p className="mt-4 text-base sm:text-lg font-semibold text-white">
              From $799/mo. <SetupPrice />. Nothing due until it&apos;s working.
            </p>
            <p className="mt-3 sm:mt-4 text-base sm:text-xl text-neutral-300 leading-relaxed max-w-xl">
              {funnel.result}
            </p>
            <ul className="mt-5 sm:mt-8 flex flex-col gap-2.5 sm:gap-3 text-[15px] sm:text-lg">
              {[
                'Every missed call and web inquiry answered within 60 seconds, 24/7',
                'Consultations booked online, plus a two‑way text inbox for your front desk or intake team',
                'A review request after every appointment',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <LineIcon>
                    <Check size={20} className="text-blue-400" strokeWidth={2.6} />
                  </LineIcon>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 sm:mt-8 grid grid-cols-3 max-w-lg rounded-2xl border border-white/15 divide-x divide-white/15 text-center">
              {[
                { v: '60 sec', l: 'first reply, 24/7' },
                { v: 'from $799', l: 'per month' },
                { v: '90-day', l: 'performance commitment' },
              ].map((o) => (
                <div key={o.l} className="px-2 py-3 sm:px-3 sm:py-4">
                  <p className="text-xl sm:text-3xl font-black font-display tracking-tight">{o.v}</p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-neutral-400 leading-snug">{o.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 sm:mt-6">
              <TrustBadges variant="dark" size="lg" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <FunnelBooking slug={niche.slug} industryName={niche.name} />
          </div>
        </div>
      </section>


      {/* 2. Where they lose customers: the niche's own leaks, right under the offer */}
      <NichePainPoints niche={niche} variant="compact" closerHref="#book" closerLabel="Check if your area is open" closerArrow="up" />

      {/* 3. Proof we can honestly offer: what we find on their own practice, shown on the call */}
      {/* Purpose: what we test on their own practice and show them on the call. */}
      <section className="px-4 sm:px-8 py-10 sm:py-24 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ WHAT WE SHOW YOU ON THE CALL ]</p>
            <h2 className="mt-3 sm:mt-4 text-[26px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] text-balance">
              See what happens when {funnel.customers} reach your {funnel.business} after hours
            </h2>
            <p className="mt-3 sm:mt-5 text-[15px] sm:text-lg text-neutral-600 leading-snug sm:leading-relaxed">
              Once you check your area, we test your own {funnel.business} and go over what we found with you, whether or
              not you work with us.
            </p>
          </div>
          <ol className="mt-5 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5">
            {CALL_FINDINGS.map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white p-4 sm:block sm:p-7">
                <div className="flex items-start sm:items-center justify-between">
                  <LineIcon className="text-base sm:text-xl leading-snug">
                    <Icon size={22} className="text-blue-600" />
                  </LineIcon>
                  <span className="hidden sm:inline font-mono text-xs font-bold text-neutral-400">0{i + 1}</span>
                </div>
                <div>
                  <p className="sm:mt-5 text-base sm:text-xl font-bold leading-snug">{t}</p>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 sm:mt-8 text-sm sm:text-base text-neutral-600 leading-snug sm:leading-normal">
            Clients then see every reply and booking in AxeonPROOF, their live client portal: a recovered-inquiry counter,
            change requests and a monthly report.
          </p>
          <div className="mt-6 sm:mt-10 text-left flex flex-col gap-4 empty:hidden">
            <Placeholder label={funnel.proofPlaceholder} />
            <Placeholder label={`Client testimonial from this practice type (${niche.name})`} />
          </div>
        </div>
      </section>

      {/* 4. Show what they get: a real site we designed, in a browser frame */}
      {/* Purpose: what their website could look like (a labeled concept build in their specialty). */}
      {example && showExample && (
        <section className="px-4 sm:px-8 py-10 sm:py-24 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl">
              <h2 className="text-[26px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
                What your website could look like
              </h2>
              <p className="mt-3 sm:mt-4 text-[15px] sm:text-lg text-neutral-600 leading-snug sm:leading-relaxed">
                Custom-designed, fast on phones, with providers, services, reviews and booking up front.
              </p>
            </div>
            <div className="mt-5 sm:mt-10 rounded-[20px] overflow-hidden bg-neutral-900 shadow-2xl ring-1 ring-black/10">
              <div className="flex items-center gap-1.5 px-4 h-9 bg-neutral-900 border-b border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={example.image}
                alt={`Concept build for ${example.name}, designed by Axeon Studio`}
                width={1200}
                height={833}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Concept build: a self-initiated design for {example.name} ({example.location}). Not a client, and not
              affiliated with or endorsed by the practice.
            </p>
          </div>
        </section>
      )}

      {/* 6. What happens on the call (lowers the fear of booking) */}
      {/* Purpose: the three steps after the form, so booking feels safe. */}
      <section className="px-4 sm:px-8 py-12 sm:py-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[28px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
            What happens after you check your area
          </h2>
          <ol className="mt-6 sm:mt-12 border-l border-white/15 ml-2">
            {[
              { t: 'We confirm your area', d: 'Within one business day: one practice or firm per specialty within 5 miles.' },
              { t: 'We test your practice', d: 'An after-hours call, a timed web inquiry, and a review comparison with the top 3 nearby competitors.' },
              { t: 'If it fits, we partner', d: '$0 to start. Nothing due until it’s working. No pressure either way.' },
            ].map((s) => (
              <li key={s.t} className="relative pl-7 sm:pl-10 pb-6 sm:pb-10 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-neutral-950" />
                <p className="text-lg sm:text-xl font-bold">{s.t}</p>
                <p className="mt-1 sm:mt-1.5 text-[15px] sm:text-lg text-neutral-300 leading-snug sm:leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-7 sm:mt-12">
            <CTA dark />
          </div>
        </div>
      </section>

      {/* 7. Performance commitment */}
      {/* Purpose: the 90-day commitment, in full. */}
      <section className="px-4 sm:px-8 py-10 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border-2 border-emerald-500 p-5 sm:p-9">
            <ShieldCheck size={28} className="text-emerald-600" />
            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight">90-day performance commitment</h2>
            <p className="mt-3 text-base sm:text-lg text-neutral-700 leading-relaxed">{COMMITMENT}</p>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              We commit to what we control: speed, replies and review requests. We never promise a number of patients,
              clients or rankings.
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      {/* Purpose: the last objections; every question in view, answers one tap away. */}
      <section className="px-4 sm:px-8 py-6 sm:py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-2 sm:mb-10">Questions before you check your area</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* 10. Final CTA */}
      {/* Purpose: one last, low-pressure ask. */}
      <section className="px-4 sm:px-8 py-12 sm:py-28 text-center">
        <h2 className="text-[28px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] max-w-3xl mx-auto text-balance">
          Is your specialty still open in your area?
        </h2>
        <p className="mt-5 text-lg text-neutral-600">$0 to start. Nothing due until it&apos;s working. AxeonCORE from $799/mo.</p>
        <div className="mt-7 sm:mt-10">
          <CTA />
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          Rather talk now? Call <a href={PHONE_HREF} className="font-semibold text-neutral-800 underline">{PHONE}</a>
        </p>
      </section>

      {/* Mobile: the call to action is always one tap away */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-neutral-200">
        <a
          href="#book"
          data-track="cta_click"
          data-track-cta="ad_funnel_sticky"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-blue-600 text-white font-bold text-lg"
        >
          Check your area <ArrowRight size={18} />
        </a>
      </div>
      <div className="sm:hidden h-24" aria-hidden="true" />
    </main>
  );
}
