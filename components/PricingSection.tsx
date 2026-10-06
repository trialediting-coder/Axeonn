'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  LayoutTemplate,
  Sparkles,
  ArrowRight,
  Gauge,
  Megaphone,
  PhoneCall,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  pricingTiers,
  addOns,
  pricingFaqs,
  guaranteeSentence,
  FEATURED_BULLETS,
  MINIMUM_TERM,
  ANNUAL_DEAL,
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
}

// Everything renders visible by default (no scroll-triggered opacity), so
// full-page captures and crawlers never see a blank section.
export function PricingSection({
  includeFaqSchema = false,
  tightTop = false,
  afterPlans,
  beforeFaq,
}: PricingSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section
      id="pricing"
      className={`w-full ${tightTop ? 'pt-6 sm:pt-10 lg:pt-14' : 'pt-24 sm:pt-36 lg:pt-44'} pb-24 sm:pb-36 lg:pb-44 px-4 sm:px-10 lg:px-16 xl:px-24`}
    >
      {includeFaqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      )}
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className={`text-center max-w-4xl mx-auto ${tightTop ? 'mb-10 sm:mb-12' : 'mb-12 sm:mb-16'}`}>
          <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
            [ PRICING ]
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display tracking-tight text-neutral-950 mb-6 leading-[1.08]">
            Simple monthly pricing. $99 to start.
          </h2>
          <p className="text-lg sm:text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
            No big build fee. A {MINIMUM_TERM.toLowerCase()}, matched to our 90-day guarantee. {ANNUAL_DEAL}
          </p>
        </div>

        {/* The guarantee: its own full-width blue band, at display size. */}
        <div className="max-w-7xl mx-auto rounded-[28px] sm:rounded-[36px] bg-blue-600 text-white px-6 py-10 sm:px-12 sm:py-14 lg:px-16 shadow-xl shadow-blue-600/20">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono font-bold tracking-widest uppercase text-blue-100">
            <ShieldCheck size={18} className="shrink-0" />
            <span>[ 90-DAY CUSTOMER GUARANTEE ]</span>
          </div>
          <p className="mt-5 text-2xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.15]">
            {guaranteeSentence}
          </p>
          <p className="mt-5 text-sm sm:text-base text-blue-100 leading-relaxed max-w-3xl">
            Included with AxeonCORE and AxeonGROWTH. Baseline set together on your kickoff call and tracked in
            AxeonPROOF. Applies while you&apos;re on your plan and answering new leads within one business day.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid lg:grid-cols-3 gap-8 lg:gap-6 xl:gap-8 items-stretch max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <PlanCard key={tier.id} tier={tier} />
          ))}
        </div>

        <FreeConsultationStrip />

        {afterPlans}

        <div className="mt-20 sm:mt-24">
          <h3 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 mb-8 text-center">
            Add More Ways to Win Customers
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {addOns.map((addOn) => (
              <div
                key={addOn.name}
                className="p-5 sm:p-7 rounded-2xl border border-neutral-200 bg-white text-center shadow-xs"
              >
                <div className="text-base sm:text-lg text-neutral-700 font-medium mb-2 leading-snug">{addOn.name}</div>
                <div className="text-xl sm:text-2xl font-black text-blue-600">{addOn.price}</div>
              </div>
            ))}
          </div>
        </div>

        {beforeFaq}

        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 mb-10 text-center">
            Common Questions About Pricing
          </h3>
          <div className="space-y-4">
            {pricingFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-colors hover:border-neutral-300 shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`pricing-faq-${idx}`}
                    className="w-full p-5 sm:p-7 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                  >
                    <span className="font-bold text-lg sm:text-xl text-neutral-950">{faq.q}</span>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`pricing-faq-${idx}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 sm:px-7 pb-6 sm:pb-7 text-base sm:text-lg text-neutral-600 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
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
        className={`flex gap-3.5 text-base leading-relaxed rounded-2xl p-4 -mx-1 border ${
          isPremium ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'
        }`}
      >
        <Icon size={22} className={`shrink-0 mt-0.5 ${isPremium ? 'text-blue-400' : 'text-blue-500'}`} />
        <span className="font-semibold">{feature}</span>
      </li>
    );
  }
  return (
    <li className="flex gap-3.5 text-base leading-relaxed">
      <Check
        size={20}
        className={`shrink-0 mt-1 ${
          variant === 'plain' ? 'text-neutral-400' : isPremium ? 'text-blue-400' : 'text-blue-600'
        }`}
      />
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
 * Three cards, one job each: the entry tier is the plain card, the tier we
 * sell is the loud one (so the eye lands there), and the top tier is dark so
 * it reads as the premium option. Each card shows its strongest bullets up
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
    <div className={`relative rounded-[28px] sm:rounded-[32px] p-6 sm:p-10 lg:p-8 xl:p-10 flex flex-col ${CARD_STYLES[variant]}`}>
      {tier.badge && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap bg-blue-600 text-white">
          {tier.badge}
        </span>
      )}

      <h3 className="text-2xl sm:text-3xl font-bold font-display mb-1.5">{tier.name}</h3>
      <p
        className={`text-sm sm:text-base font-semibold mb-4 uppercase tracking-wide ${
          isPlain ? 'text-neutral-500' : isPremium ? 'text-blue-400' : 'text-blue-600'
        }`}
      >
        {tier.focus}
      </p>
      {tier.bestFor && (
        <p
          className={`text-sm sm:text-base leading-relaxed mb-6 rounded-xl px-4 py-3 ${
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
        <span className="text-5xl sm:text-6xl font-black tracking-tight whitespace-nowrap">{tier.price}</span>
        <span className={`text-base sm:text-lg font-semibold ${muted}`}>{tier.billingNote}</span>
      </div>
      <p className={`mt-2 text-lg sm:text-xl font-bold ${isPremium ? 'text-white' : 'text-neutral-900'}`}>
        {tier.startFee}
      </p>
      <p className={`mt-1 text-sm sm:text-base leading-relaxed mb-8 ${muted}`}>{tier.startNote}</p>

      {tier.inherits && (
        <p className={`text-sm sm:text-base font-bold uppercase tracking-wide mb-4 ${muted}`}>{tier.inherits}</p>
      )}

      <ul className="space-y-4">
        {shown.map((feature) => (
          <FeatureItem key={feature} feature={feature} variant={variant} highlight={highlights.get(feature)} />
        ))}
      </ul>

      {rest.length > 0 && (
        <details className="group mt-5">
          <summary
            className={`list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1.5 cursor-pointer text-sm sm:text-base font-semibold ${
              isPlain
                ? 'text-neutral-700 hover:text-neutral-950'
                : isPremium
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <span className="group-open:hidden">See everything included ({rest.length} more)</span>
            <span className="hidden group-open:inline">Show less</span>
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="space-y-4 mt-5">
            {rest.map((feature) => (
              <FeatureItem key={feature} feature={feature} variant={variant} highlight={highlights.get(feature)} />
            ))}
          </ul>
        </details>
      )}

      <div className="flex-1 min-h-8" />

      <Link
        href={`/book?tier=${tier.id}`}
        className={`text-center py-4 rounded-full font-bold text-base sm:text-lg transition-colors shadow-sm ${CTA_STYLES[variant]}`}
      >
        {tier.cta}
      </Link>
      <p className={`mt-3 text-center text-xs sm:text-sm ${muted}`}>
        Free 20-minute call, no obligation.{' '}
        <a href="tel:+15154938017" className="font-semibold underline underline-offset-2">
          Or call (515) 493-8017
        </a>
      </p>
    </div>
  );
}

/**
 * Not a fourth plan: a slim strip under the plans. Booking the free call
 * comes with a custom homepage mockup and an AI visibility report, and covers
 * custom scopes no plan fits.
 */
function FreeConsultationStrip() {
  return (
    <div className="mt-8 max-w-7xl mx-auto rounded-3xl border border-neutral-200 bg-[#F7F6F3] px-6 py-6 sm:px-8 sm:py-7 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
          [ NOT SURE YET? $0 CONSULTATION ]
        </p>
        <p className="mt-2 text-lg sm:text-xl font-bold font-display text-neutral-950 leading-snug">
          Book a free call and see your new homepage before you spend a dollar.
        </p>
        <ul className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base text-neutral-600">
          <li className="flex items-center gap-2">
            <LayoutTemplate size={16} className="shrink-0 text-blue-600" />
            A custom homepage mockup
          </li>
          <li className="flex items-center gap-2">
            <Sparkles size={16} className="shrink-0 text-blue-600" />
            Your AI visibility report
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="shrink-0 text-blue-600" />
            Yours to keep, or a custom scope if no plan fits
          </li>
        </ul>
      </div>
      <Link
        href="/book"
        data-track="cta_click"
        data-track-cta="free_consultation_card"
        className="shrink-0 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-base transition-colors"
      >
        Book My Free Consultation <ArrowRight size={16} />
      </Link>
    </div>
  );
}
