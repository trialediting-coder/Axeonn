'use client';

import { motion } from 'motion/react';
import WebDesignComparison from '@/components/why-axeon/WebDesignComparison';
import AIAgentComparison from '@/components/why-axeon/AIAgentComparison';
import DataInfraComparison from '@/components/why-axeon/DataInfraComparison';
import SeoAeoGeoComparison from '@/components/why-axeon/SeoAeoGeoComparison';
import AutomationComparison from '@/components/why-axeon/AutomationComparison';
import WhyAxeonClosingCTA from '@/components/why-axeon/WhyAxeonClosingCTA';
import { WhyAxeonSectionNav } from '@/components/why-axeon/WhyAxeonSectionNav';

export default function WhyAxeonClient() {
  return (
    <main className="pt-24">
      <WhyAxeonSectionNav />
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs sm:text-sm font-mono font-semibold tracking-widest text-blue-600 uppercase mb-4"
          >
            Your Business. Your Partner.
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08] mb-6"
          >
            See The Difference, Not Just The Price
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-neutral-600 leading-relaxed"
          >
            Five categories, side by side: web design, AI receptionist, data infrastructure, search
            visibility, and automation. Here&apos;s what a typical agency ships, and what we
            actually build.
          </motion.p>
        </div>
      </section>

      <WebDesignComparison />
      <AIAgentComparison />
      <DataInfraComparison />
      <SeoAeoGeoComparison />
      <AutomationComparison />
      <WhyAxeonClosingCTA />
    </main>
  );
}
