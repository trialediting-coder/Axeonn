'use client';

import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import {
  SiGooglecalendar,
  SiGmail,
  SiMailchimp,
  SiStripe,
  SiHubspot,
  SiNotion,
  SiCalendly,
  SiZoom,
  SiAsana,
  SiDropbox,
  SiTrello,
  SiQuickbooks,
} from 'react-icons/si';
import { BorderBeam } from './BorderBeam';

const APPS: { Icon: ComponentType<{ size?: number; color?: string }>; color: string }[] = [
  { Icon: SiGooglecalendar, color: '#4285F4' },
  { Icon: SiGmail, color: '#EA4335' },
  { Icon: SiMailchimp, color: '#FFE01B' },
  { Icon: SiStripe, color: '#635BFF' },
  { Icon: SiHubspot, color: '#FF7A59' },
  { Icon: SiNotion, color: '#000000' },
  { Icon: SiCalendly, color: '#006BFF' },
  { Icon: SiZoom, color: '#2D8CFF' },
  { Icon: SiAsana, color: '#F06A6A' },
  { Icon: SiDropbox, color: '#0061FF' },
  { Icon: SiTrello, color: '#0052CC' },
  { Icon: SiQuickbooks, color: '#2CA01C' },
];

// Loose, scattered positions (as % of a 400x260 box) for the chaotic cluster.
const CHAOTIC_POSITIONS: [number, number][] = [
  [12, 20], [30, 12], [50, 8], [70, 15], [88, 22], [92, 45],
  [80, 68], [60, 82], [40, 88], [20, 78], [8, 55], [45, 45],
];

// Icons that get a "ping" notification badge — a constant-interruption detail.
const PINGING_INDICES = new Set([1, 3, 8]);

// Tangled connector pairs (indices into APPS/CHAOTIC_POSITIONS) — deliberately crossing.
const TANGLED_LINES: [number, number][] = [
  [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [0, 5], [2, 11], [6, 1], [8, 3],
];

function circlePosition(index: number, total: number, radius: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)] as [number, number];
}

export default function AutomationComparison() {
  return (
    <section id="automation" className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -top-6 right-4 sm:right-10 text-[140px] sm:text-[220px] font-black text-neutral-100 leading-none select-none pointer-events-none"
      >
        05
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
            05 — Automation
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 font-display leading-[1.05]">
            10 Apps. 10 Subscriptions. 10 Logins.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-10">
          {/* Chaotic cluster */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase mb-3 text-center">
              Typical Agency Stack — Real Tools
            </div>
            <div
              className="relative h-80 rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            >
              <svg viewBox="0 0 100 65" className="absolute inset-0 w-full h-full">
                {TANGLED_LINES.map(([a, b], i) => (
                  <line
                    key={i}
                    x1={CHAOTIC_POSITIONS[a][0]}
                    y1={CHAOTIC_POSITIONS[a][1] * 0.65}
                    x2={CHAOTIC_POSITIONS[b][0]}
                    y2={CHAOTIC_POSITIONS[b][1] * 0.65}
                    stroke="#d4d4d4"
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
              {APPS.map(({ Icon, color }, i) => {
                const [x, y] = CHAOTIC_POSITIONS[i];
                return (
                  <motion.div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white border border-neutral-300 shadow-sm flex items-center justify-center"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    animate={{
                      x: [0, (i % 2 === 0 ? 1 : -1) * 4, 0],
                      y: [0, (i % 3 === 0 ? -1 : 1) * 4, 0],
                    }}
                    transition={{
                      duration: 2.5 + (i % 4) * 0.4,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  >
                    <Icon size={18} color={color} />
                    {PINGING_INDICES.has(i) && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-white"
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
              A dozen real, disconnected tools, a dozen bills, a dozen logins — and constant
              notifications from all of them. You&apos;re the one holding it all together.
            </p>
          </motion.div>

          {/* Unified hub */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase mb-3 text-center">
              Axeon Unified Stack
            </div>
            <BorderBeam rounded="rounded-3xl">
              <div className="relative h-80 rounded-3xl bg-neutral-950 overflow-hidden">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle, #1e3a8a 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <svg viewBox="0 0 100 65" className="absolute inset-0 w-full h-full">
                {APPS.map((_, i) => {
                  const [x, y] = circlePosition(i, APPS.length, 26);
                  return (
                    <motion.line
                      key={i}
                      x1={50}
                      y1={32.5}
                      x2={x}
                      y2={y * 0.65}
                      stroke="#2563EB"
                      strokeWidth="0.5"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                    />
                  );
                })}
              </svg>
              {APPS.map(({ Icon, color }, i) => {
                const [x, y] = circlePosition(i, APPS.length, 26);
                return (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/95 border border-blue-400/50 flex items-center justify-center"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <Icon size={16} color={color} />
                  </div>
                );
              })}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.7)]"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="20" height="17" viewBox="0 0 24 20" fill="currentColor" className="text-white">
                  <polygon points="6,0 2,20 6,20 10,0" />
                  <polygon points="14,0 10,20 14,20 18,0" />
                  <circle cx="21" cy="18" r="2" />
                </svg>
              </motion.div>
              </div>
            </BorderBeam>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
              Every one of those workflows, absorbed into one custom-developed platform. You
              only ever deal with us.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
