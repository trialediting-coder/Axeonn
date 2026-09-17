'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight, Check } from 'lucide-react';

const CATEGORIES = [
  'Web Design — bespoke, brand-driven layouts vs. a reskinned template',
  'AI Receptionist — listen to a real call, side by side',
  'Data & Infrastructure — a real data layer, included by default',
  'Reviews & Reputation — ongoing generation and management, not a one-time funnel',
  'Social Media — content and posting handled for you, included in the retainer',
  'Automation — one unified stack instead of a dozen subscriptions',
];

export function WhyAxeonTeaser() {
  return (
    <section className="w-full py-24 sm:py-36 lg:py-44 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl lg:max-w-6xl mx-auto text-center"
      >
        <div className="text-sm sm:text-base font-mono font-bold tracking-widest text-blue-400 uppercase mb-5">
          Your Business. Your Partner.
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight font-display mb-10 leading-[1.12]">
          We Don&apos;t Just Tell You We&apos;re Better. We Show You.
        </h2>

        <Link
          href="/why-axeon#seo-aeo-geo"
          className="group inline-flex flex-wrap items-center justify-center gap-3 sm:gap-3.5 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl bg-blue-950/60 border border-blue-800 hover:border-blue-600 transition-colors mb-6 shadow-xl shadow-blue-950/40"
        >
          <span className="px-3.5 py-1.5 rounded-full bg-blue-800 text-blue-200 text-xs sm:text-sm font-bold">SEO</span>
          <span className="px-3.5 py-1.5 rounded-full bg-blue-800 text-blue-200 text-xs sm:text-sm font-bold">AEO</span>
          <span className="px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(59,130,246,0.7)]">
            GEO
          </span>
          <span className="text-base sm:text-lg text-blue-200 font-medium group-hover:text-white transition-colors">
            Search, AI answer engines, and generative engines — all included by default
          </span>
        </Link>

        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5 text-left max-w-4xl mx-auto mb-14 mt-8">
          {CATEGORIES.map((line) => (
            <div key={line} className="flex items-start gap-3.5 text-base sm:text-lg text-neutral-200 leading-relaxed">
              <Check size={20} className="text-blue-400 shrink-0 mt-1" />
              <span>{line}</span>
            </div>
          ))}
        </div>

        <Link
          href="/why-axeon"
          className="group inline-flex items-center gap-3 px-9 py-4.5 sm:px-10 sm:py-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-bold shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
        >
          <span>See The Full Comparison</span>
          <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Link>
      </motion.div>
    </section>
  );
}
