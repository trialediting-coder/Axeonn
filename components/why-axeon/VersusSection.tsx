'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

export interface VersusStat {
  value: string;
  label: string;
  source: string;
  href: string;
}

export function VersusRows({ typical, axeon }: { typical: string[]; axeon: string[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
        <div className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase mb-5">
          Typical agency
        </div>
        <ul className="space-y-4">
          {typical.map((item) => (
            <li key={item} className="flex gap-3 text-neutral-600 leading-relaxed">
              <X size={18} className="mt-1 shrink-0 text-neutral-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl bg-neutral-950 text-white p-6 sm:p-8">
        <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-5">
          Axeon
        </div>
        <ul className="space-y-4">
          {axeon.map((item) => (
            <li key={item} className="flex gap-3 text-neutral-200 leading-relaxed">
              <Check size={18} className="mt-1 shrink-0 text-blue-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function VersusSection({
  id,
  eyebrow,
  heading,
  stat,
  typical,
  axeon,
  children,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  stat?: VersusStat;
  typical: string[];
  axeon: string[];
  children?: ReactNode;
}) {
  return (
    <section id={id} className="w-full py-20 sm:py-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-10"
        >
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ {eyebrow} ]
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.08]">
            {heading}
          </h2>
        </motion.div>

        {stat && (
          <a
            href={stat.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-8 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-5"
          >
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-blue-600 font-display">
              {stat.value}
            </span>
            <span className="text-lg text-neutral-800 font-semibold">
              {stat.label}
              <span className="block text-xs font-mono font-normal text-neutral-500 mt-1 group-hover:text-blue-600 transition-colors">
                Source: {stat.source} ↗
              </span>
            </span>
          </a>
        )}

        <VersusRows typical={typical} axeon={axeon} />
        {children}
      </div>
    </section>
  );
}
