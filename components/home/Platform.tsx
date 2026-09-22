'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLeadModal } from '@/components/common/LeadModalProvider';

export interface PlatformProps {
  onBookCall?: () => void;
}

export function Platform({ onBookCall }: PlatformProps) {
  const { open: openLeadModal } = useLeadModal();
  return (
    <section
      id="platform"
      className="w-full py-24 sm:py-36 lg:py-44 px-6 sm:px-10 lg:px-16 xl:px-24 relative"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 sm:gap-20 lg:gap-24 xl:gap-32 items-start">
          {/* Left Column: Headline, Summary & CTA (Scaled 1.5x) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-5 flex flex-col justify-start"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.12] mb-8 sm:mb-10">
              You need a <span className="text-blue-600">Partner</span>.
              <span className="block mt-2 sm:mt-3">Not an agency.</span>
            </h2>

            <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 leading-relaxed font-normal mb-10 sm:mb-12 max-w-xl">
              We are a lean digital team based right here in Iowa. We build websites that turn visitors into paying customers and set up automated follow-ups so you never lose a lead to slow response times.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <button
                type="button"
                id="platform-book-cta"
                onClick={() => (onBookCall ? onBookCall() : openLeadModal('platform'))}
                className="inline-flex items-center justify-center gap-3 px-9 py-4.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-base sm:text-lg tracking-tight transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
              >
                <span>Book a Free Strategy Call</span>
                <ArrowRight size={20} className="text-blue-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
              </button>
              <Link
                id="who-we-are-cta-btn"
                href="/about"
                className="inline-flex items-center gap-1.5 text-base sm:text-lg font-semibold text-neutral-700 hover:text-blue-600 transition-colors"
              >
                Get to know us <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Clean Value Blocks (Scaled 1.5x) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-7 flex flex-col space-y-12 sm:space-y-16 pt-2 lg:pt-3"
          >
            {/* Block 1 */}
            <div className="space-y-4 sm:space-y-5 pb-12 sm:pb-14 border-b border-neutral-200/80">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 font-display tracking-tight">
                Direct execution, zero middlemen
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 leading-relaxed max-w-2xl font-normal">
                No account managers, no layers of bureaucracy, and no outsourcing to random contractors. You talk directly with the people building your platform. When you need something adjusted, the person who answers is the person opening the code.
              </p>
            </div>

            {/* Block 2 */}
            <div className="space-y-4 sm:space-y-5 pb-12 sm:pb-14 border-b border-neutral-200/80">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 font-display tracking-tight">
                Practical automations that save real time
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 leading-relaxed max-w-2xl font-normal">
                We skip the buzzwords and gimmicky chatbots. Instead, we connect smart follow-up tools directly to your CRM so new inquiries get a clear, helpful response in under sixty seconds. It keeps your pipeline warm and saves your staff hours of manual data entry.
              </p>
            </div>

            {/* Block 3 */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 font-display tracking-tight">
                Built around how your business makes money
              </h3>
              <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 leading-relaxed max-w-2xl font-normal">
                Whether you run a local trade company or a growing regional brand, you are never just a ticket number. We take time to understand how you actually close sales, then design and engineer everything around that exact outcome.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
