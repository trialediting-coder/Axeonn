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
      {/* Purpose: the page's thesis: a website alone is not intake; Axeon runs the reply, booking and review. */}
      <section className="w-full pt-6 sm:pt-28 pb-2 sm:pb-8 px-6 sm:px-10 lg:px-16 xl:px-24 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow mb-4"
          >
            WHY AXEON
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[34px] sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08] mb-4 sm:mb-6"
          >
            A website is not intake.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-600 leading-relaxed"
          >
            Agencies hand over a website. We run the reply, the booking and the review.
          </motion.p>
        </div>
      </section>

      <GetFoundComparison />

      <VersusSection
        id="get-chosen"
        eyebrow="02 · GET CHOSEN"
        layout="giant"
        tone="warm"
        heading="New patients and clients compare reviews before they call."
        stat={{
          value: '97%',
          label: 'of people read reviews before choosing a local business.',
          source: 'BrightLocal Local Consumer Review Survey',
          href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
        }}
        typical={[
          'Reviews depend on patients and clients remembering to leave one.',
          'Stock photos and bios that could be any practice or firm.',
        ]}
        axeon={[
          'An automatic review request after every completed appointment or engagement.',
          'Your dentists, providers, attorneys or CPAs, their credentials and real reviews up front.',
          'Your Google Business Profile kept current.',
        ]}
      />

      <VersusSection
        id="get-booked"
        eyebrow="03 · GET BOOKED"
        heading="Every missed call is a new patient or client calling someone else."
        stat={{
          value: '21×',
          label: 'more likely to qualify when a lead hears back within 5 minutes instead of 30.',
          source: 'MIT / InsideSales lead response study',
          href: 'https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf',
        }}
        typical={[
          'After-hours calls go to voicemail.',
          'A contact form that lands in a shared inbox until tomorrow.',
        ]}
        axeon={[
          'Every missed call and web inquiry answered within 60 seconds, 24/7.',
          'Online consultation booking and a two-way text inbox for the front desk or intake team.',
          'AxeonPROOF shows every recovered inquiry and booking, with a monthly report.',
        ]}
      />

      <GuaranteeBand />

      <WhyAxeonClosingCTA />
    </main>
  );
}
