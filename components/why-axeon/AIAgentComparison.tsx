'use client';

import { motion } from 'motion/react';
import { AudioOrbPlayer } from './AudioOrbPlayer';

export default function AIAgentComparison() {
  return (
    <section id="ai-agent" className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -top-6 left-4 sm:left-10 text-[140px] sm:text-[220px] font-black text-white/5 leading-none select-none pointer-events-none"
      >
        02
      </span>
      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
            02 — AI Receptionist
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.05] mb-5">
            Same Job. Listen To The Difference.
          </h2>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            These are real recorded calls, not scripted demos. Press play on each.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-14 grid sm:grid-cols-2 gap-10 sm:gap-16 justify-items-center items-center bg-neutral-900/60 rounded-3xl border border-neutral-800 py-14 px-6 sm:px-8"
        >
          <AudioOrbPlayer
            variant="flat"
            src="/audio/competitor-ai-call.mp3"
            label="Typical Agency AI"
          />
          <AudioOrbPlayer variant="orb" src="/audio/axeon-ai-call.mp3" label="Axeon's AI" />
        </motion.div>
      </div>
    </section>
  );
}
