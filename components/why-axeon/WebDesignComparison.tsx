'use client';

import { motion } from 'motion/react';
import { WebsiteGallery } from './WebsiteGallery';

const TYPICAL_IMAGES = [
  { src: '/why-axeon/competitor-hvac.webp', industry: 'HVAC', label: 'Generic template', url: 'example-hvac-co.com' },
  { src: '/why-axeon/competitor-ai-saas.webp', industry: 'AI SaaS', label: 'Generic template', url: 'example-ai-saas.com' },
  { src: '/why-axeon/competitor-it.webp', industry: 'IT Services', label: 'Generic template', url: 'example-it-services.com' },
  { src: '/why-axeon/competitor-realestate.webp', industry: 'Real Estate', label: 'Generic template', url: 'example-realty.com' },
];

const AXEON_IMAGES = [
  { src: '/why-axeon/axeon-ecommerce.webp', industry: 'E-Commerce', label: 'Concept build', url: 'yourbrand.com' },
  { src: '/why-axeon/axeon-hvac.webp', industry: 'HVAC & Plumbing', label: 'Concept build', url: 'yourservicecompany.com' },
  { src: '/why-axeon/axeon-auto-repair.webp', industry: 'Auto Repair', label: 'Concept build', url: 'yourshop.com' },
  { src: '/why-axeon/axeon-realestate.webp', industry: 'Real Estate', label: 'Concept build', url: 'yourcompany.com' },
];

export default function WebDesignComparison() {
  return (
    <section id="web-design" className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-4 sm:right-10 text-[140px] sm:text-[220px] font-black text-neutral-100 leading-none select-none pointer-events-none"
      >
        01
      </span>
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="text-xs font-mono font-semibold tracking-widest text-blue-600 uppercase mb-4">
            01 — Web Design
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.05]">
            Most Agencies Ship Templates.
            <br />
            We Ship Systems.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase mb-3">
              Typical Agency — Real Examples
            </div>
            <WebsiteGallery images={TYPICAL_IMAGES} variant="typical" />
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
              Four different industries, one interchangeable layout. Swap the logo and the
              copy — nothing else changes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase mb-3">
              Axeon Studio — Concept Builds
            </div>
            <WebsiteGallery images={AXEON_IMAGES} variant="axeon" />
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
              Four different industries, four genuinely different layouts — concept builds
              showing how we'd design around how that specific business actually sells.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
