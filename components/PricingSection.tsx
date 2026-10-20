'use client';

import LineIcon from '@/components/common/LineIcon';
import { useState, type ReactNode } from 'react';
import { SetupPrice } from '@/components/common/SetupPrice';
import Link from 'next/link';
import {
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  MapPin,
  ArrowRight,
  Gauge,
  Megaphone,
  PhoneCall,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  pricingTiers,
  addOns,
  pricingFaqs,
  COMMITMENT_HEADLINE,
  COMMITMENT_NOTE,
  COMMITMENT_TERMS_HREF,
  FEATURED_BULLETS,
  TERM_LINE,
  TERRITORY_LINE,
  OFFER_LINE,
  OFFER_POINTS,
  EXCLUSIVITY_LINE,
  AREA_CHECK_HREF,
  AREA_CHECK_CTA_LONG,
  type HighlightIcon,
  type PricingTier,
} from '@/data/pricingData';

const HIGHLIGHT_ICONS: Record<HighlightIcon, LucideIcon> = {
  proof: Gauge,
  ads: Megaphone,
  video: Clapperboard,
  phone: PhoneCall,
};

const pricingFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: pricingFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

interface PricingSectionProps {
  /**
   * Emit the FAQPage JSON-LD. Only /pricing should — the homepage already
   * carries its own FAQPage block from components/home/FAQ, and two on one
   * URL is a structured-data error.
   */
  includeFaqSchema?: boolean;
  /** Less top padding, for /pricing where the plans should start near the first screen. */
  tightTop?: boolean;
  /** Rendered right under the plans (e.g. the 21x speed band on /pricing). */
  afterPlans?: ReactNode;
  /** Rendered between the add-ons and the pricing FAQ. */
  beforeFaq?: ReactNode;
  /**
   * Show the pricing FAQ. The homepage turns it off: its own FAQ section
   * already answers cost, the commitment and which plan to pick.
   */
  showFaq?: boolean;
}

// Everything renders visible by default (no scroll-triggered opacity), so
// full-page captures and crawlers never see a blank section.
//
// Mobile-first (2026-10-19): one wrapper, but each block below has its own h2
// and fits one phone screen: intro, the commitment, each plan card, add-ons,
// and the pricing FAQ (collapsed so every question shows at once).
export function PricingSection({
  includeFaqSchema = false,
  tightTop = false,
  showFaq = true,
  afterPlans,
  beforeFaq,
}: PricingSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <section
      id="pricing"
      className={`w-full ${tightTop ? 'pt-6 sm:pt-10 lg:pt-14' : 'pt-10 sm:pt-36 lg:pt-44'} pb-10 sm:pb-36 lg:pb-44 px-4 sm:px-10 lg:px-10 xl:px-12 2xl:px-16`}
    >
      {includeFaqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      )}
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        {/* Purpose: the two plans and the offer in one line each, before any detail. */}
        <div className={`text-center max-w-4xl mx-auto ${tightTop ? 'mb-8 sm:mb-12' : 'mb-8 sm:mb-16'}`}>
          <span className="block mb-3 sm:mb-4 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
            [ PRICING ]
          </span>
          <h2 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display tracking-tight text-neutral-950 mb-3 sm:mb-6 leading-[1.08]">
            Two plans. Every inquiry answered.
          </h2>
          <p className="text-base sm:text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
            AxeonCORE from $799/mo. AxeonGROWTH from $1,999/mo. One growth partner either way.
          </p>
          <p className="mt-3 sm:mt-5 text-lg sm:text-2xl font-extrabold font-display tracking-tight text-blue-600">{OFFER_LINE}</p>
          <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-base font-semibold text-neutral-700 text-balance">
            <SetupPrice /> · <DotParts text={TERM_LINE} />
          </p>
        </div>

        {/* Purpose: the 90-day performance commitment in one line; the full terms are in the pricing FAQ. */}
        <div className="max-w-[1240px] mx-auto rounded-[24px] sm:rounded-[36px] bg-blue-600 text-white px-5 py-7 sm:px-12 sm:py-14 lg:px-16 shadow-xl shadow-blue-600/20">
          <h2 className="flex items-center gap-2.5 text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-blue-100">
            <ShieldCheck size={18} className="shrink-0" />
            <span>[ 90-DAY PERFORMANCE COMMITMENT ]</span>
          </h2>
          <p className="mt-3 sm:mt-5 text-xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.2] sm:leading-[1.1] max-w-4xl">
            {COMMITMENT_HEADLINE}
          </p>
          <p className="mt-3 sm:mt-5 text-sm sm:text-base text-blue-100">
            {COMMITMENT_NOTE}{' '}
            <a href={COMMITMENT_TERMS_HREF} className="font-semibold text-white underline underline-offset-2">
              See the terms
            </a>
          </p>
        </div>

        {/* Purpose: each plan's price, terms and top five inclusions; one card per phone screen. */}
        <div className="ix-plans mt-10 sm:mt-16 grid lg:grid-cols-2 gap-10 sm:gap-8 lg:gap-8 xl:gap-12 items-stretch max-w-[1240px] mx-auto">
          {pricingTiers.map((tier) => (
            <PlanCard key={tier.id} tier={tier} />
          ))}
        </div>

        <OfferStrip />

        {afterPlans}

        {/* Purpose: what can be added to a plan, and what it costs. */}
        <div className="mt-12 sm:mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 mb-4 sm:mb-8 text-center">
            Add-ons
          </h2>
          <ul className="max-w-[1240px] mx-auto divide-y divide-neutral-200 border-y border-neutral-200 sm:divide-y-0 sm:border-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {addOns.map((addOn) => (
              <li
                key={addOn.name}
                className="flex items-center justify-between gap-4 py-3 sm:block sm:p-7 sm:rounded-2xl sm:border sm:border-neutral-200 sm:bg-white sm:text-center sm:shadow-xs"
              >
                <div className="text-[15px] sm:text-lg text-neutral-700 font-medium sm:mb-2 leading-snug">{addOn.name}</div>
                <div className="shrink-0 text-base sm:text-2xl font-black text-blue-600 whitespace-nowrap">{addOn.price}</div>
              </li>
            ))}
          </ul>
        </div>

        {beforeFaq}

        {showFaq && (
          // Purpose: straight answers to the pricing questions; collapsed so every question shows in one view.
          // id="pricing-faq": the commitment band's "See the terms" link lands here; the html
          // scroll-padding-top in globals.css keeps it clear of the sticky header.
          <div id="pricing-faq" className="mt-12 sm:mt-24 max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 mb-4 sm:mb-10 text-center">
              Common Questions About Pricing
            </h2>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200 sm:divide-y-0 sm:border-0 sm:space-y-4">
              {pricingFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={faq.q}
                    className="sm:rounded-2xl sm:border sm:border-neutral-200 bg-white overflow-hidden transition-colors sm:hover:border-neutral-300 sm:shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      aria-controls={`pricing-faq-${idx}`}
                      className="w-full min-h-[44px] py-2.5 sm:p-7 text-left flex items-center cursor-pointer sm:hover:bg-neutral-50/50 transition-colors"
                    >
                      {/* Inner row: the toggle sits on the question's first line when it wraps. */}
                      <span className="flex w-full items-start justify-between gap-4">
                        <span className="font-bold text-[15px] sm:text-xl text-neutral-950 leading-snug">{faq.q}</span>
                        <LineIcon className="text-[15px] sm:text-xl leading-snug">
                          <span
                            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full grid place-items-center transition-colors ${
                              isOpen ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </LineIcon>
                      </span>
                    </button>

                    {/* Always in the HTML (collapsed with `hidden`) so crawlers read the answers. */}
                    <div id={`pricing-faq-${idx}`} hidden={!isOpen}>
                      <p className="sm:px-7 pb-4 sm:pb-7 text-[15px] sm:text-lg text-neutral-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** "a · b · c" with each part kept whole, so lines break at the dots, never mid-phrase. */
function DotParts({ text }: { text: string }) {
  const parts = text.split(' · ');
  return (
    <>
      {parts.map((part, i) => (
        <span key={part}>
          <span className="whitespace-nowrap">{part}</span>
          {i < parts.length - 1 && ' · '}
        </span>
      ))}
    </>
  );
}

type CardVariant = PricingTier['variant'];

function FeatureItem({
  feature,
  variant,
  highlight,
}: {
  feature: string;
  variant: CardVariant;
  highlight?: HighlightIcon;
}) {
  const isPremium = variant === 'premium';
  if (highlight) {
    const Icon = HIGHLIGHT_ICONS[highlight];
    return (
      <li
        className={`flex items-start gap-3 sm:gap-3.5 text-[15px] sm:text-base leading-snug sm:leading-relaxed rounded-xl sm:rounded-2xl px-3 py-2.5 sm:p-4 -mx-1 border ${
          isPremium ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'
        }`}
      >
        <LineIcon>
          <Icon size={20} className={isPremium ? 'text-blue-400' : 'text-blue-500'} />
        </LineIcon>
        <span className="font-semibold">{feature}</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-3 sm:gap-3.5 text-[15px] sm:text-base leading-snug sm:leading-relaxed">
      <LineIcon>
        <Check
          size={18}
          className={variant === 'plain' ? 'text-neutral-400' : isPremium ? 'text-blue-400' : 'text-blue-600'}
        />
      </LineIcon>
      <span>{feature}</span>
    </li>
  );
}

const CARD_STYLES: Record<CardVariant, string> = {
  plain: 'bg-neutral-50 text-neutral-900 border border-neutral-200 shadow-sm',
  featured:
    'bg-white text-neutral-950 border-2 border-blue-600 shadow-2xl shadow-blue-600/20 ring-8 ring-blue-600/10 z-10',
  premium: 'bg-[#080b12] text-white border border-neutral-800 shadow-xl',
};

const CTA_STYLES: Record<CardVariant, string> = {
  plain: 'bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300',
  featured: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
  premium: 'bg-white hover:bg-neutral-200 text-neutral-950',
};

/**
 * Two cards: AxeonCORE is the loud one (where most practices start), and
 * AxeonGROWTH is dark so it reads as the premium option. Each card shows its strongest bullets up
 * front; the rest stay one tap away in a native <details>, so they remain in
 * the HTML for crawlers.
 */
function PlanCard({ tier }: { tier: PricingTier }) {
  const { variant } = tier;
  const isPlain = variant === 'plain';
  const isPremium = variant === 'premium';
  const highlights = new Map((tier.highlightFeatures ?? []).map((h) => [h.feature, h.icon]));
  const shown = tier.features.slice(0, FEATURED_BULLETS);
  const rest = tier.features.slice(FEATURED_BULLETS);
  const muted = isPremium ? 'text-neutral-400' : 'text-neutral-500';

  return (
    <div
      data-spot={isPremium ? 'dark' : ''}
      className={`ix-card relative rounded-[24px] sm:rounded-[32px] px-5 pt-7 pb-5 sm:p-10 lg:p-9 xl:p-12 flex flex-col ${CARD_STYLES[variant]}`}
    >
      {tier.badge && (
        <span className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap bg-blue-600 text-white">
          {tier.badge}
        </span>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold font-display mb-1 sm:mb-1.5">{tier.name}</h2>
      <p
        className={`text-xs sm:text-base font-semibold mb-3 sm:mb-4 uppercase tracking-wide ${
          isPlain ? 'text-neutral-500' : isPremium ? 'text-blue-400' : 'text-blue-600'
        }`}
      >
        {tier.focus}
      </p>
      {tier.bestFor && (
        <p
          className={`hidden sm:block text-sm sm:text-base leading-relaxed mb-6 rounded-xl px-4 py-3 ${
            isPlain
              ? 'bg-white border border-neutral-200 text-neutral-700'
              : isPremium
                ? 'bg-white/5 text-neutral-300'
                : 'bg-blue-50 text-blue-900'
          }`}
        >
          {tier.bestFor}
        </p>
      )}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {tier.pricePrefix && <span className={`text-base sm:text-lg font-semibold ${muted}`}>{tier.pricePrefix}</span>}
        <span className="text-[44px] leading-none sm:text-6xl font-black tracking-tight whitespace-nowrap">{tier.price}</span>
        <span className={`text-base sm:text-lg font-semibold ${muted}`}>{tier.billingNote}</span>
      </div>
      <p className={`mt-2 text-lg sm:text-2xl font-bold leading-snug ${isPremium ? 'text-white' : 'text-neutral-900'}`}>
        <SetupPrice was={tier.setupWas} />
      </p>
      <p className={`mt-0.5 text-sm sm:text-base font-semibold text-balance ${muted}`}><DotParts text={tier.startFee} /></p>
      {/* Phones: the start note and "right for you if" sit behind "See everything included". */}
      {tier.startNote ? (
        <p className={`hidden sm:block mt-1 text-sm sm:text-base leading-relaxed mb-8 ${muted}`}>{tier.startNote}</p>
      ) : (
        <div className="hidden sm:block mb-8" />
      )}
      <div className="mb-4 sm:hidden" />

      {tier.inherits && (
        <p className={`text-xs sm:text-base font-bold uppercase tracking-wide mb-3 sm:mb-4 ${muted}`}>{tier.inherits}</p>
      )}

      <ul className="space-y-2.5 sm:space-y-4">
        {shown.map((feature) => (
          <FeatureItem key={feature} feature={feature} variant={variant} highlight={highlights.get(feature)} />
        ))}
      </ul>

      {(rest.length > 0 || tier.startNote || tier.bestFor) && (
        <details className="group mt-2 sm:mt-5">
          <summary
            className={`min-h-[44px] py-2 list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1.5 cursor-pointer text-sm sm:text-base font-semibold ${
              isPlain
                ? 'text-neutral-700 hover:text-neutral-950'
                : isPremium
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <span className="group-open:hidden">
              See everything included{rest.length > 0 && ` (${rest.length} more)`}
            </span>
            <span className="hidden group-open:inline">Show less</span>
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          {(tier.startNote || tier.bestFor) && (
            <div className={`sm:hidden mt-3 space-y-2 text-sm leading-relaxed ${muted}`}>
              {tier.startNote && <p>{tier.startNote}</p>}
              {tier.bestFor && <p>{tier.bestFor}</p>}
            </div>
          )}
          {rest.length > 0 && (
            <ul className="space-y-2.5 sm:space-y-4 mt-3 sm:mt-5">
              {rest.map((feature) => (
                <FeatureItem key={feature} feature={feature} variant={variant} highlight={highlights.get(feature)} />
              ))}
            </ul>
          )}
        </details>
      )}

      <div className="flex-1 min-h-3 sm:min-h-8" />

      <Link
        href={`${AREA_CHECK_HREF}?plan=${tier.id}`}
        data-track="cta_click"
        data-track-cta={`pricing_area_check_${tier.id}`}
        className={`text-center py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-colors shadow-sm ${CTA_STYLES[variant]}`}
      >
        {tier.cta}
      </Link>
      <Link
        href={`/book?tier=${tier.id}`}
        data-track="cta_click"
        data-track-cta={`pricing_call_${tier.id}`}
        className={`mt-2 sm:mt-3 text-center py-2.5 sm:py-3 rounded-full font-semibold text-base transition-colors border ${
          isPremium ? 'border-white/20 hover:border-white/40 text-white' : 'border-neutral-300 hover:border-neutral-400 text-neutral-900'
        }`}
      >
        Book a call
      </Link>
      <p className={`mt-1 sm:mt-3 text-center text-xs sm:text-sm ${muted}`}>
        <span className="hidden sm:inline">No checkout here. We start by checking your area, or with a call. </span>
        <a href="tel:+15154938017" className="inline-block py-2 font-semibold underline underline-offset-2">
          Or call (515) 493-8017
        </a>
      </p>
    </div>
  );
}

/**
 * Not a third plan: a slim strip under the plans with the front-door offer
 * ("$0 to start. Nothing due until it's working.") and the area check, which
 * is where every partnership starts. Exclusivity is a policy, never a countdown.
 */
function OfferStrip() {
  return (
    <div className="mt-10 sm:mt-8 max-w-[1240px] mx-auto rounded-3xl border border-neutral-200 bg-[#F7F6F3] px-5 py-5 sm:px-8 sm:py-7 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ HOW IT STARTS ]</p>
        <p className="mt-2 text-lg sm:text-xl font-bold font-display text-neutral-950 leading-snug">{OFFER_LINE}</p>
        <p className="mt-1 text-base sm:text-lg text-neutral-800">
          <SetupPrice />
        </p>
        <ul className="mt-3 flex flex-col gap-y-2 text-sm sm:text-base text-neutral-600">
          {OFFER_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <LineIcon>
                <Check size={16} className="text-blue-600" strokeWidth={3} />
              </LineIcon>
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-sm sm:text-base text-neutral-600">
          <LineIcon>
            <MapPin size={16} className="text-blue-600" />
          </LineIcon>
          {EXCLUSIVITY_LINE}
        </p>
      </div>
      <Link
        href={AREA_CHECK_HREF}
        data-track="cta_click"
        data-track-cta="area_check_strip"
        className="shrink-0 inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-base transition-colors"
      >
        {AREA_CHECK_CTA_LONG} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
