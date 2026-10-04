'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { WebsiteGallery } from './WebsiteGallery';
import { VersusRows } from './VersusSection';

const TYPICAL_IMAGES = [
  { src: '/why-axeon/competitor-hvac.webp', industry: 'HVAC', label: 'Typical agency', url: 'example-hvac-co.com' },
  { src: '/why-axeon/competitor-ai-saas.webp', industry: 'AI SaaS', label: 'Typical agency', url: 'example-ai-saas.com' },
  { src: '/why-axeon/competitor-it.webp', industry: 'IT Services', label: 'Typical agency', url: 'example-it-services.com' },
  { src: '/why-axeon/competitor-realestate.webp', industry: 'Real Estate', label: 'Typical agency', url: 'example-realty.com' },
];

const AXEON_IMAGES = [
  { src: '/why-axeon/axeon-ecommerce.webp', industry: 'E-Commerce', label: 'Concept build', url: 'yourbrand.com' },
  { src: '/why-axeon/axeon-hvac.webp', industry: 'HVAC & Plumbing', label: 'Concept build', url: 'yourservicecompany.com' },
  { src: '/why-axeon/axeon-auto-repair.webp', industry: 'Auto Repair', label: 'Concept build', url: 'yourshop.com' },
  { src: '/why-axeon/axeon-realestate.webp', industry: 'Real Estate', label: 'Concept build', url: 'yourcompany.com' },
];

export default function GetFoundComparison() {
  return (
    <section id="get-found" className="w-full py-20 sm:py-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-10"
        >
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ 01 · GET FOUND ]
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08]">
            Templates don&apos;t get found. Sites built to rank do.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-start mb-10">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-3">
              Typical agency
            </div>
            <WebsiteGallery images={TYPICAL_IMAGES} variant="typical" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">
              Axeon concept builds
            </div>
            <WebsiteGallery images={AXEON_IMAGES} variant="axeon" />
          </div>
        </div>

        <VersusRows
          typical={[
            'One layout for every industry. Swap the logo, ship it.',
            'SEO treated as a separate project, if it happens at all.',
          ]}
          axeon={[
            'Designed around how your business actually sells.',
            'SEO, AEO and GEO set up on every site.',
          ]}
        />

        <Link
          href="/insights/a-1-auto-detailing-website-case-study"
          className="group mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8 hover:border-blue-300 transition-colors"
        >
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-2">
              [ PROOF ]
            </div>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-display">
              A-1 Auto Detailing: page 2 to #1 for &ldquo;Pleasant Hill auto detailing.&rdquo;
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 shrink-0">
            Read the case study
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>
    </section>
  );
}
