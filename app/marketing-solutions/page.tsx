import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';
import { Eyebrow } from '@/components/marketing-solutions/SolutionSections';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';

export const metadata = buildMetadata({
  path: '/marketing-solutions',
  title: 'Marketing Services That Get You More Customers | Axeon Studio',
  description:
    'SEO, ads, websites, AI chat, and lead follow-up in one system that gets local businesses found, chosen, and booked. Backed by a 90-day guarantee.',
});

const marketingSolutionsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'AxeonCORE | Axeon Studio',
  itemListElement: marketingSolutions.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Service',
      name: item.title,
      description: item.description,
      url: `https://axeonstudio.co${item.href}`,
      provider: providerRef,
      areaServed: SERVICE_AREA,
    },
  })),
};

// Hero teaser of the three steps below (the A-1 numbers live in the Client Spotlight).
const FUNNEL = ['Get found', 'Get chosen', 'Get booked'];

// Every stat needs a real, checkable source (guardrails rule).
const LEAKS = [
  {
    stat: '62%',
    title: 'of calls go unanswered',
    body: 'In a study of 85 small businesses, most calls were never picked up. Every one is a customer calling the next company.',
    source: '411 Locals call study',
    href: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
  },
  {
    stat: '21×',
    title: 'more likely to win the lead',
    body: 'Leads called back within 5 minutes were about 21 times more likely to qualify than leads called back after 30.',
    source: 'MIT / InsideSales lead response study',
    href: 'https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf',
  },
  {
    stat: '97%',
    title: 'read reviews before choosing',
    body: 'Nearly everyone checks your reviews before they call. If yours are hidden, you lose them before they ever reach you.',
    source: 'BrightLocal Local Consumer Review Survey 2026',
    href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
  },
];

// 62% leads at hero scale; the other two read as footnotes so one number lands.
const [LEAD_LEAK, ...FOOTNOTE_LEAKS] = LEAKS;

const byId = (id: string) => marketingSolutions.find((s) => s.id === id);

// The customer journey, in order. Each step names the result first, then the parts.
const STEPS = [
  {
    step: 'Step 1',
    result: 'Get found',
    body: 'Show up when people nearby search for what you do: on Google, on the map, and inside AI answers like ChatGPT.',
    parts: ['seo', 'advertising'],
  },
  {
    step: 'Step 2',
    result: 'Get chosen',
    body: 'Be the obvious pick the moment they compare you: a fast site, your reviews up front, and real footage of your work.',
    parts: ['website', 'video-photography'],
  },
  {
    step: 'Step 3',
    result: 'Get booked',
    body: 'Answer every lead in seconds, day or night, and follow up automatically until they book.',
    parts: ['lead-generation', 'ai-chat-scheduling'],
  },
];

// What actually happens, so the buyer can picture it working.
const TIMELINE = [
  { when: 'Second 0', what: 'Someone fills out your form, calls, or starts a chat.' },
  { when: 'Within seconds', what: 'Your phone rings and connects you to them. Miss the call? They get a text back right away.' },
  { when: 'Same day', what: 'They land in your CRM, and automatic texts and emails keep following up until they book.' },
  { when: 'Every month', what: 'You get a report showing every call and lead, and exactly where each one came from.' },
];

export default function MarketingSolutionsPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketingSolutionsJsonLd) }}
      />
      <BreadcrumbJsonLd items={[{ name: 'Services', path: '/marketing-solutions' }]} />

      {/* 1. The promise + proof */}
      <section className="bg-neutral-950 text-white pt-36 sm:pt-44 pb-20 sm:pb-28 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow label="AxeonCORE · The Customer Engine" onDark />
          <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight leading-[1.05] text-balance">
            One System That Turns Searches Into Booked Jobs
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl mx-auto">
            We get you found, chosen, and booked, then prove it with every call and lead tracked.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <Link
              href="/book"
              data-track="cta_click"
              data-track-cta="axeoncore_hero"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Free Strategy Call <ArrowUpRight size={16} />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 font-semibold text-white/80 hover:text-white transition-colors">
              See pricing <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <ol className="mt-14 sm:mt-16 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {FUNNEL.map((label, i) => (
            <li key={label} className="flex items-center gap-2 sm:gap-3">
              <span className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.06] text-sm sm:text-base font-bold">{label}</span>
              {i < FUNNEL.length - 1 && <ArrowRight size={16} className="text-blue-400" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </section>

      {/* 2. The problem: one dominant sourced number, the other two as footnotes */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <Eyebrow label="The Problem" />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] text-balance">
              Most businesses don&apos;t need more traffic. They&apos;re leaking customers.
            </h2>
          </div>
          <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 lg:items-end">
            <p className="lg:col-span-7 text-[8rem] sm:text-[12rem] lg:text-[15rem] font-black font-display tracking-tighter leading-[0.8] text-blue-600">
              {LEAD_LEAK.stat}
            </p>
            <div className="lg:col-span-5 lg:pb-4">
              <p className="text-2xl sm:text-3xl font-bold font-display tracking-tight leading-snug">{LEAD_LEAK.title}</p>
              <p className="mt-4 text-lg text-neutral-600 leading-relaxed">{LEAD_LEAK.body}</p>
              <a href={LEAD_LEAK.href} target="_blank" rel="noopener" className="mt-4 inline-block text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2">
                Source: {LEAD_LEAK.source}
              </a>
            </div>
          </div>
          <ul className="mt-14 sm:mt-20 pt-8 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {FOOTNOTE_LEAKS.map((l) => (
              <li key={l.stat} className="flex items-start gap-5">
                <span className="text-3xl sm:text-4xl font-black font-display tracking-tight text-neutral-950 shrink-0 w-20 sm:w-24">{l.stat}</span>
                <div>
                  <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed">{l.body}</p>
                  <a href={l.href} target="_blank" rel="noopener" className="mt-2 inline-block text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2">
                    Source: {l.source}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. How AxeonCORE fixes it */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <Eyebrow label="The Fix" />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
              Three steps. One team runs all of them.
            </h2>
          </div>
          <div className="mt-14 flex flex-col gap-5">
            {STEPS.map((s) => (
              <div key={s.result} className="rounded-3xl bg-white border border-neutral-200 p-7 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-10 items-start">
                <div className="md:col-span-4">
                  <p className="text-sm font-semibold text-neutral-400">{s.step}</p>
                  <h3 className="mt-1 text-3xl sm:text-4xl font-black font-display tracking-tight">{s.result}</h3>
                </div>
                <div className="md:col-span-8">
                  <p className="text-lg text-neutral-700 leading-relaxed">{s.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {s.parts.map((id) => {
                      const part = byId(id);
                      if (!part) return null;
                      return (
                        <Link
                          key={id}
                          href={part.href}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-300 text-sm font-semibold text-neutral-800 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          {part.title} <ArrowRight size={14} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. What happens when a lead comes in */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto">
          <Eyebrow label="How It Works" onDark />
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
            What happens the moment someone reaches out
          </h2>
          <ol className="mt-14 border-l border-white/15 ml-2">
            {TIMELINE.map((t) => (
              <li key={t.when} className="relative pl-8 sm:pl-10 pb-10 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-neutral-950" />
                <p className="text-sm font-bold tracking-wide uppercase text-blue-300">{t.when}</p>
                <p className="mt-2 text-lg sm:text-xl text-neutral-200 leading-relaxed">{t.what}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Proof from a real client */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow label="Client Spotlight" />
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] text-balance">
            A-1 Auto Detailing went from page 2 to #1 on Google
          </h2>
          <p className="mt-5 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            For &ldquo;Pleasant Hill auto detailing,&rdquo; with its 5.0 rating from 180+ Google reviews finally front and center.
          </p>
          <figure className="mt-12">
            <blockquote className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-[1.2]">
              &ldquo;{LEVI_QUOTE.text}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-neutral-500">
              {LEVI_QUOTE.name}, {LEVI_QUOTE.role}
            </figcaption>
          </figure>
          <Link
            href={LEVI_QUOTE.href}
            className="mt-10 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Read the full case study <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <ServiceClosingCta trackId="axeoncore" />
    </main>
  );
}
