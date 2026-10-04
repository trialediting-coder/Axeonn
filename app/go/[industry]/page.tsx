import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, Check, Phone, ShieldCheck } from 'lucide-react';
import { adFunnels, adFunnelFor } from '@/data/adFunnels';
import { niches } from '@/data/nichesData';
import { benefitHeadlinesBySlug } from '@/data/nicheBenefitHeadlines';
import { nicheFaqData } from '@/data/nicheFaqData';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';
import { FunnelBooking } from '@/components/funnel/FunnelBooking';
import { FAQAccordion } from '@/components/common/FAQAccordion';

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
    title: `Free Website for ${funnel.audience} | Axeon Studio`,
    description: `Get a free website for your ${funnel.business}: $0 setup with a monthly plan from $284/mo, built to get you more ${funnel.customers}.`,
    robots: { index: false, follow: false },
  };
}

const PHONE = '(515) 493-8017';
const PHONE_HREF = 'tel:+15154938017';

// Placeholders for industry proof we don't have yet: visible on local and
// preview builds so the owner can see what's missing, hidden on the live site.
const SHOW_PLACEHOLDERS = process.env.VERCEL_ENV !== 'production';

function CTA({ label = 'Book My Free Call', dark = false }: { label?: string; dark?: boolean }) {
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

  const benefits = benefitHeadlinesBySlug[niche.slug] ?? [];
  const faqs = [
    {
      question: 'Is the website really free?',
      answer:
        'Yes. The $2,800 setup fee for your website build is waived. You only pay the monthly plan, which starts at $284/mo and keeps your site hosted, secure, and bringing in customers, with a monthly report on every call and lead. We confirm the exact monthly price on your call, before you commit to anything.',
    },
    {
      question: 'Do I get anything if I don\u2019t sign up?',
      answer:
        'Yes. Every free call includes a custom homepage mockup for your business and an AI visibility report showing how you show up on Google, ChatGPT, and Perplexity. Both are yours to keep, whether or not you hire us.',
    },
    {
      question: 'What if I want the full system with AI chat and follow-up?',
      answer:
        'That\u2019s our AxeonCORE plan. We\u2019ll walk you through it on the call and price any upgrade before you commit.',
    },
    {
      question: 'What if it doesn’t work?',
      answer:
        'Our 90-Day Customer Guarantee: if you’re not getting more calls and leads in your first 90 days after launch than you were before, we keep working for free until you are.',
    },
    ...(nicheFaqData[niche.slug] ?? []),
  ];

  return (
    <main className="bg-white text-neutral-950">
      {/* Top bar: no menu, no links out. Logo + phone only. */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-extrabold font-display tracking-tight text-white">
            <span className="text-blue-500">//</span> Axeon
          </span>
          <a href={PHONE_HREF} className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
            <Phone size={15} /> <span className="hidden sm:inline">{PHONE}</span><span className="sm:hidden">Call</span>
          </a>
        </div>
      </div>

      {/* 1. The offer + the form */}
      <section className="relative bg-neutral-950 text-white pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.28),transparent)]" />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7 lg:pt-6">
            <p className="text-sm font-bold tracking-[0.18em] uppercase text-blue-400">For {funnel.audience}</p>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.05] text-balance">
              Get a Free Website for Your {funnel.business.replace(/^\w/, (c) => c.toUpperCase())}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-xl">
              $0 setup. Your $2,800 website build is free when you start a monthly plan from $284/mo. {funnel.result}
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-base sm:text-lg">
              {[
                `A custom website built to get you more ${funnel.customers}`,
                '$0 setup: the $2,800 build fee is waived',
                'Free homepage mockup and AI visibility report on your call',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={22} className="mt-0.5 shrink-0 text-blue-400" strokeWidth={2.6} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-neutral-400">Monthly plan from $284/mo covers hosting, security, and your monthly calls &amp; leads report. Backed by our 90-day customer guarantee.</p>
          </div>
          <div className="lg:col-span-5">
            <FunnelBooking slug={niche.slug} industryName={niche.name} />
          </div>
        </div>
      </section>

      {/* 2. Proof, right under the offer */}
      <section className="px-4 sm:px-8 py-14 sm:py-16 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-neutral-200">
            {[
              { v: '#1', l: 'on Google for A-1 Auto Detailing, up from page 2' },
              { v: '180+', l: 'five-star reviews now front and center' },
              { v: '5.0', l: 'client rating' },
              { v: '90-day', l: 'customer guarantee' },
            ].map((p) => (
              <div key={p.l} className="bg-white px-5 py-7 text-center">
                <p className="text-3xl sm:text-4xl font-black font-display tracking-tight">{p.v}</p>
                <p className="mt-1.5 text-sm text-neutral-500 leading-snug">{p.l}</p>
              </div>
            ))}
          </div>
          {funnel.proofPlaceholder && (
            <div className="mt-6">
              <Placeholder label={funnel.proofPlaceholder} />
            </div>
          )}
        </div>
      </section>

      {/* 3. The problem, in their words */}
      <section className="px-4 sm:px-8 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] max-w-3xl">
            Where {funnel.audience.replace(/^Iowa /, '')} lose customers every week
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
            {niche.painPoints.map((pain, i) => (
              <div key={pain} className="rounded-2xl border border-neutral-200 p-6 sm:p-7">
                <p className="text-sm font-bold text-blue-600">{benefits[i] ?? 'What we fix'}</p>
                <p className="mt-2 text-lg text-neutral-800 leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How we fix it */}
      <section className="px-4 sm:px-8 py-20 sm:py-24 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] max-w-3xl">
            How we get you more {funnel.customers}
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: 'Step 1', t: 'Get found', d: 'Show up on Google, on the map, and in AI answers when people nearby search for what you do.' },
              { step: 'Step 2', t: 'Get chosen', d: 'A fast site with your reviews up front that makes you the obvious pick.' },
              { step: 'Step 3', t: 'Get booked', d: 'Every call and form answered in seconds, with automatic follow-up until they book.' },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl bg-white border border-neutral-200 p-7">
                <p className="text-sm font-semibold text-neutral-400">{s.step}</p>
                <h3 className="mt-1 text-2xl font-black font-display tracking-tight">{s.t}</h3>
                <p className="mt-3 text-neutral-700 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <CTA />
          </div>
        </div>
      </section>

      {/* 5. Real result */}
      <section className="px-4 sm:px-8 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold tracking-[0.18em] uppercase text-emerald-600">Client spotlight</p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] text-balance">
            A-1 Auto Detailing went from page 2 to #1 on Google
          </h2>
          <p className="mt-5 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            For &ldquo;Pleasant Hill auto detailing,&rdquo; with 180+ five-star reviews finally front and center.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/case-studies/a1/after-hero.webp"
            alt="A-1 Auto Detailing's new homepage, built by Axeon Studio"
            width={1424}
            height={882}
            loading="lazy"
            className="mt-10 w-full h-auto rounded-2xl shadow-xl ring-1 ring-neutral-200"
          />
          <figure className="mt-10">
            <blockquote className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
              &ldquo;{LEVI_QUOTE.text}&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-neutral-500">
              {LEVI_QUOTE.name}, {LEVI_QUOTE.role}
            </figcaption>
          </figure>
          {funnel.proofPlaceholder && (
            <div className="mt-10 text-left">
              <Placeholder label={`Client testimonial from this industry (${niche.name})`} />
            </div>
          )}
        </div>
      </section>

      {/* 6. What happens on the call (lowers the fear of booking) */}
      <section className="px-4 sm:px-8 py-20 sm:py-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
            What happens on your free call
          </h2>
          <ol className="mt-12 border-l border-white/15 ml-2">
            {[
              { t: 'We look at how customers find you today', d: 'Your Google listing, your site, and how you show up in AI answers.' },
              { t: 'You see your homepage mockup', d: 'A custom design for your business, plus your AI visibility report.' },
              { t: 'You claim your free website', d: '$0 setup, monthly plan from $284/mo. No pressure: keep the mockup and report either way.' },
            ].map((s) => (
              <li key={s.t} className="relative pl-8 sm:pl-10 pb-10 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-neutral-950" />
                <p className="text-xl font-bold">{s.t}</p>
                <p className="mt-1.5 text-lg text-neutral-300 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <CTA dark />
          </div>
        </div>
      </section>

      {/* 7. Guarantee */}
      <section className="px-4 sm:px-8 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border-2 border-emerald-500 p-7 sm:p-9">
            <ShieldCheck size={32} className="text-emerald-600" />
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight">90-Day Customer Guarantee</h2>
            <p className="mt-3 text-lg text-neutral-700 leading-relaxed">
              More calls and leads in your first 90 days than you were getting before, or we keep working for free until
              you do.
            </p>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="px-4 sm:px-8 py-20 sm:py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-10">Questions before you book</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="px-4 sm:px-8 py-20 sm:py-28 text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] max-w-3xl mx-auto text-balance">
          Get your free website
        </h2>
        <p className="mt-5 text-lg text-neutral-600">$0 setup with a monthly plan from $284/mo. Free mockup and AI visibility report on your call.</p>
        <div className="mt-10">
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
          Book My Free Call <ArrowRight size={18} />
        </a>
      </div>
      <div className="sm:hidden h-24" aria-hidden="true" />
    </main>
  );
}
