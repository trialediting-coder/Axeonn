'use client';

import { motion } from 'motion/react';
import { Globe, FileQuestion, Database, LineChart, Zap, Mail, ArrowRight, X, Check } from 'lucide-react';
import { BorderBeam } from './BorderBeam';

function FlowCard({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Globe;
  label: string;
  tone: 'neutral' | 'blue' | 'dim';
}) {
  const toneClasses = {
    neutral: 'bg-white border-neutral-200 text-neutral-700',
    blue: 'bg-blue-50 border-blue-300 text-blue-700',
    dim: 'bg-neutral-50 border-dashed border-neutral-300 text-neutral-400',
  }[tone];

  return (
    <div className={`flex flex-col items-center gap-2 w-24 sm:w-28 shrink-0 ${tone === 'dim' ? 'opacity-70' : ''}`}>
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 shadow-sm ${toneClasses}`}>
        <Icon size={24} />
      </div>
      <span className="text-[11px] sm:text-xs font-semibold text-neutral-600 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function DataInfraComparison() {
  return (
    <section id="data-infra" className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-4 sm:right-10 text-[140px] sm:text-[220px] font-black text-neutral-100 leading-none select-none pointer-events-none"
      >
        03
      </span>
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="text-xs font-mono font-semibold tracking-widest text-blue-600 uppercase mb-4">
            03 — Data &amp; Infrastructure
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.05]">
            Most Agencies Treat Data As An Afterthought.
          </h2>
        </motion.div>

        <div className="space-y-6">
          {/* Typical Agency row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 sm:p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <X size={16} className="text-neutral-400" />
              <span className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
                Typical Agency
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 sm:gap-4 overflow-x-auto pb-1">
              <FlowCard icon={Globe} label="Website" tone="neutral" />
              <ArrowRight size={20} className="text-neutral-300 shrink-0" />
              <FlowCard icon={FileQuestion} label="Contact Form" tone="dim" />
            </div>
            <p className="mt-6 text-sm text-neutral-500 leading-relaxed text-center">
              A form that emails someone. Nothing structured, nothing connected, nothing to
              learn from later.
            </p>
          </motion.div>

          {/* Axeon row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <BorderBeam rounded="rounded-3xl">
              <div className="rounded-3xl bg-blue-50/50 p-5 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Check size={16} className="text-blue-600" />
                <span className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase">
                  Axeon Studio — Included In Every Build
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                <FlowCard icon={Globe} label="Website" tone="neutral" />
                <ArrowRight size={20} className="text-blue-300 shrink-0" />
                <FlowCard icon={Database} label="Data Layer" tone="blue" />
                <ArrowRight size={20} className="text-blue-300 shrink-0 hidden sm:block" />
                <div className="flex gap-2 sm:gap-3">
                  <FlowCard icon={LineChart} label="Reporting" tone="blue" />
                  <FlowCard icon={Zap} label="Automation" tone="blue" />
                  <FlowCard icon={Mail} label="CRM Pipeline" tone="blue" />
                </div>
              </div>
              <p className="mt-6 text-sm text-neutral-600 leading-relaxed text-center">
                Every build ships with a real data layer feeding reporting, automation, and your
                CRM Pipeline — by default, not as an upsell.
              </p>
              </div>
            </BorderBeam>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
