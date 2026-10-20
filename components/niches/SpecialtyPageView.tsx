import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import LineIcon from '@/components/common/LineIcon';
import { Eyebrow } from '@/components/common/Eyebrow';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';
import { ServiceFaqSection } from '@/components/marketing-solutions/SolutionSections';
import { HeroBackdrop } from '@/components/marketing-solutions/HeroBackdrop';
import { nicheHeroTempImages } from '@/data/nicheHeroTempImages';
import { serviceHeroImages } from '@/data/serviceHeroImages';
import { FUNNEL_SERVICES, SERVICE_PRICE, SERVICE_SHORT, VERTICAL_PLURAL, funnelPath } from '@/data/serviceFunnels';
import { specialtiesFor, specialtyPath, type SpecialtyPage } from '@/data/specialtyPages';

// One practice-area page (/solutions/{vertical}/{specialty}). Copy lives in
// data/specialtyPages.ts. Order, one job per section: hero (result + price +
// CTA) → the moment and what we do → where new clients slip away → 3 steps →
// what's included → FAQ → sibling practice areas and services → closing CTA.

const SECTION_PAD = 'w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-20';

function SpecialtyHero({ page }: { page: SpecialtyPage }) {
  const price = SERVICE_PRICE.website;
  return (
    <section className="relative w-full px-4 sm:px-8 lg:px-16 bg-neutral-950 text-white overflow-hidden pt-24 sm:pt-36 pb-10 sm:pb-20">
      <HeroBackdrop photo={{ src: nicheHeroTempImages[page.vertical], position: '50% 35%' }} />
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <Link
          href={`/solutions/${page.vertical}`}
          className="min-h-11 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors sm:mb-6"
        >
          <ArrowLeft size={15} />
          All {VERTICAL_PLURAL[page.vertical]}
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

// Purpose: the real search for this practice area, and the three things we do about it.
function MomentSection({ page }: { page: SpecialtyPage }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-6 md:gap-12 items-center">
        <div className="hidden md:block md:col-span-5">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-900">
            <Image src={serviceHeroImages['lead-generation'].src} alt="" fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
          </div>
        </div>
        <div className="md:col-span-7">
          <Eyebrow className="mb-2 sm:mb-3">The search</Eyebrow>
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

// Purpose: where new clients slip away today, one line each.
function LeaksSection({ page }: { page: SpecialtyPage }) {
  return (
    <section className={`${SECTION_PAD} bg-neutral-950 text-white`}>
      <div className="max-w-5xl mx-auto">
        <Eyebrow tone="dark" className="mb-2 sm:mb-3">
          Where they slip away
        </Eyebrow>
        <h2 className="text-[26px] sm:text-4xl font-black font-display tracking-tight leading-tight mb-5 sm:mb-10">
          Where new {page.vertical === 'dental' ? 'patients go to the next office' : 'clients go to the next firm'}.
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {page.leaks.map((l) => (
            <li key={l.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <p className="font-bold text-[17px] sm:text-xl mb-1">{l.title}</p>
              <p className="text-[15px] sm:text-lg text-neutral-300 leading-snug">{l.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StepsSection({ page }: { page: SpecialtyPage }) {
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

function IncludedSection({ page }: { page: SpecialtyPage }) {
  return (
    <section className={`${SECTION_PAD} bg-white text-neutral-950`}>
      <div className="max-w-5xl mx-auto">
        <Eyebrow className="mb-2 sm:mb-3">What you get</Eyebrow>
        <h2 className="text-[26px] sm:text-4xl font-black font-display tracking-tight leading-tight mb-5 sm:mb-10">What’s included</h2>
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

const linkCard =
  'group ix-card relative flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 sm:py-4 hover:border-blue-300 transition-colors';

function LinkGrid({ label, links }: { label: string; links: { href: string; text: string }[] }) {
  return (
    <div>
      <Eyebrow className="mb-3 sm:mb-5">{label}</Eyebrow>
      {/* Four links sit in one row on desktop instead of wrapping 3 + 1. */}
      <ul className={`grid grid-cols-1 sm:grid-cols-2 ${links.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-2 sm:gap-3`}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} data-spot className={linkCard}>
              <span className="font-bold group-hover:text-blue-600 transition-colors">{l.text}</span>
              <ArrowRight size={16} className="shrink-0 text-neutral-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Purpose: the other practice areas and the services for this practice type.
function MoreLinks({ page }: { page: SpecialtyPage }) {
  const siblings = specialtiesFor(page.vertical).filter((s) => s.slug !== page.slug);
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 pt-10 sm:pt-16 pb-2 bg-white text-neutral-950">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
        {siblings.length > 0 && (
          <LinkGrid label="Other practice areas" links={siblings.map((s) => ({ href: specialtyPath(s), text: s.name }))} />
        )}
        <LinkGrid
          label={`Services for ${VERTICAL_PLURAL[page.vertical]}`}
          links={FUNNEL_SERVICES.map((s) => ({ href: funnelPath(s, page.vertical), text: SERVICE_SHORT[s] }))}
        />
      </div>
    </section>
  );
}

export function SpecialtyPageView({ page }: { page: SpecialtyPage }) {
  return (
    <>
      <SpecialtyHero page={page} />
      <MomentSection page={page} />
      <LeaksSection page={page} />
      <StepsSection page={page} />
      <IncludedSection page={page} />
      <ServiceFaqSection heading={`${page.name}: common questions`} faqs={page.faqs} />
      <MoreLinks page={page} />
      <ServiceClosingCta trackId={`specialty_${page.vertical}_${page.slug}`} specialty={page.vertical} />
    </>
  );
}

/** Links to every practice-area page for one practice type (used on /solutions/{vertical}). */
export function SpecialtiesForVertical({ vertical }: { vertical: string }) {
  const pages = specialtiesFor(vertical);
  if (pages.length === 0) return null;
  return (
    <section className="w-full px-4 sm:px-8 lg:px-16 pt-10 sm:pt-16 bg-white text-neutral-950">
      <div className="max-w-5xl mx-auto">
        <LinkGrid label="By practice area" links={pages.map((p) => ({ href: specialtyPath(p), text: p.name }))} />
      </div>
    </section>
  );
}
