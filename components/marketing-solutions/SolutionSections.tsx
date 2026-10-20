import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { JsonLd } from '@/components/common/JsonLd';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { ServiceClosingCta, GUARANTEE_LINE } from '@/components/marketing-solutions/ServiceClosingCta';
import { withGeneralFaqs, type FaqItem } from '@/data/faqData';
import { nicheHeroTempImages } from '@/data/nicheHeroTempImages';
import { services } from '@/data/marketingSolutionsData';
import type { ServicePage, SourcedStat } from '@/data/servicePages';

// Shared sections for /marketing-solutions ("How it works") and the six
// service pages under it. Copy lives in data/servicePages.ts; these
// components only handle layout. Service page order, one message per section:
// dark hero (the result) → optional sourced stat → how it works → what's
// included → per-practice examples → how it's bought (+ commitment) → FAQ →
// other services → closing CTA.

const SECTION_PAD = 'w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-16';

/** Site-wide eyebrow: mono, bracketed, blue. `onDark` lifts the blue for dark backgrounds. */
export function Eyebrow({ label, onDark = false, className = '' }: { label: string; onDark?: boolean; className?: string }) {
  return (
    <p
      className={`text-xs font-mono font-bold tracking-widest uppercase ${onDark ? 'text-blue-400' : 'text-blue-600'} ${className}`}
    >
      [ {label} ]
    </p>
  );
}

function SectionHeader({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return (
    <div className="max-w-3xl mb-10 sm:mb-14">
      <Eyebrow label={eyebrow} className="mb-4" />
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-neutral-950 text-balance">
        {heading}
      </h2>
      {intro && <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-600">{intro}</p>}
    </div>
  );
}

/** Dark hero with a CSS brand glow, shared by every service page. */
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
    <section className="relative w-full px-4 sm:px-8 lg:px-16 bg-neutral-950 text-white overflow-hidden pt-32 sm:pt-40 pb-16 sm:pb-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
      />
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <Link
          href="/marketing-solutions"
          className="py-2 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          How it works
        </Link>
        <Eyebrow label={eyebrow} onDark className="mb-5" />
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.05] text-balance mb-6">
          {title}
        </h1>
        <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">{subtitle}</p>
        <ServiceHeroActions priceLine={priceLine} note={note} showPricingLink={false} />
        <Link href="/book" className="py-2 -mt-4 inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-white/80 hover:text-white">
          Or book a call <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

/** One sourced third-party number on a dark band, linked to its source. */
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

function HowItWorksSection({ how }: { how: ServicePage['how'] }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="How it works" heading={how.heading} intro={how.intro} />
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {how.steps.map((step, i) => (
            <li key={step.title} className="rounded-3xl border border-neutral-200 p-6 sm:p-7">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-extrabold font-display tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function IncludedSection({ included, note }: { included: ServicePage['included']; note?: string }) {
  return (
    <section className={`${SECTION_PAD} bg-[#FAF9F8] text-neutral-950`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        <div className="lg:col-span-4">
          <Eyebrow label="What you get" className="mb-4" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            {included.heading}
          </h2>
          {included.intro && <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-600">{included.intro}</p>}
          {note && <p className="mt-6 text-sm leading-relaxed text-neutral-500 border-l-2 border-blue-600 pl-4">{note}</p>}
        </div>
        <div className="lg:col-span-8 flex flex-col gap-5">
          {included.groups.map((group, gi) => (
            <div
              key={group.label}
              className={`rounded-3xl p-6 sm:p-8 ${gi === 0 ? 'bg-white border border-neutral-200/80 shadow-sm' : 'bg-neutral-950 text-white'}`}
            >
              <p className={`text-xs font-mono font-bold tracking-widest uppercase ${gi === 0 ? 'text-blue-600' : 'text-blue-400'}`}>
                {group.label}
              </p>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className={`flex items-start gap-2.5 text-[15px] leading-relaxed ${gi === 0 ? 'text-neutral-700' : 'text-neutral-200'}`}
                  >
                    <Check size={16} strokeWidth={2.6} className={`shrink-0 mt-1 ${gi === 0 ? 'text-blue-600' : 'text-blue-400'}`} />
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

function PracticeExamplesSection({ examples }: { examples: ServicePage['examples'] }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="By practice" heading={examples.heading} intro={examples.intro} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {examples.items.map((item) => (
            <article key={item.vertical} className="rounded-3xl border border-neutral-200 overflow-hidden flex flex-col">
              <div className="relative h-36 sm:h-40 bg-neutral-900">
                <Image
                  src={nicheHeroTempImages[item.vertical]}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover opacity-70"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 to-neutral-950/10" />
                <Link
                  href={`/solutions/${item.vertical}`}
                  className="absolute left-6 bottom-4 text-xl sm:text-2xl font-black font-display tracking-tight text-white hover:text-blue-300 transition-colors"
                >
                  {item.name}
                </Link>
              </div>
              <div className="p-6 sm:p-7 flex-1">
                <p className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-400">Example</p>
                <p className="mt-2 text-lg font-semibold leading-snug">{item.scenario}</p>
                <ul className="mt-4 space-y-2.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-600">
                      <Check size={16} strokeWidth={2.6} className="shrink-0 mt-1 text-blue-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItsBoughtSection({ buying, showCommitment }: { buying: ServicePage['buying']; showCommitment: boolean }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-950 text-white`}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-10 sm:mb-14">
          <Eyebrow label="Plans" onDark className="mb-4" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            {buying.heading}
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-400">
            {buying.intro ??
              'No self-serve checkout. Every plan starts with the free audit or a call, then a 12-month agreement with setup credited in full. Month-to-month is available.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {buying.options.map((option) => (
            <div key={option.plan} className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 sm:p-7">
              <p className="text-sm font-semibold text-blue-300">{option.plan}</p>
              <p className="mt-2 text-2xl sm:text-3xl font-black font-display tracking-tight">{option.price}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-neutral-400">{option.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col md:flex-row md:items-start gap-6 justify-between">
          {showCommitment ? (
            <div className="flex gap-4 max-w-3xl">
              <ShieldCheck size={26} className="shrink-0 text-blue-400" aria-hidden="true" />
              <div>
                <p className="font-bold">90-day performance commitment</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{GUARANTEE_LINE}</p>
              </div>
            </div>
          ) : (
            <span />
          )}
          <Link
            href="/pricing"
            className="py-2 shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-blue-200 transition-colors"
          >
            Compare plans <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The other five service pages, for internal linking. */
function OtherServices({ current }: { current: string }) {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 pb-4 pt-16 sm:pt-20 bg-white text-neutral-950">
      <div className="max-w-6xl mx-auto">
        <Eyebrow label="Other services" className="mb-6" />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services
            .filter((s) => s.slug !== current)
            .map((s) => (
              <li key={s.slug}>
                <Link
                  href={s.href}
                  className="group h-full flex flex-col justify-between gap-3 rounded-2xl border border-neutral-200 p-5 hover:border-blue-300 transition-colors"
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

export function ServiceFaqSection({ heading, faqs }: { heading: string; faqs: FaqItem[] }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-50 text-neutral-950`}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <Eyebrow label="FAQ" className="mb-4" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
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
