import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import LineIcon from '@/components/common/LineIcon';
import { Eyebrow } from '@/components/common/Eyebrow';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';
import { ServiceFaqJsonLd, ServiceFaqSection } from '@/components/marketing-solutions/SolutionSections';
import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { nicheHeroTempImages } from '@/data/nicheHeroTempImages';
import { servicePages, type PracticeVertical } from '@/data/servicePages';
import {
  FUNNEL_SERVICES,
  FUNNEL_VERTICALS,
  MOMENT_LABEL,
  SERVICE_PRICE,
  SERVICE_SHORT,
  VERTICAL_PLURAL,
  VERTICAL_TITLE,
  funnelFor,
  funnelPath,
  type FunnelPage,
  type FunnelService,
} from '@/data/serviceFunnels';

// One service × practice-type funnel page (/marketing-solutions/{service}/{vertical}).
// Copy lives in data/serviceFunnels.ts. Order, one job per section: hero (the
// result + price + CTA) → the moment and what we do → 3 steps → what's
// included → FAQ → other services for this practice type → closing CTA.

const SECTION_PAD = 'w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-20';

const parentPath = (service: FunnelService) => `/marketing-solutions/${service}`;

// Purpose: the result for this practice type, the price anchor and the next step.
function FunnelHero({ page }: { page: FunnelPage }) {
  const price = SERVICE_PRICE[page.service];
  return (
    <section className="relative w-full px-4 sm:px-8 lg:px-16 bg-neutral-950 text-white overflow-hidden pt-24 sm:pt-36 pb-10 sm:pb-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
      />
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <Link
          href={parentPath(page.service)}
          className="min-h-11 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors sm:mb-6"
        >
          <ArrowLeft size={15} />
          {SERVICE_SHORT[page.service]}
        </Link>
        <Eyebrow tone="dark" className="mb-2.5 sm:mb-5">
          {page.keyword}
        </Eyebrow>
        <h1 className="text-[30px] sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-[1.08] text-balance mb-3 sm:mb-6">
          {page.headline}
        </h1>
        <p className="text-[15px] sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-snug mb-5 sm:mb-10 text-balance">{page.sub}</p>
        <div className="[&>div]:mb-0 [&>div>p]:mb-4 sm:[&>div>p]:mb-6 [&_a]:py-3.5 sm:[&_a]:py-4">
          <ServiceHeroActions priceLine={price.line} note={price.note} showPricingLink={false} specialty={page.vertical} />
        </div>
      </div>
    </section>
  );
}

// Purpose: the real search or moment for this practice type, and the three things we do about it.
function MomentSection({ page }: { page: FunnelPage }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-6 md:gap-12 items-center">
        <div className="hidden md:block md:col-span-5">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-900">
            <Image src={nicheHeroTempImages[page.vertical]} alt="" fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
          </div>
        </div>
        <div className="md:col-span-7">
          <Eyebrow className="mb-2 sm:mb-3">{MOMENT_LABEL[page.service]}</Eyebrow>
          <p className="text-[22px] sm:text-3xl font-black font-display tracking-tight leading-snug text-balance">{page.moment}</p>
          <ul className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
            {page.does.map((d) => (
              <li key={d} className="flex gap-2.5 text-[15px] sm:text-lg leading-snug text-neutral-700">
                <LineIcon>
                  <Check size={18} strokeWidth={2.6} className="text-blue-600" />
                </LineIcon>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Purpose: how it works for them, in three short steps.
function StepsSection({ page }: { page: FunnelPage }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-50 text-neutral-950`}>
      <div className="max-w-5xl mx-auto">
        <Eyebrow className="mb-2 sm:mb-3">How it works</Eyebrow>
        <h2 className="text-[26px] sm:text-4xl font-black font-display tracking-tight leading-tight mb-5 sm:mb-10">Three steps, then it runs.</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
          {page.steps.map((s, i) => (
            <li key={s} className="flex md:flex-col gap-3 sm:gap-4 rounded-2xl bg-white border border-neutral-200 p-4 sm:p-6">
              <span className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm sm:text-base">
                {i + 1}
              </span>
              <span className="text-[15px] sm:text-lg font-semibold leading-snug self-center md:self-auto">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Purpose: what's included, in their words.
function IncludedSection({ page }: { page: FunnelPage }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-5xl mx-auto">
        <Eyebrow className="mb-2 sm:mb-3">What you get</Eyebrow>
        <h2 className="text-[26px] sm:text-4xl font-black font-display tracking-tight leading-tight mb-5 sm:mb-10">
          What’s included for {VERTICAL_PLURAL[page.vertical]}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 sm:gap-y-4">
          {page.included.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] sm:text-lg leading-snug text-neutral-700">
              <LineIcon>
                <Check size={18} strokeWidth={2.6} className="text-blue-600" />
              </LineIcon>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Purpose: the other five services for this practice type, plus the way back up.
function OtherServicesFor({ page }: { page: FunnelPage }) {
  const others = FUNNEL_SERVICES.filter((s) => s !== page.service);
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 pt-10 sm:pt-16 pb-2 bg-white text-neutral-950">
      <div className="max-w-5xl mx-auto">
        <Eyebrow className="mb-3 sm:mb-5">More for {VERTICAL_PLURAL[page.vertical]}</Eyebrow>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {others.map((s) => (
            <li key={s}>
              <Link
                href={funnelPath(s, page.vertical)}
                data-spot
                className="group ix-card relative flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 sm:py-4 hover:border-blue-300 transition-colors"
              >
                <span className="font-bold group-hover:text-blue-600 transition-colors">{SERVICE_SHORT[s]}</span>
                <ArrowRight size={16} className="shrink-0 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-neutral-600">
          <Link href={parentPath(page.service)} className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
            {SERVICE_SHORT[page.service]} for every practice type
          </Link>
          <span className="mx-2 text-neutral-300">·</span>
          <Link href={`/solutions/${page.vertical}`} className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
            Everything for {VERTICAL_PLURAL[page.vertical]}
          </Link>
        </p>
      </div>
    </section>
  );
}

export function FunnelPageView({ page }: { page: FunnelPage }) {
  return (
    <>
      <FunnelHero page={page} />
      <MomentSection page={page} />
      <StepsSection page={page} />
      <IncludedSection page={page} />
      <ServiceFaqSection heading={`Questions from ${VERTICAL_PLURAL[page.vertical]}`} faqs={page.faqs} />
      <OtherServicesFor page={page} />
      <ServiceClosingCta trackId={`funnel_${page.service}_${page.vertical}`} specialty={page.vertical} />
    </>
  );
}

type Params = { params: Promise<{ vertical: string }> };

/**
 * Everything a /marketing-solutions/{service}/[vertical] route exports, so each
 * service folder's route is three lines.
 */
export function funnelRoute(service: FunnelService) {
  const parent = servicePages.find((p) => p.slug === service);
  return {
    generateStaticParams: () => FUNNEL_VERTICALS.map((vertical) => ({ vertical })),
    generateMetadata: async ({ params }: Params): Promise<Metadata> => {
      const { vertical } = await params;
      const page = funnelFor(service, vertical);
      if (!page) return {};
      return buildMetadata({ path: funnelPath(service, page.vertical), title: page.metaTitle, description: page.metaDescription });
    },
    Page: async function FunnelRoutePage({ params }: Params) {
      const { vertical } = await params;
      const page = funnelFor(service, vertical);
      if (!page) notFound();
      const path = funnelPath(service, page.vertical);
      return (
        <main className="w-full bg-white text-neutral-950">
          <JsonLd
            data={serviceJsonLd({
              path,
              serviceType: `${parent?.serviceType ?? SERVICE_SHORT[service]} for ${VERTICAL_TITLE[page.vertical]}`,
              name: `Axeon Studio: ${SERVICE_SHORT[service]} for ${VERTICAL_PLURAL[page.vertical]}`,
              description: page.metaDescription,
              audience: [VERTICAL_TITLE[page.vertical]],
              plan: service === 'advertising' || service === 'video-photography' ? 'growth' : 'core',
            })}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'How it works', path: '/marketing-solutions' },
              { name: parent?.name ?? SERVICE_SHORT[service], path: parentPath(service) },
              { name: VERTICAL_TITLE[page.vertical], path },
            ]}
          />
          <ServiceFaqJsonLd items={page.faqs} />
          <FunnelPageView page={page} />
        </main>
      );
    },
  };
}

/** Compact list of the six service funnels for one practice type (used on /solutions/{vertical}). */
export function ServicesForVertical({ vertical }: { vertical: PracticeVertical }) {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-16 bg-white text-neutral-950">
      <div className="max-w-5xl mx-auto">
        <Eyebrow className="mb-3 sm:mb-5">Services for {VERTICAL_PLURAL[vertical]}</Eyebrow>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {FUNNEL_SERVICES.map((s) => (
            <li key={s}>
              <Link
                href={funnelPath(s, vertical)}
                data-spot
                className="group ix-card relative flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 sm:py-4 hover:border-blue-300 transition-colors"
              >
                <span className="font-bold group-hover:text-blue-600 transition-colors">{SERVICE_SHORT[s]}</span>
                <ArrowRight size={16} className="shrink-0 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
