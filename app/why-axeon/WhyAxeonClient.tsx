'use client';

import { motion } from 'motion/react';
import GetFoundComparison from '@/components/why-axeon/GetFoundComparison';
import { VersusSection } from '@/components/why-axeon/VersusSection';
import { GuaranteeBand } from '@/components/why-axeon/GuaranteeBand';
import WhyAxeonClosingCTA from '@/components/why-axeon/WhyAxeonClosingCTA';
import { WhyAxeonSectionNav } from '@/components/why-axeon/WhyAxeonSectionNav';

export default function WhyAxeonClient() {
  return (
    <main className="pt-24">
      <WhyAxeonSectionNav />
      <section className="w-full pt-20 sm:pt-28 pb-8 px-6 sm:px-10 lg:px-16 xl:px-24 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4"
          >
            [ WHY AXEON ]
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08] mb-6"
          >
            Same budget. More customers.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-neutral-600 leading-relaxed"
          >
            Typical agency vs. Axeon on the three things that bring you customers: getting
            found, getting chosen and getting booked.
          </motion.p>
        </div>
      </section>

      <GetFoundComparison />

      <VersusSection
        id="get-chosen"
        eyebrow="02 · GET CHOSEN"
        layout="giant"
        tone="warm"
        heading="Found is half the job. They pick the business they trust."
        stat={{
          value: '97%',
          label: 'of people read reviews before choosing a local business.',
          source: 'BrightLocal Local Consumer Review Survey',
          href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
        }}
        typical={[
          'Your reviews stay on Google, nowhere near the page people decide on.',
          'Stock photos and copy that could be anyone.',
        ]}
        axeon={[
          'Your real rating and reviews right where people decide.',
          'Your own work, prices and proof up front.',
          'Your Google Business Profile kept up every month.',
        ]}
      />

      <VersusSection
        id="get-booked"
        eyebrow="03 · GET BOOKED"
        heading="Every missed call is a customer calling someone else."
        stat={{
          value: '62%',
          label: 'of calls to small businesses go unanswered.',
          source: '411 Locals call study',
          href: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
        }}
        typical={[
          'A contact form that lands in an inbox nobody checks.',
          'No follow-up, so warm leads go cold.',
        ]}
        axeon={[
          'Tap-to-call and quote forms built to book the job.',
          'With AxeonCORE: your website, lead list and follow-up working as one system.',
          'A monthly calls & leads report, so you see what is working.',
        ]}
      />

      <GuaranteeBand />

      <WhyAxeonClosingCTA />
    </main>
  );
}
