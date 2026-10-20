import Link from 'next/link';
import { Eyebrow as SiteEyebrow } from '@/components/common/Eyebrow';
import { ArrowLeft, ArrowRight, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { JsonLd } from '@/components/common/JsonLd';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { ServiceClosingCta, GUARANTEE_LINE } from '@/components/marketing-solutions/ServiceClosingCta';
import { withGeneralFaqs, type FaqItem } from '@/data/faqData';
import { PracticeExamples } from '@/components/marketing-solutions/PracticeExamples';
import { services } from '@/data/marketingSolutionsData';
import type { ServicePage, SourcedStat } from '@/data/servicePages';

// Shared sections for /marketing-solutions ("How it works") and the six
// service pages under it. Copy lives in data/servicePages.ts; these
// components only handle layout. Service page order, one message per section:
// dark hero (the result) → optional sourced stat → how it works → what's
// included → per-practice examples → how it's bought (+ commitment) → FAQ →
// other services → closing CTA.

const SECTION_PAD = 'w-full py-10 sm:py-24 px-4 sm:px-8 lg:px-16';

/** Section label for the service pages: the shared components/common/Eyebrow. */
export function Eyebrow({ label, onDark = false, className = '' }: { label: string; onDark?: boolean; className?: string }) {
  return (
    <SiteEyebrow tone={onDark ? 'dark' : 'light'} className={className}>
      {label}
    </SiteEyebrow>
  );
}

function SectionHeader({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return (
    <div className="max-w-3xl mb-5 sm:mb-14">
      <Eyebrow label={eyebrow} className="mb-3 sm:mb-4" />
      <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-neutral-950 text-balance">
        {heading}
      </h2>
      {intro && <p className="hidden sm:block mt-5 text-lg leading-relaxed text-neutral-600">{intro}</p>}
    </div>
  );
}

/** Dark hero with a CSS brand glow, shared by every service page. */
// Purpose: the result this service delivers, its price anchor and the next step.
export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  priceLine,
  note,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  priceLine: string;
  note?: string;
}) {
  return (
    <section className="relative w-full px-4 sm:px-8 lg:px-16 bg-neutral-950 text-white overflow-hidden pt-24 sm:pt-40 pb-10 sm:pb-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
      />
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <Link
          href="/marketing-solutions"
          className="min-h-11 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors sm:mb-8"
        >
          <ArrowLeft size={15} />
          How it works
        </Link>
        <Eyebrow label={eyebrow} onDark className="mb-2.5 sm:mb-5" />
        <h1 className="text-[30px] sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.08] text-balance mb-3 sm:mb-6">
          {title}
        </h1>
        <p className="text-[15px] sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-snug sm:leading-relaxed mb-5 sm:mb-10">{subtitle}</p>
        {/* Tighter spacing on phones; the shared action row keeps its own look. */}
        <div className="[&>div]:mb-4 sm:[&>div]:mb-10 [&>div>p]:mb-4 sm:[&>div>p]:mb-6 [&_a]:py-3.5 sm:[&_a]:py-4">
          <ServiceHeroActions priceLine={priceLine} note={note} showPricingLink={false} />
        </div>
        <Link href="/book" className="min-h-11 sm:-mt-4 inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-white/80 hover:text-white">
          Or book a call <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

/** Answer-first block for search and AI answer engines: one question, one short answer. */
// Purpose: the direct answer to the page's main question, in two sentences at most.
export function QuickAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <section className="w-full bg-white px-4 sm:px-8 lg:px-16 py-8 sm:py-16 text-neutral-950">
      <div className="max-w-3xl mx-auto">
        <Eyebrow label="Quick answer" className="mb-2 sm:mb-3" />
        <h2 className="text-[24px] sm:text-4xl font-black font-display tracking-tight leading-tight text-balance">{question}</h2>
        <p className="mt-2 sm:mt-4 text-[15px] sm:text-xl leading-snug sm:leading-relaxed text-neutral-700">{answer}</p>
      </div>
    </section>
  );
}

/** One sourced third-party number on a dark band, linked to its source. */
// Purpose: one sourced number that shows why this service matters.
export function SourcedStatBand({ stat }: { stat: SourcedStat }) {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 py-14 sm:py-16 bg-neutral-950 text-white border-t border-white/10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
        <p className="md:col-span-4 text-[5.5rem] sm:text-[7rem] font-black font-display tracking-tighter leading-[0.85] text-blue-500">
          {stat.figure}
        </p>
        <div className="md:col-span-8">
          <p className="text-xl sm:text-2xl font-semibold leading-snug text-neutral-100">{stat.text}</p>
          <a
            href={stat.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 inline-flex items-center gap-1.5 mt-3 text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
          >
            Source: {stat.sourceLabel}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}

// Purpose: the steps from first call to a running service, as compact numbered rows on phones.
function HowItWorksSection({ how }: { how: ServicePage['how'] }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="How it works" heading={how.heading} intro={how.intro} />
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 divide-y divide-neutral-200 border-y border-neutral-200 sm:divide-y-0 sm:border-y-0">
          {how.steps.map((step, i) => (
            <li
              key={step.title}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-3 sm:block sm:rounded-3xl sm:border sm:border-neutral-200 sm:p-7"
            >
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <h3 className="sm:mt-5 text-lg sm:text-xl font-extrabold font-display tracking-tight leading-snug">{step.title}</h3>
                <p className="hidden sm:block mt-2 text-[15px] leading-relaxed text-neutral-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Purpose: everything included, as one scannable checklist.
function IncludedSection({ included, note }: { included: ServicePage['included']; note?: string }) {
  return (
    <section className={`${SECTION_PAD} bg-[#FAF9F8] text-neutral-950`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-10 lg:gap-14">
        <div className="lg:col-span-4">
          <Eyebrow label="What you get" className="mb-3 sm:mb-4" />
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            {included.heading}
          </h2>
          {included.intro && <p className="hidden sm:block mt-5 text-lg leading-relaxed text-neutral-600">{included.intro}</p>}
          {note && <p className="mt-3 sm:mt-6 text-sm leading-snug sm:leading-relaxed text-neutral-500 border-l-2 border-blue-600 pl-3 sm:pl-4">{note}</p>}
        </div>
        <div className="lg:col-span-8 flex flex-col gap-2.5 sm:gap-5">
          {included.groups.map((group, gi) => (
            <div
              key={group.label}
              className={`rounded-2xl sm:rounded-3xl p-4 sm:p-8 ${gi === 0 ? 'bg-white border border-neutral-200/80 shadow-sm' : 'bg-neutral-950 text-white'}`}
            >
              <p className={gi === 0 ? 'eyebrow' : 'eyebrow eyebrow-dark'}>
                {group.label}
              </p>
              <ul className="mt-2.5 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-3">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className={`flex items-start gap-2.5 text-sm sm:text-[15px] leading-snug sm:leading-relaxed ${gi === 0 ? 'text-neutral-700' : 'text-neutral-200'}`}
                  >
                    <Check size={16} strokeWidth={2.6} className={`shrink-0 mt-0.5 sm:mt-1 ${gi === 0 ? 'text-blue-600' : 'text-blue-400'}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Purpose: what the service looks like at each of the four practice types (tabs on phones).
function PracticeExamplesSection({ examples }: { examples: ServicePage['examples'] }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="By practice" heading={examples.heading} intro={examples.intro} />
        <PracticeExamples items={examples.items} />
      </div>
    </section>
  );
}

// Purpose: how it's bought: the plans, prices and the $0-to-start terms.
function HowItsBoughtSection({ buying, showCommitment }: { buying: ServicePage['buying']; showCommitment: boolean }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-950 text-white`}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-4 sm:mb-14">
          <Eyebrow label="Plans" onDark className="mb-3 sm:mb-4" />
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            {buying.heading}
          </h2>
          <p className="mt-2.5 sm:mt-5 text-sm sm:text-lg leading-snug sm:leading-relaxed text-neutral-400">
            $0 setup (normally $3,000). First payment when you&apos;re live.
          </p>
        </div>
        {/* Phones: one ruled row per plan (name and price on a line, the detail under it). */}
        <div className="grid grid-cols-1 md:grid-cols-3 sm:gap-5 divide-y divide-white/15 border-y border-white/15 sm:divide-y-0 sm:border-y-0">
          {buying.options.map((option) => (
            <div key={option.plan} className="py-3 sm:rounded-3xl sm:border sm:border-white/15 sm:bg-white/[0.04] sm:p-7">
              <div className="flex items-baseline justify-between gap-3 sm:block">
                <p className="text-sm font-semibold text-blue-300">{option.plan}</p>
                <p className="sm:mt-2 text-xl sm:text-3xl font-black font-display tracking-tight">{option.price}</p>
              </div>
              <p className="hidden sm:block mt-3 text-[15px] leading-relaxed text-neutral-400">{option.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 sm:mt-8 flex flex-col md:flex-row md:items-start gap-1 sm:gap-6 justify-between">
          {showCommitment ? (
            <div className="flex gap-3 sm:gap-4 max-w-3xl">
              <ShieldCheck size={24} className="shrink-0 text-blue-400" aria-hidden="true" />
              <div>
                <p className="font-bold">90-day performance commitment</p>
                {/* Phones: the full wording is in the closing section a scroll below, so it is said once. */}
                <p className="sm:hidden mt-0.5 text-sm leading-snug text-neutral-400">Written into your agreement.</p>
                <p className="hidden sm:block mt-1 text-sm leading-relaxed text-neutral-400">{GUARANTEE_LINE}</p>
              </div>
            </div>
          ) : (
            <span />
          )}
          <Link
            href="/pricing"
            className="min-h-11 shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-blue-200 transition-colors"
          >
            Compare plans <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The other five service pages, for internal linking. */
// Purpose: a way on to the other five services.
function OtherServices({ current }: { current: string }) {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 pb-2 sm:pb-4 pt-10 sm:pt-20 bg-white text-neutral-950">
      <div className="max-w-6xl mx-auto">
        <Eyebrow label="Other services" className="mb-3 sm:mb-6" />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {services
            .filter((s) => s.slug !== current)
            .map((s) => (
              <li key={s.slug}>
                <Link
                  href={s.href}
                  data-spot
                  className="group ix-card relative h-full flex flex-col justify-between gap-1 sm:gap-3 rounded-2xl border border-neutral-200 px-4 py-3 sm:p-5 hover:border-blue-300 transition-colors"
                >
                  <span className="font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">{s.title}</span>
                  <span className="text-sm text-neutral-600 leading-relaxed">{s.outcome}</span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}

const CONTRACT_QUESTION = 'Is there a contract, and how long is it?';

/** A page's own questions (max 4) plus the shared contract question: 5 at most. */
export function serviceFaqs(own: FaqItem[]): FaqItem[] {
  const contract = withGeneralFaqs([]).filter((f) => f.question === CONTRACT_QUESTION);
  return [...own.slice(0, 4), ...contract];
}

// Purpose: the last questions about this service; every question in view, answers one tap away.
export function ServiceFaqSection({ heading, faqs }: { heading: string; faqs: FaqItem[] }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-50 text-neutral-950`}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4 sm:mb-14">
          <Eyebrow label="FAQ" className="mb-3 sm:mb-4" />
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            {heading}
          </h2>
        </div>
        <FAQAccordion items={serviceFaqs(faqs)} />
      </div>
    </section>
  );
}

/** FAQPage schema matching the questions shown on the page. */
export function ServiceFaqJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: serviceFaqs(items).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  );
}

/** The whole service page body (JSON-LD is added by each route). */
export function ServicePageView({ page }: { page: ServicePage }) {
  return (
    <>
      <ServiceHero {...page.hero} />
      <QuickAnswer {...page.quickAnswer} />
      {page.stat && <SourcedStatBand stat={page.stat} />}
      <HowItWorksSection how={page.how} />
      <IncludedSection included={page.included} note={page.note} />
      <PracticeExamplesSection examples={page.examples} />
      <HowItsBoughtSection buying={page.buying} showCommitment={page.showCommitment} />
      <ServiceFaqSection heading={page.faqHeading} faqs={page.faqs} />
      <OtherServices current={page.slug} />
      <ServiceClosingCta trackId={page.trackId} />
    </>
  );
}
