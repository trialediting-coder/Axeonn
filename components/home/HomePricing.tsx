import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { SetupPrice } from '@/components/common/SetupPrice';
import { OFFER_LINE, pricingTiers } from '@/data/pricingData';

// Homepage pricing on phones, compact (owner, 2026-10-22: keep the price on the
// homepage as a trust signal, but one screen instead of the full /pricing block;
// desktop keeps the full block). Names and
// prices come from data/pricingData.ts; the three bullets per plan are the short
// version of its feature lists. The full lists, add-ons and terms stay on /pricing.
const SHORT_BULLETS: Record<string, string[]> = {
  axeoncore: [
    'A custom website built to book consultations',
    'Every call and inquiry answered in 60 seconds, plus an AI phone receptionist',
    'AxeonPROOF: every result on your own dashboard',
  ],
  axeongrowth: [
    'Everything in AxeonCORE',
    'Google Local Services Ads and search ads, run for you',
    'Quarterly photo and video, and campaigns to past patients and clients',
  ],
};

// Purpose: the two plans and the price, in one screen, with the way into full pricing.
export function HomePricing() {
  return (
    <section id="pricing-compact" aria-labelledby="home-pricing-heading" className="w-full py-14 sm:py-24 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-[1100px] mx-auto">
        <div className="text-center">
          <p className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-blue-600">Pricing</p>
          <h2
            id="home-pricing-heading"
            className="mt-3 text-[32px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.05]"
          >
            Two plans. No&nbsp;surprises.
          </h2>
          <p className="mt-3 sm:mt-5 text-lg sm:text-2xl font-bold text-blue-600">{OFFER_LINE}</p>
        </div>

        <div className="mt-8 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {pricingTiers.map((tier) => {
            const dark = tier.variant === 'premium';
            return (
              <div
                key={tier.id}
                className={`rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 flex flex-col ${
                  dark ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 border-2 border-blue-600 shadow-xl shadow-blue-600/10'
                }`}
              >
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {tier.name.replace(/(CORE|GROWTH)$/, '')}
                  <span className="text-blue-500">{tier.name.match(/(CORE|GROWTH)$/)?.[0]}</span>
                </h3>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className={`text-sm font-semibold ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>From</span>
                  <span className="text-5xl sm:text-6xl font-black tracking-tight">{tier.price}</span>
                  <span className={`text-base font-semibold ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{tier.billingNote}</span>
                </p>
                <p className={`mt-2 text-sm sm:text-base ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  <SetupPrice was={tier.setupWas} />
                </p>
                <ul className="mt-6 sm:mt-8 space-y-3">
                  {(SHORT_BULLETS[tier.id] ?? []).map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[15px] sm:text-lg leading-snug">
                      <Check size={20} className={`shrink-0 mt-0.5 ${dark ? 'text-blue-400' : 'text-blue-600'}`} aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6">
          <a
            href="#contact-section"
            data-track="cta_click"
            data-track-cta="home_pricing_form"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/20"
          >
            Check if your area is open <ArrowRight size={16} />
          </a>
          <Link href="/pricing" className="py-2 inline-flex items-center justify-center gap-2 font-bold text-neutral-950 hover:text-blue-600 transition-colors">
            See full pricing <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
