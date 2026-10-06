import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { JsonLd } from '@/components/common/JsonLd';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { LEVI_QUOTE } from '@/components/common/ClientQuote';
import { withGeneralFaqs, type FaqItem } from '@/data/faqData';
import type { FunnelStep, SolutionDetail, SolutionProblem, SolutionProof } from '@/data/solutionDetails';

// Shared sections for the six /marketing-solutions/* service pages. Content
// lives in data/solutionDetails.ts; these components only handle layout.
// Page order, one message per section, no two neighbours alike:
// image hero → dark leaks band → light leak→fix (with plan line and a one-row
// "how it works" strip) → blue proof band → FAQ → closing CTA
// (components/marketing-solutions/ServiceClosingCta).

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
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  priceLine: string;
  note?: string;
  showPricingLink?: boolean;
  /** Full-bleed hero photo; without one the hero falls back to the blue glow. */
  image?: string;
}) {
  return (
    <section
      className={`relative w-full px-4 sm:px-8 lg:px-16 bg-neutral-950 text-white overflow-hidden ${
        image ? 'min-h-screen min-h-[100dvh] flex items-center pt-24 pb-16' : 'pt-32 sm:pt-40 pb-16 sm:pb-24'
      }`}
    >
      {image ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
        />
      )}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <Link
          href="/marketing-solutions"
          className="py-2 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
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

/**
 * The leaks, on a dark band: one giant sourced number (or the page's strongest
 * leak as a pull-line), then each leak as one bold sentence with its cost.
 */
export function ProblemSection({ data }: { data: SolutionProblem }) {
  return (
    <section className="w-full py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-neutral-950 text-white border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow label={data.eyebrow} onDark className="mb-5" />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.05] text-balance">
              {data.heading}
            </h2>
            {data.intro && <p className="mt-6 text-lg leading-relaxed text-neutral-400 max-w-xl">{data.intro}</p>}
          </div>
          <div className="lg:col-span-5">
            {data.stat ? (
              <>
                <p className="text-[6rem] sm:text-[8.5rem] lg:text-[9.5rem] font-black font-display tracking-tighter leading-[0.85] text-blue-500">
                  {data.stat.figure}
                </p>
                <p className="mt-5 text-lg sm:text-xl font-semibold leading-snug text-neutral-100">{data.stat.text}</p>
                <a
                  href={data.stat.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 inline-flex items-center gap-1.5 mt-3 text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
                >
                  Source: {data.stat.sourceLabel}
                  <ExternalLink size={12} />
                </a>
              </>
            ) : (
              data.pullLine && (
                <blockquote className="border-l-4 border-blue-500 pl-5 sm:pl-6 text-2xl sm:text-3xl font-bold font-display tracking-tight leading-snug text-white">
                  {data.pullLine}
                </blockquote>
              )
            )}
          </div>
        </div>

        <ol className="mt-16 sm:mt-20 border-t border-white/15">
          {data.items.slice(0, 3).map((item, i) => (
            <li
              key={item.title}
              className="grid grid-cols-[auto_1fr] md:grid-cols-12 gap-x-5 sm:gap-x-8 gap-y-2 py-8 sm:py-10 border-b border-white/15"
            >
              <span
                aria-hidden="true"
                className="row-span-2 md:row-span-1 md:col-span-2 text-5xl sm:text-7xl font-black font-display tracking-tighter leading-none text-white/25 tabular-nums"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="md:col-span-6 text-xl sm:text-3xl font-bold font-display tracking-tight leading-snug text-balance">
                {item.title}
              </p>
              <p className="md:col-span-4 text-[15px] sm:text-base leading-relaxed text-neutral-400 md:pt-1.5">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FUNNEL_LABEL: Record<FunnelStep, string> = { found: 'Get Found', chosen: 'Get Chosen', booked: 'Get Booked' };

/**
 * The cure: each leak (struck through) beside the fix for it. Folds in the
 * plan/price line and a one-row "how it works" strip, so neither needs its own section.
 */
export function DeliverablesSection({ detail }: { detail: SolutionDetail }) {
  const { deliverables: data, problem, fit, timeline } = detail;
  const [planLead, ...planRest] = fit.lines;
  return (
    <section className={`${SECTION_PAD} bg-[#FAF9F8] text-neutral-950`}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-10 sm:mb-14">
          <Eyebrow label={data.eyebrow} className="mb-4" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
            {data.heading}
          </h2>
          {data.intro && <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-600">{data.intro}</p>}
        </div>

        {data.feature && (
          <figure className="relative mb-12 sm:mb-16 rounded-3xl overflow-hidden bg-neutral-900 aspect-[4/5] sm:aspect-[16/9]">
            <Image
              src={data.feature.image}
              alt={data.feature.alt}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
              <Eyebrow label={data.feature.label} onDark className="mb-3" />
              <p className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-tight max-w-2xl text-balance">
                {data.feature.caption}
              </p>
            </figcaption>
          </figure>
        )}

        <ol className="flex flex-col gap-4 sm:gap-5">
          {data.fixes.slice(0, 3).map((fix, i) => {
            const leak = problem.items[i];
            const dominant = data.dominant === i;
            return (
              <li key={fix.title} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-stretch">
                {leak && (
                  <div className="md:col-span-4 flex items-start md:items-center gap-3 md:pr-2">
                    <span className="font-mono text-xs font-bold text-neutral-400 pt-1 md:pt-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-base sm:text-lg font-semibold leading-snug text-neutral-400 line-through decoration-neutral-300 decoration-2">
                      {leak.title}
                    </p>
                    <ArrowRight size={20} aria-hidden="true" className="hidden md:block shrink-0 ml-auto text-blue-600" />
                  </div>
                )}
                <div
                  className={`md:col-span-8 rounded-2xl p-6 sm:p-8 ${
                    dominant
                      ? 'bg-neutral-950 text-white shadow-xl shadow-blue-900/20 sm:p-10'
                      : 'bg-white border border-neutral-200/80 shadow-sm'
                  }`}
                >
                  <h3
                    className={`font-black font-display tracking-tight leading-tight text-balance ${
                      dominant ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl text-blue-600'
                    }`}
                  >
                    {fix.title}
                  </h3>
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {fix.items.map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2.5 text-[15px] leading-relaxed ${dominant ? 'text-neutral-300' : 'text-neutral-600'}`}
                      >
                        <Check
                          size={16}
                          strokeWidth={2.6}
                          className={`shrink-0 mt-1 ${dominant ? 'text-blue-400' : 'text-blue-600'}`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>

        {data.alsoIncluded && (
          <p className="mt-8 text-[15px] leading-relaxed text-neutral-600">
            <span className="font-bold text-neutral-950">{data.alsoIncluded.label}:</span>{' '}
            {data.alsoIncluded.items.join(' · ')}
          </p>
        )}

        <div className="mt-10 sm:mt-12 rounded-2xl bg-white border border-neutral-200/80 divide-y divide-neutral-200/80">
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <p className="shrink-0 text-xs font-mono font-bold tracking-widest uppercase text-neutral-500">How it works</p>
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {timeline.map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-sm sm:text-[15px] font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </span>
                  {i < timeline.length - 1 && <ArrowRight size={14} aria-hidden="true" className="text-neutral-300" />}
                </li>
              ))}
            </ol>
          </div>
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold leading-relaxed">
                <span className="mr-2 inline-block align-middle px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wide">
                  {FUNNEL_LABEL[fit.step]}
                </span>
                {planLead}
              </p>
              {planRest.map((line) => (
                <p key={line} className="mt-1 text-sm text-neutral-600 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
            <Link
              href="/pricing"
              className="py-2 shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Compare plans <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const CASE_STUDY_PATH = '/insights/a-1-auto-detailing-website-case-study';

/** Proof on a blue band: the result is the headline, led by a big number or Levi's quote. */
export function CaseStudyProof({ data }: { data: SolutionProof }) {
  const label = (
    <p className="text-xs font-mono font-bold tracking-widest uppercase text-blue-100">
      [ Client Spotlight · A-1 Auto Detailing ]
    </p>
  );
  const caseLink = (
    <Link
      href={CASE_STUDY_PATH}
      className="py-2 mt-8 inline-flex items-center gap-2 font-semibold text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
    >
      Read the full case study <ArrowRight size={16} />
    </Link>
  );
  const longFigure = (data.figure?.length ?? 0) > 3;

  return (
    <section className={`${SECTION_PAD} bg-blue-600 text-white`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {data.figure ? (
          <>
            <div className="lg:col-span-5">
              {label}
              <p
                className={`mt-5 font-black font-display tracking-tighter leading-[0.85] whitespace-nowrap ${
                  longFigure ? 'text-6xl sm:text-8xl' : 'text-[7rem] sm:text-[10rem] lg:text-[12rem]'
                }`}
              >
                {data.figure}
              </p>
              {data.figureLabel && <p className="mt-4 text-base sm:text-lg font-semibold text-blue-100">{data.figureLabel}</p>}
            </div>
            <div className="lg:col-span-7">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1] text-balance">
                {data.heading}
              </h2>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-blue-50">{data.body}</p>
              {data.facts.length > 0 && (
                <ul className="mt-6 space-y-2.5">
                  {data.facts.map((fact) => (
                    <li key={fact} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-white">
                      <Check size={16} strokeWidth={2.6} className="shrink-0 mt-1 text-blue-200" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
              {caseLink}
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-5 order-2 lg:order-1">
              {label}
              <h2 className="mt-4 text-2xl sm:text-3xl font-black font-display tracking-tight leading-[1.15] text-balance">
                {data.heading}
              </h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-blue-50">{data.body}</p>
              {caseLink}
            </div>
            {data.quote && (
              <figure className="lg:col-span-7 order-1 lg:order-2">
                <blockquote className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.1] text-balance">
                  &ldquo;{LEVI_QUOTE.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-base text-blue-100">
                  {LEVI_QUOTE.name}, {LEVI_QUOTE.role}, {LEVI_QUOTE.place}
                </figcaption>
              </figure>
            )}
          </>
        )}
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
