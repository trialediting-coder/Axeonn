'use client';

import { motion } from 'motion/react';
import { BorderBeam } from './BorderBeam';
import { RankClimbChart } from './RankClimbChart';
import { AiPromptDemo } from './AiPromptDemo';
import { AiEngineMarquee } from './AiEngineMarquee';

const seoAeoGeoServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Search Engine Optimization, Answer Engine Optimization, and Generative Engine Optimization',
  name: 'SEO, AEO & GEO Services — Axeon Studio',
  description:
    'Search Engine Optimization (SEO), Answer Engine Optimization (AEO), and Generative Engine Optimization (GEO) included by default in every Axeon Studio web build — structured data, machine-readable content, and technical optimization for traditional search engines and AI answer engines like ChatGPT, Perplexity, Claude, and Gemini.',
  provider: {
    '@type': 'Organization',
    name: 'Axeon Studio',
    logo: 'https://axeonstudio.co/icon.png',
    telephone: '+1-515-493-8017',
    email: 'hayder.hatem@axeonstudio.co',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'West Des Moines',
      addressRegion: 'IA',
      postalCode: '50266',
      addressCountry: 'US',
    },
  },
  areaServed: 'United States',
};

export default function SeoAeoGeoComparison() {
  return (
    <section id="seo-aeo-geo" className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoAeoGeoServiceJsonLd) }}
      />
      <span
        aria-hidden="true"
        className="absolute -top-6 left-4 sm:left-10 text-[140px] sm:text-[220px] font-black text-white/5 leading-none select-none pointer-events-none"
      >
        04
      </span>
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-6"
        >
          <div className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
            04 — SEO / AEO / GEO
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.05]">
            We Don&apos;t Just Optimize For Google.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-14"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-blue-950/60 border border-blue-800">
            {['SEO', 'AEO', 'GEO'].map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                {tag}
              </span>
            ))}
            <span className="text-xs text-blue-300 font-medium ml-1">
              All included in every build — zero add-ons
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm text-neutral-400 leading-relaxed text-center max-w-xl mx-auto mb-14"
        >
          Search Engine Optimization (SEO), Answer Engine Optimization (AEO), and Generative
          Engine Optimization (GEO) — the three ways people and AI actually find a business
          today, all handled as one service, not sold separately.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto mb-6"
        >
          <BorderBeam rounded="rounded-3xl">
            <div className="rounded-3xl bg-neutral-900/60 p-6 sm:p-8">
              <RankClimbChart />
            </div>
          </BorderBeam>
        </motion.div>

        <p className="text-sm text-neutral-500 leading-relaxed text-center max-w-xl mx-auto mb-16">
          Most agencies get you a small bump and stop there. We build every site to compete for
          the top spot — search rankings take real time and vary by market, so we won&apos;t
          promise a date, but this is the trajectory every build is optimized for.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-center text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-3">
            Optimized For Every Major AI Answer Engine
          </p>
          <AiEngineMarquee />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center"
        >
          <AiPromptDemo />
        </motion.div>
        <p className="text-sm text-neutral-500 leading-relaxed text-center max-w-xl mx-auto mt-6">
          Structured data and machine-readable content on every page, so search engines,
          ChatGPT, Perplexity, and Gemini can all actually cite you.
        </p>
      </div>
    </section>
  );
}
