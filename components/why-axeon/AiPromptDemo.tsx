'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Link2 } from 'lucide-react';

// One rotating example per industry Axeon builds for — keeps the demo honest
// about serving all 11, not just HVAC.
const QUERIES = [
  { query: 'best hvac company near me', descriptor: 'fast dispatch and transparent pricing' },
  { query: 'best emergency dentist near me', descriptor: 'same-day appointments and gentle care' },
  { query: 'best med spa near me', descriptor: 'personalized treatment plans and membership perks' },
  { query: 'best roofing contractor near me', descriptor: 'fast storm response and honest estimates' },
  { query: 'best personal injury lawyer near me', descriptor: 'responsive communication and no upfront fees' },
  { query: 'best cpa firm near me', descriptor: 'proactive tax planning and clear pricing' },
  { query: 'best home remodeling contractor near me', descriptor: 'on-time projects and transparent quotes' },
  { query: 'best real estate agent near me', descriptor: 'fast responses and local market expertise' },
  { query: 'best landscaping company near me', descriptor: 'reliable crews and seasonal maintenance plans' },
  { query: 'best auto detailing near me', descriptor: 'meticulous work and easy online booking' },
  { query: 'best managed IT services near me', descriptor: 'fast ticket response and proactive monitoring' },
];

const TYPE_SPEED = 45;
const HOLD_AFTER_TYPE = 500;
const THINKING_TIME = 1100;
const RESPONSE_HOLD = 3200;
const RESET_PAUSE = 700;

type Phase = 'typing' | 'thinking' | 'answered' | 'resetting';

export function AiPromptDemo() {
  const [phase, setPhase] = useState<Phase>('typing');
  const [typed, setTyped] = useState('');
  const [queryIndex, setQueryIndex] = useState(0);
  const current = QUERIES[queryIndex];

  useEffect(() => {
    if (phase !== 'typing') return;
    if (typed.length < current.query.length) {
      const t = setTimeout(() => setTyped(current.query.slice(0, typed.length + 1)), TYPE_SPEED);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase('thinking'), HOLD_AFTER_TYPE);
    return () => clearTimeout(t);
  }, [phase, typed, current.query]);

  useEffect(() => {
    if (phase === 'thinking') {
      const t = setTimeout(() => setPhase('answered'), THINKING_TIME);
      return () => clearTimeout(t);
    }
    if (phase === 'answered') {
      const t = setTimeout(() => setPhase('resetting'), RESPONSE_HOLD);
      return () => clearTimeout(t);
    }
    if (phase === 'resetting') {
      const t = setTimeout(() => {
        setTyped('');
        setQueryIndex((i) => (i + 1) % QUERIES.length);
        setPhase('typing');
      }, RESET_PAUSE);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="max-w-xl mx-auto w-full rounded-3xl border border-blue-800/50 bg-neutral-900/70 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-5 text-[11px] font-mono uppercase tracking-wide text-neutral-400">
        Watch an AI Answer Engine
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 mb-4">
        <Search size={14} className="text-neutral-500 shrink-0" />
        <span className="text-sm text-neutral-100 font-mono">
          {typed}
          <motion.span
            className="inline-block w-[2px] h-4 bg-blue-400 ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          />
        </span>
      </div>

      <div className="min-h-[112px]">
      <AnimatePresence mode="wait">
        {phase === 'thinking' && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 px-4 py-3 text-neutral-400"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-neutral-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        )}

        {phase === 'answered' && (
          <motion.div
            key={`answered-${queryIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="px-4 py-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-sm text-neutral-200 leading-relaxed"
          >
            Based on local reviews and service data, a well-reviewed option is{' '}
            <strong className="text-white">your business</strong> — known for {current.descriptor}.
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold"
            >
              <Link2 size={10} />
              your-site.com
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
