import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, X, ExternalLink } from 'lucide-react';
import { niches } from '@/data/nichesData';
import { benefitHeadlinesBySlug } from '@/data/nicheBenefitHeadlines';
import { JsonLd } from '@/components/common/JsonLd';
import type { FaqItem } from '@/data/faqData';
import type {
  SolutionProblem,
  SolutionDeliverables,
  SolutionTimeline,
  SolutionComparison,
  SolutionProof,
} from '@/data/solutionDetails';

// Shared long-form sections for the /marketing-solutions/* pages. Content lives
// in data/solutionDetails.ts; these components only handle layout. `tone`
// matches the page they sit in (the SEO page is dark, the rest are light).

type Tone = 'light' | 'dark';

const SECTION_PAD = 'w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24';

function palette(tone: Tone, alt = false) {
  if (tone === 'dark') {
    return {
      section: `${alt ? 'bg-neutral-900/40' : 'bg-neutral-950'} text-white border-t border-neutral-900`,
      eyebrow: 'text-blue-400',
      heading: 'text-white',
      body: 'text-neutral-400',
      strong: 'text-white',
      card: 'bg-neutral-900/60 border border-neutral-800',
      divider: 'border-neutral-800',
      chip: 'bg-blue-600/15 text-blue-400',
      muted: 'text-neutral-500',
    };
  }
  return {
    section: `${alt ? 'bg-neutral-50' : 'bg-white'} text-neutral-950`,
    eyebrow: 'text-[#2563eb]',
    heading: 'text-neutral-950',
    body: 'text-neutral-600',
    strong: 'text-neutral-950',
    card: 'bg-white border border-neutral-200/80 shadow-sm',
    divider: 'border-neutral-200',
    chip: 'bg-blue-50 text-blue-600',
    muted: 'text-neutral-500',
  };
}

function SectionHeader({
  tone,
  eyebrow,
  heading,
  intro,
}: {
  tone: Tone;
  eyebrow: string;
  heading: string;
  intro?: string;
}) {
  const p = palette(tone);
  return (
    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
      <p className={`text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3 ${p.eyebrow}`}>{eyebrow}</p>
      <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] mb-5 ${p.heading}`}>
        {heading}
      </h2>
      {intro && <p className={`text-base sm:text-lg leading-relaxed ${p.body}`}>{intro}</p>}
    </div>
  );
}

export function ProblemSection({ tone = 'light', data, alt }: { tone?: Tone; data: SolutionProblem; alt?: boolean }) {
  const p = palette(tone, alt ?? true);
  return (
    <section className={`${SECTION_PAD} ${p.section}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader tone={tone} eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {data.items.slice(0, 4).map((item, i) => (
            <div key={item.title} className={`rounded-2xl p-6 sm:p-8 ${p.card}`}>
              <div className="flex items-start gap-4">
                <span className={`shrink-0 font-mono text-xs font-bold px-2.5 py-1 rounded-md ${p.chip}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${p.strong}`}>{item.title}</h3>
                  <p className={`text-sm sm:text-[15px] leading-relaxed ${p.body}`}>{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.stat && (
          <div className={`mt-8 sm:mt-10 rounded-2xl p-6 sm:p-8 text-center ${p.card}`}>
            <p className={`text-lg sm:text-xl font-semibold leading-snug max-w-3xl mx-auto ${p.strong}`}>{data.stat.text}</p>
            <a
              href={data.stat.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 mt-3 text-xs underline underline-offset-4 ${p.muted}`}
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

export function DeliverablesSection({ tone = 'light', data, alt }: { tone?: Tone; data: SolutionDeliverables; alt?: boolean }) {
  const p = palette(tone, alt ?? false);
  return (
    <section className={`${SECTION_PAD} ${p.section}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader tone={tone} eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {data.groups.map((group) => (
            <div key={group.title} className={`rounded-2xl p-6 sm:p-8 ${p.card}`}>
              <h3 className={`text-lg font-bold tracking-tight mb-1 ${p.strong}`}>{group.title}</h3>
              {group.note && <p className={`text-xs font-mono uppercase tracking-wide mb-4 ${p.eyebrow}`}>{group.note}</p>}
              <ul className={`space-y-3 ${group.note ? '' : 'mt-4'}`}>
                {group.items.map((item) => (
                  <li key={item} className={`flex items-start gap-2.5 text-sm leading-relaxed ${p.body}`}>
                    <Check size={16} strokeWidth={2.6} className="text-blue-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {data.footnote && <p className={`text-center text-sm mt-10 max-w-2xl mx-auto ${p.muted}`}>{data.footnote}</p>}
      </div>
    </section>
  );
}

export function TimelineSection({ tone = 'light', data, alt }: { tone?: Tone; data: SolutionTimeline; alt?: boolean }) {
  const p = palette(tone, alt ?? true);
  return (
    <section className={`${SECTION_PAD} ${p.section}`}>
      <div className="max-w-4xl mx-auto">
        <SectionHeader tone={tone} eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <ol className="relative">
          {data.steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-5 sm:gap-7 pb-10 last:pb-0">
              {i < data.steps.length - 1 && (
                <span aria-hidden="true" className={`absolute left-5 top-11 bottom-0 border-l-2 border-dashed ${p.divider}`} />
              )}
              <span className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white font-mono text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${p.strong}`}>{step.title}</h3>
                <p className={`text-sm sm:text-[15px] leading-relaxed ${p.body}`}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        {data.footnote && <p className={`text-center text-sm mt-12 max-w-2xl mx-auto ${p.muted}`}>{data.footnote}</p>}
      </div>
    </section>
  );
}

export function ComparisonSection({ tone = 'light', data, alt }: { tone?: Tone; data: SolutionComparison; alt?: boolean }) {
  const p = palette(tone, alt ?? false);
  return (
    <section className={`${SECTION_PAD} ${p.section}`}>
      <div className="max-w-5xl mx-auto">
        <SectionHeader tone={tone} eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <div className={`rounded-2xl overflow-hidden ${p.card}`}>
          <div className={`hidden sm:grid grid-cols-[1fr_1.2fr_1.2fr] text-xs font-mono font-bold uppercase tracking-wide border-b ${p.divider}`}>
            <div className={`p-5 ${p.muted}`}>&nbsp;</div>
            <div className={`p-5 ${p.muted}`}>Typical agency</div>
            <div className="p-5 text-blue-500">Axeon Studio</div>
          </div>
          {data.rows.map((row) => (
            <div
              key={row.label}
              className={`grid grid-cols-1 sm:grid-cols-[1fr_1.2fr_1.2fr] border-b last:border-b-0 ${p.divider}`}
            >
              <div className={`px-5 pt-5 sm:p-5 text-sm font-bold ${p.strong}`}>{row.label}</div>
              <div className={`px-5 pt-2 sm:p-5 flex items-start gap-2 text-sm leading-relaxed ${p.body}`}>
                <X size={16} className="text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  <span className="sm:hidden font-semibold">Typical: </span>
                  {row.typical}
                </span>
              </div>
              <div className={`px-5 pt-2 pb-5 sm:p-5 flex items-start gap-2 text-sm leading-relaxed ${p.strong}`}>
                <Check size={16} strokeWidth={2.6} className="text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <span className="sm:hidden font-semibold">Axeon: </span>
                  {row.axeon}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/why-axeon"
            className={`inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 ${p.eyebrow}`}
          >
            See the full comparison
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

const CASE_STUDY_PATH = '/insights/a-1-auto-detailing-website-case-study';

export function CaseStudyProof({ tone = 'light', data, alt }: { tone?: Tone; data: SolutionProof; alt?: boolean }) {
  const p = palette(tone, alt ?? true);
  return (
    <section className={`${SECTION_PAD} ${p.section}`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <p className={`text-xs sm:text-sm font-bold tracking-[0.22em] uppercase mb-3 ${p.eyebrow}`}>
            Client Spotlight: A-1 Auto Detailing, Pleasant Hill, Iowa
          </p>
          <h2 className={`text-3xl sm:text-4xl font-black tracking-tight leading-[1.12] mb-5 ${p.heading}`}>{data.heading}</h2>
          <p className={`text-base leading-relaxed mb-6 ${p.body}`}>{data.body}</p>
          <ul className="space-y-3 mb-8">
            {data.facts.map((fact) => (
              <li key={fact} className={`flex items-start gap-2.5 text-sm leading-relaxed ${p.body}`}>
                <Check size={16} strokeWidth={2.6} className="text-blue-500 shrink-0 mt-0.5" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
          <Link
            href={CASE_STUDY_PATH}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            Read the full case study
            <ArrowRight size={16} />
          </Link>
        </div>
        <Link href={CASE_STUDY_PATH} className={`block rounded-2xl overflow-hidden ${p.card}`}>
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

export function IndustriesSection({ tone = 'light', serviceName, alt }: { tone?: Tone; serviceName: string; alt?: boolean }) {
  const p = palette(tone, alt ?? false);
  return (
    <section className={`${SECTION_PAD} ${p.section}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tone={tone}
          eyebrow="Who We Help"
          heading="More Customers, Set Up for Your Industry"
          intro={`A dental office and a roofing company don't win customers the same way, so ${serviceName} isn't set up the same way either. Here's what it fixes in yours.`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {niches.map((niche) => (
            <Link
              key={niche.slug}
              href={`/solutions/${niche.slug}`}
              className={`group rounded-xl px-4 py-4 flex items-center justify-between gap-2 text-sm font-semibold transition-colors hover:border-blue-500 ${p.card} ${p.strong}`}
            >
              <span className="flex flex-col gap-1">
                <span>{niche.name}</span>
                {benefitHeadlinesBySlug[niche.slug]?.[0] && (
                  <span className="text-xs font-normal opacity-70">{benefitHeadlinesBySlug[niche.slug][0]}</span>
                )}
              </span>
              <ArrowRight size={14} className="shrink-0 text-blue-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
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
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  );
}
