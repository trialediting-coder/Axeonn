'use client';

import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  typical: string;
  axeon: string;
}

const ROWS: ComparisonRow[] = [
  {
    dimension: 'Pricing',
    typical: '$5K–$30K+ for a comparable build, plus a separate CRM subscription',
    axeon: '$2,800 or $5,800 flat — CRM Pipeline and on-site video included in the Engine, no per-seat software',
  },
  {
    dimension: 'Timeline',
    typical: 'Weeks to months, scope often expands along the way',
    axeon: 'Fixed scope and a fast turnaround — live in a fraction of the usual time, no surprise invoices',
  },
  {
    dimension: 'AI & Automation',
    typical: 'One generic AI tool, deployed the same way for every client',
    axeon: 'A CRM Pipeline built around your actual lead-to-close workflow',
  },
  {
    dimension: 'Communication',
    typical: 'Account managers and handoffs before you reach the builder',
    axeon: 'Direct access to the person building your system',
  },
  {
    dimension: 'After Launch',
    typical: 'Hourly billing for small changes, slower turnaround',
    axeon: 'A direct line to the person who built your system — no hourly billing',
  },
];

// minmax(0, …) pins every column to the same share of the width; a bare `fr`
// track's minimum is its content, which is what let each row's columns drift.
const GRID_COLS = 'sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,1.3fr)]';

export function Comparison() {
  return (
    <section id="comparison" className="w-full py-20 sm:py-36 lg:py-44 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-8 sm:mb-12"
        >
          <div className="text-sm sm:text-base font-mono font-bold tracking-widest text-blue-600 uppercase mb-4 sm:mb-5">
            Your Business. Your Partner.
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-neutral-950 mb-6 leading-[1.12]">
            What Actually Makes Us Different
          </h2>
          <p className="text-lg sm:text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
            Most agencies and most AI tools run every client through the same generic process.
            We don&apos;t. Here&apos;s the honest comparison.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10 sm:mt-16 rounded-[28px] sm:rounded-[40px] border border-neutral-200 overflow-hidden bg-white shadow-md"
        >
          {/* ── Phone: one card per dimension, two equal columns underneath ── */}
          <div className="sm:hidden divide-y divide-neutral-100">
            {ROWS.map((row) => (
              <div key={row.dimension} className="p-4">
                <div className="text-base font-bold text-neutral-950 mb-3">{row.dimension}</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                      Typical Agency
                    </div>
                    <div className="flex items-start gap-1.5">
                      <X className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-[3px]" />
                      <span className="text-[13px] leading-relaxed text-neutral-600">{row.typical}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">
                      Axeon Studio
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-[3px]" />
                      <span className="text-[13px] leading-relaxed text-neutral-900 font-medium">{row.axeon}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tablet & desktop: classic three-column table ── */}
          <div className="hidden sm:block">
            <div className={`grid ${GRID_COLS} bg-neutral-50 border-b border-neutral-200 text-base lg:text-lg font-bold uppercase tracking-wider`}>
              <div className="p-7 lg:p-8 text-neutral-500">&nbsp;</div>
              <div className="p-7 lg:p-8 text-neutral-500">Typical Agency</div>
              <div className="p-7 lg:p-8 text-blue-600 bg-blue-50/80">Axeon Studio</div>
            </div>
            {ROWS.map((row, idx) => (
              <div
                key={row.dimension}
                className={`grid ${GRID_COLS} text-base lg:text-lg ${
                  idx !== ROWS.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <div className="p-7 lg:p-8 font-bold text-neutral-950 text-xl lg:text-2xl">
                  {row.dimension}
                </div>
                <div className="p-7 lg:p-8 text-neutral-600 leading-relaxed flex items-start gap-3.5">
                  <X size={20} className="w-5 h-5 text-neutral-400 shrink-0 mt-1" />
                  <span className="leading-relaxed">{row.typical}</span>
                </div>
                <div className="p-7 lg:p-8 text-neutral-900 font-medium leading-relaxed flex items-start gap-3.5 bg-blue-50/40">
                  <Check size={20} className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                  <span className="leading-relaxed">{row.axeon}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-5 text-sm sm:text-base text-neutral-400 text-center">
          Typical-agency pricing reflects general 2026 market data for a comparable custom website and CRM
          build, not a specific competitor&apos;s quote.
        </p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 sm:mt-14 text-base sm:text-xl text-neutral-600 text-center max-w-4xl mx-auto leading-relaxed"
        >
          On the AI point specifically: many &ldquo;AI-powered&rdquo; tools apply the same generic setup to
          every client. We build a system tailored to how your business actually captures and closes
          leads, with a person checking the work — not a one-size-fits-all tool with your logo on it.
        </motion.p>
      </div>
    </section>
  );
}
