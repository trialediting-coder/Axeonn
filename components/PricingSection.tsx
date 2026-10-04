'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, ChevronDown, ChevronUp, Clapperboard, MessagesSquare, LayoutTemplate, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pricingTiers, addOns, pricingFaqs, customerGuarantee } from '@/data/pricingData';

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
}

export function PricingSection({ includeFaqSchema = false, tightTop = false }: PricingSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section id="pricing" className={`w-full ${tightTop ? 'pt-6 sm:pt-10 lg:pt-14' : 'pt-24 sm:pt-36 lg:pt-44'} pb-24 sm:pb-36 lg:pb-44 px-6 sm:px-10 lg:px-16 xl:px-24`}>
      {includeFaqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
        />
      )}
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className={`text-center max-w-4xl mx-auto ${tightTop ? 'mb-12 sm:mb-16' : 'mb-16 sm:mb-20'}`}
        >
          <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ PRICING ]</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-neutral-950 mb-6 leading-[1.12]">
            Two Ways to Get More Customers
          </h2>
          <p className="text-xl sm:text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
            A one-time setup, then a monthly plan that keeps new customers coming in.
            Monthly plans start at $284 and are tailored to your market on the call.
          </p>
          <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-200 text-base font-semibold text-blue-800">
            <ShieldCheck size={18} className="shrink-0" />
            <span>{customerGuarantee}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10 xl:gap-8 items-stretch max-w-6xl xl:max-w-[1500px] 2xl:max-w-[1600px] mx-auto">
          {pricingTiers.map((tier, idx) => {
            // The entry tier is deliberately the plain card and the featured
            // (recommended) tier the loud one, so the eye lands on the tier we
            // want to sell. The free-call card sits beside them.
            const isPlain = !tier.featured;
            const highlights = new Set(tier.highlightFeatures ?? []);
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className={`relative rounded-[32px] p-8 sm:p-10 lg:p-12 xl:p-10 2xl:p-12 flex flex-col ${
                  isPlain
                    ? 'bg-neutral-50 text-neutral-900 border border-neutral-200 shadow-sm'
                    : 'bg-white text-neutral-950 border-2 border-blue-600 shadow-2xl shadow-blue-600/20 ring-8 ring-blue-600/10 lg:scale-[1.03] z-10'
                }`}
              >
                {tier.badge && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap ${
                      'bg-blue-600 text-white'
                    }`}
                  >
                    {tier.badge}
                  </motion.span>
                )}

                <h3 className="text-2xl sm:text-3xl font-bold mb-1.5">{tier.name}</h3>
                <p
                  className={`text-sm sm:text-base font-semibold mb-4 uppercase tracking-wide ${
                    isPlain ? 'text-neutral-500' : 'text-blue-600'
                  }`}
                >
                  {tier.focus}
                </p>
                {tier.bestFor && (
                  <p
                    className={`text-sm sm:text-base leading-relaxed mb-5 rounded-xl px-4 py-3 ${
                      isPlain ? 'bg-white border border-neutral-200 text-neutral-700' : 'bg-blue-50 text-blue-900'
                    }`}
                  >
                    {tier.bestFor}
                  </p>
                )}
                <p
                  className={`text-base sm:text-lg mb-6 leading-relaxed ${
                    'text-neutral-500'
                  }`}
                >
                  {tier.billingNote}
                </p>
                <div className="text-4xl sm:text-6xl font-black mb-2 tracking-tight whitespace-nowrap">{tier.price}</div>
                <p className="text-lg sm:text-xl font-bold text-neutral-900">
                  then {tier.monthly}
                </p>
                <p className="mt-1 text-sm sm:text-base text-neutral-500 leading-relaxed mb-8">
                  {tier.monthlyNote}
                </p>

                {tier.inherits && (
                  <p
                    className={`text-sm sm:text-base font-bold uppercase tracking-wide mb-4 ${
                      'text-neutral-500'
                    }`}
                  >
                    {tier.inherits}
                  </p>
                )}

                <ul className="space-y-4 mb-8 flex-1">
                  {tier.features.map((feature) => {
                    const isHighlight = highlights.has(feature);
                    if (isHighlight) {
                      return (
                        <li
                          key={feature}
                          className="flex gap-3.5 text-base sm:text-lg leading-relaxed rounded-2xl p-4 sm:p-5 -mx-1 bg-blue-50 border border-blue-100"
                        >
                          <Clapperboard size={22} className="shrink-0 mt-0.5 text-blue-400" />
                          <span className="font-semibold">{feature}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={feature} className="flex gap-3.5 text-base sm:text-lg leading-relaxed">
                        <Check size={20} className={`shrink-0 mt-1 ${isPlain ? 'text-neutral-400' : 'text-blue-600'}`} />
                        <span>{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href={`/book?tier=${tier.id}`}
                  className={`text-center py-4 sm:py-4.5 rounded-full font-bold text-base sm:text-lg transition-colors shadow-sm ${
                    isPlain
                      ? 'bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  {tier.cta}
                </Link>
                <p className={`mt-3 text-center text-xs sm:text-sm ${'text-neutral-500'}`}>
                  Free 20-minute call, no obligation.{' '}
                  <a href="tel:+15154938017" className="font-semibold underline underline-offset-2">
                    Or call (515) 493-8017
                  </a>
                </p>
              </motion.div>
            );
          })}

          <FreeConsultationCard />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-20 sm:mt-24"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-950 mb-8 text-center">
            Add More Ways to Win Customers
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {addOns.map((addOn, idx) => (
              <motion.div
                key={addOn.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                whileHover={{ y: -3 }}
                className="p-6 sm:p-7 rounded-2xl border border-neutral-200 bg-white text-center shadow-xs"
              >
                <div className="text-base sm:text-lg text-neutral-700 font-medium mb-2 leading-snug">{addOn.name}</div>
                <div className="text-xl sm:text-2xl font-black text-blue-600">{addOn.price}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-24 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-950 mb-10 text-center">
            Common Questions About Pricing
          </h3>
          <div className="space-y-4">
            {pricingFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: idx * 0.06 }}
                  className="rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-colors hover:border-neutral-300 shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`pricing-faq-${idx}`}
                    className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors"
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
                        <p className="px-6 sm:px-7 pb-6 sm:pb-7 text-base sm:text-lg text-neutral-600 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Third card beside the two plans. A free call alone is table stakes, so
 * booking one comes with two things prepared for that business before the
 * call: a custom homepage mockup and an AI visibility report. The call is
 * where we walk them through both. Also covers custom scopes neither plan
 * fits (this replaced the old "Need Something Different?" box).
 * Spans the full row at lg (two columns) and sits third at xl.
 */
function FreeConsultationCard() {
  const bonuses = [
    {
      icon: LayoutTemplate,
      title: 'Your new homepage, designed for you',
      body: 'A custom mockup of your homepage with your business, your services, and your brand. See your new site before you spend a dollar.',
    },
    {
      icon: Sparkles,
      title: 'Your AI visibility report',
      body: 'Where you show up on Google, ChatGPT, and Perplexity for the searches that matter, and who gets recommended instead of you.',
    },
  ];
  const points = [
    'One-on-one call with our team, not a sales script',
    'A straight recommendation on which plan fits, or a custom scope if neither does',
    'Both are yours to keep, whether or not you hire us',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="relative rounded-[32px] p-8 sm:p-10 lg:p-12 xl:p-10 2xl:p-12 flex flex-col lg:col-span-2 xl:col-span-1 bg-gradient-to-b from-blue-50 to-white text-neutral-950 border-2 border-blue-200 shadow-xl shadow-blue-600/10"
    >
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap bg-blue-600 text-white">
        100% Free
      </span>

      <h3 className="text-2xl sm:text-3xl font-bold mb-1.5">Free Consultation</h3>
      <p className="text-sm sm:text-base font-semibold mb-4 uppercase tracking-wide text-blue-700">
        Book a call. Get your new homepage.
      </p>
      <p className="text-sm sm:text-base leading-relaxed mb-5 rounded-xl px-4 py-3 bg-blue-100/70 text-blue-950">
        Right for you if you want to see exactly what you&apos;d get before spending a
        dollar, or if neither plan quite fits.
      </p>
      <p className="text-base sm:text-lg mb-6 leading-relaxed text-neutral-500">No cost, no obligation</p>
      <div className="text-4xl sm:text-6xl font-black mb-3 tracking-tight whitespace-nowrap">$0</div>
      <p className="text-base sm:text-lg mb-8 text-neutral-600">Prepared for your business</p>

      <p className="text-sm sm:text-base font-bold uppercase tracking-wide mb-4 text-neutral-500">
        Every consultation includes:
      </p>
      <div className="space-y-3 mb-6">
        {bonuses.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-3.5 rounded-2xl p-4 sm:p-5 -mx-1 bg-white border border-blue-200 shadow-sm"
          >
            <Icon size={22} className="shrink-0 mt-0.5 text-blue-600" />
            <div>
              <div className="font-bold text-base sm:text-lg leading-snug">{title}</div>
              <p className="mt-1 text-sm sm:text-base text-neutral-600 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {points.map((point) => (
          <li key={point} className="flex gap-3.5 text-base sm:text-lg leading-relaxed">
            <MessagesSquare size={20} className="shrink-0 mt-1 text-blue-600" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/book"
        data-track="cta_click"
        data-track-cta="free_consultation_card"
        className="text-center py-4 sm:py-4.5 rounded-full font-bold text-base sm:text-lg transition-colors shadow-sm bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
      >
        Book My Free Consultation
      </Link>
      <p className="mt-3 text-center text-xs sm:text-sm text-neutral-500">
        Free 20-minute call, no obligation.{' '}
        <a href="tel:+15154938017" className="font-semibold underline underline-offset-2">
          Or call (515) 493-8017
        </a>
      </p>
    </motion.div>
  );
}
