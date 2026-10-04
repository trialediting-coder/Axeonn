import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { JsonLd } from '@/components/common/JsonLd';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';
import { withGeneralFaqs, type FaqItem } from '@/data/faqData';
import type {
  FunnelStep,
  SolutionProblem,
  SolutionDeliverables,
  SolutionTimeline,
  SolutionFit,
  SolutionProof,
} from '@/data/solutionDetails';

// Shared sections for the six /marketing-solutions/* service pages. Content
// lives in data/solutionDetails.ts; these components only handle layout.
// Page order: hero → problem → what you get → where it fits → how it works →
// proof → FAQ → closing CTA (components/marketing-solutions/ServiceClosingCta).

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
    <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
      <Eyebrow label={eyebrow} className="mb-4" />
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-neutral-950 text-balance">
        {heading}
      </h2>
      {intro && <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-600">{intro}</p>}
    </div>
  );
}

/** Dark hero with a CSS brand glow (no photography), shared by every service page. */
export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  priceLine,
  note,
  showPricingLink,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  priceLine: string;
  note?: string;
  showPricingLink?: boolean;
}) {
  return (
    <section className="relative w-full px-4 sm:px-8 lg:px-16 pt-32 sm:pt-40 pb-16 sm:pb-24 bg-neutral-950 text-white overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <Link
          href="/marketing-solutions"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to Services
        </Link>
        <Eyebrow label={eyebrow} onDark className="mb-5" />
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.05] text-balance mb-6">
          {title}
        </h1>
        <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">{subtitle}</p>
        <ServiceHeroActions priceLine={priceLine} note={note} showPricingLink={showPricingLink} />
      </div>
    </section>
  );
}

export function ProblemSection({ data }: { data: SolutionProblem }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
          {data.items.slice(0, 3).map((item) => (
            <div key={item.title} className="border-t-2 border-neutral-950 pt-5">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-2">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-neutral-600">{item.body}</p>
            </div>
          ))}
        </div>
        {data.stat && (
          <div className="mt-12 rounded-2xl bg-neutral-50 border border-neutral-200 p-6 sm:p-8 text-center">
            <p className="text-lg sm:text-xl font-semibold leading-snug max-w-3xl mx-auto">{data.stat.text}</p>
            <a
              href={data.stat.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-4"
            >
              Source: {data.stat.sourceLabel}
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export function DeliverablesSection({ data }: { data: SolutionDeliverables }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-50 text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {data.groups.slice(0, 3).map((group) => (
            <div key={group.title} className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-6 sm:p-8">
              <h3 className="text-xl font-bold font-display tracking-tight">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-600">
                    <Check size={16} strokeWidth={2.6} className="text-blue-600 shrink-0 mt-1" />
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

const FUNNEL: { id: FunnelStep; label: string }[] = [
  { id: 'found', label: 'Get Found' },
  { id: 'chosen', label: 'Get Chosen' },
  { id: 'booked', label: 'Get Booked' },
];

/** Compact strip: where this service sits in Found → Chosen → Booked, and how it's priced. */
export function WhereItFits({ data }: { data: SolutionFit }) {
  const [lead, ...rest] = data.lines;
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 py-12 sm:py-16 bg-white text-neutral-950">
      <div className="max-w-5xl mx-auto rounded-3xl border border-neutral-200 p-6 sm:p-10">
        <Eyebrow label="Where This Fits" className="mb-5" />
        <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
          {FUNNEL.map((step, i) => {
            const active = step.id === data.step;
            return (
              <li key={step.id} className="flex items-center gap-2 sm:gap-3">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    active ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {step.label}
                </span>
                {i < FUNNEL.length - 1 && <ArrowRight size={16} className="text-neutral-300" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-base sm:text-lg font-semibold leading-relaxed">{lead}</p>
        {rest.map((line) => (
          <p key={line} className="mt-2 text-sm sm:text-[15px] text-neutral-600 leading-relaxed">
            {line}
          </p>
        ))}
        <Link
          href="/pricing"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Compare plans <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

export function TimelineSection({ data }: { data: SolutionTimeline }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-50 text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
          {data.steps.slice(0, 3).map((step, i) => (
            <li key={step.title}>
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg sm:text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CASE_STUDY_PATH = '/insights/a-1-auto-detailing-website-case-study';

export function CaseStudyProof({ data }: { data: SolutionProof }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <Eyebrow label="Client Spotlight · A-1 Auto Detailing" className="mb-4" />
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight leading-[1.1] text-balance mb-5">
            {data.heading}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-neutral-600">{data.body}</p>
          {data.quote && (
            <figure className="mt-6 border-l-4 border-blue-600 pl-5">
              <blockquote className="text-xl sm:text-2xl font-bold font-display tracking-tight leading-snug">
                &ldquo;{LEVI_QUOTE.text}&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-sm text-neutral-500">
                {LEVI_QUOTE.name}, {LEVI_QUOTE.role}, {LEVI_QUOTE.place}
              </figcaption>
            </figure>
          )}
          {data.facts.length > 0 && (
            <ul className="mt-6 space-y-3">
              {data.facts.map((fact) => (
                <li key={fact} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-700">
                  <Check size={16} strokeWidth={2.6} className="text-blue-600 shrink-0 mt-1" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={CASE_STUDY_PATH}
            className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Read the full case study <ArrowRight size={16} />
          </Link>
        </div>
        <Link href={CASE_STUDY_PATH} className="block rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm">
          <Image
            src="/images/case-studies/a1/after-hero.webp"
            alt="A-1 Auto Detailing's homepage, built by Axeon Studio"
            width={1424}
            height={882}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="w-full h-auto"
          />
        </Link>
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
        <SectionHeader eyebrow="FAQ" heading={heading} />
        <FAQAccordion items={serviceFaqs(faqs)} />
      </div>
    </section>
  );
}

/** FAQPage schema for a service page's own questions (the shared site FAQ is left out). */
export function ServiceFaqJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.slice(0, 4).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  );
}
