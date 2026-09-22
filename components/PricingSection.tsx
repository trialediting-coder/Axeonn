'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, ChevronDown, ChevronUp, Clapperboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pricingTiers, addOns, pricingFaqs, revisionGuarantee } from '@/data/pricingData';

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
}

export function PricingSection({ includeFaqSchema = false }: PricingSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section id="pricing" className="w-full py-24 sm:py-36 lg:py-44 px-6 sm:px-10 lg:px-16 xl:px-24">
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
          className="text-center max-w-4xl mx-auto mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-neutral-950 mb-6 leading-[1.12]">
            Two Flat-Rate Builds. Pick the One That Fits.
          </h2>
          <p className="text-xl sm:text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
            No 3-week proposals, no hourly billing. One price, a fast turnaround,
            and a site you own outright.
          </p>
          <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 text-base font-semibold text-blue-700">
            <ShieldCheck size={18} className="shrink-0" />
            <span>{revisionGuarantee}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch max-w-6xl 2xl:max-w-7xl mx-auto">
          {pricingTiers.map((tier, idx) => {
            const isDark = !tier.featured;
            const highlights = new Set(tier.highlightFeatures ?? []);
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className={`relative rounded-[32px] p-8 sm:p-10 lg:p-12 flex flex-col ${
                  isDark
                    ? 'bg-neutral-950 text-white border border-neutral-800 shadow-2xl'
                    : 'bg-white text-neutral-950 border-2 border-blue-600 shadow-xl shadow-blue-600/10'
                }`}
              >
                {tier.badge && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase shadow-md whitespace-nowrap ${
                      isDark ? 'bg-white text-neutral-950' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {tier.badge}
                  </motion.span>
                )}

                <h3 className="text-2xl sm:text-3xl font-bold mb-1.5">{tier.name}</h3>
                <p
                  className={`text-sm sm:text-base font-semibold mb-4 uppercase tracking-wide ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {tier.focus}
                </p>
                <p
                  className={`text-base sm:text-lg mb-6 leading-relaxed ${
                    isDark ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {tier.billingNote}
                </p>
                <div className="text-4xl sm:text-6xl font-black mb-3 tracking-tight whitespace-nowrap">{tier.price}</div>
                <p className={`text-base sm:text-lg mb-8 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  {tier.turnaround}
                </p>

                {tier.inherits && (
                  <p
                    className={`text-sm sm:text-base font-bold uppercase tracking-wide mb-4 ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
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
                          className={`flex gap-3.5 text-base sm:text-lg leading-relaxed rounded-2xl p-4 sm:p-5 -mx-1 ${
                            isDark
                              ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                              : 'bg-blue-50 border border-blue-100'
                          }`}
                        >
                          <Clapperboard size={22} className="shrink-0 mt-0.5 text-blue-400" />
                          <span className="font-semibold">{feature}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={feature} className="flex gap-3.5 text-base sm:text-lg leading-relaxed">
                        <Check size={20} className={`shrink-0 mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span>{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                {tier.stepUp && (
                  <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-700">
                    <div className="text-xs sm:text-sm font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                      {tier.stepUp.heading}
                    </div>
                    <ul className="space-y-2 text-sm sm:text-base text-neutral-300">
                      {tier.stepUp.items.map((item) => (
                        <li key={item.label} className="flex justify-between gap-3">
                          <span>{item.label}</span>
                          {item.note && <span className="text-neutral-500 shrink-0 text-right">{item.note}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 pt-3.5 border-t border-neutral-700 text-sm sm:text-base font-semibold text-blue-400">
                      {tier.stepUp.footer}
                    </p>
                  </div>
                )}

                <Link
                  href="/book"
                  className={`text-center py-4 sm:py-4.5 rounded-full font-bold text-base sm:text-lg transition-colors shadow-sm ${
                    isDark
                      ? 'bg-white hover:bg-neutral-200 text-neutral-950'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-14 rounded-[32px] border border-dashed border-neutral-300 bg-neutral-50 p-10 sm:p-14 text-center"
        >
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 mb-3">
            Need Something Different?
          </h3>
          <p className="text-base sm:text-lg lg:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Every business is a little different. If neither build quite fits — a
            bigger scope, a narrower one, or something these packages don&apos;t cover at
            all — tell us what you actually need and we&apos;ll scope it directly with you.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center justify-center px-9 py-4.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-base sm:text-lg transition-colors shadow-md"
          >
            Talk to Us About Custom Work
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-20 sm:mt-24"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-950 mb-8 text-center">
            Add-Ons &amp; Enhancements
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
