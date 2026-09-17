'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface ProcessStep {
  num: string;
  title: string;
  desc: string;
  duration: string;
  deliverables: string[];
  outcome: string;
}

export function Process() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps: ProcessStep[] = [
    {
      num: '01',
      title: 'Discovery',
      desc: 'We take the time to learn your business, understand your ideal customers, and figure out what challenges you are facing.',
      duration: 'Days 1–2',
      deliverables: [
        'Intro & Goal Setting Session',
        'Audience & Competitor Review',
        'Website & Systems Walkthrough',
      ],
      outcome: 'A clear plan of action tailored to your business goals.',
    },
    {
      num: '02',
      title: 'Strategy',
      desc: 'We map out a simple, effective roadmap so every page and message has a clear purpose.',
      duration: 'Days 3–5',
      deliverables: [
        'Site Structure & Content Outline',
        'Customer Journey & Lead Flow',
        'Automated Follow-Up Plan',
      ],
      outcome: 'A strategy you understand and feel confident about.',
    },
    {
      num: '03',
      title: 'Design',
      desc: 'We create clean, modern designs that look great on phones, tablets, and desktops alike.',
      duration: 'Days 6–9',
      deliverables: [
        'Interactive Clickable Mockups',
        'Easy-to-Read Fonts & Colors',
        'Mobile-Friendly Page Layouts',
      ],
      outcome: 'Designs you love, reviewed and approved with your feedback.',
    },
    {
      num: '04',
      title: 'Launch & Support',
      desc: 'We build, test, and launch your new site, then stay right beside you to keep things running smoothly.',
      duration: 'Days 10–14',
      deliverables: [
        'Fast & Secure Web Development',
        'Instant Lead Alerts & CRM Connection',
        'Search Engine Setup & Launch Review',
      ],
      outcome: 'A live, reliable website ready to welcome new customers.',
    },
  ];

  return (
    <section
      id="clear-process"
      className="w-full min-h-screen py-20 lg:py-28 px-4 sm:px-8 lg:px-14 xl:px-20 bg-transparent flex flex-col justify-center overflow-hidden"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-24 items-start">
          {/* Left Column: Fixed / Sticky Header */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-mono font-semibold tracking-widest text-neutral-800 uppercase mb-4"
            >
              [ OUR PROCESS ]
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-950 font-display tracking-tight leading-[1.08] mb-6"
            >
              A Clear Working <br className="hidden sm:inline" />
              Process
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-lg"
            >
              We keep things transparent from day one. You'll always know what we're working on, why we're doing it, and what comes next.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 grid grid-cols-3 gap-4 max-w-md"
            >
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white text-center">
                <div className="text-2xl font-black text-neutral-950 font-display">4</div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-neutral-500 mt-1">Phases</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white text-center">
                <div className="text-2xl font-black text-neutral-950 font-display">7–14</div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-neutral-500 mt-1">Business Days</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white text-center">
                <div className="text-2xl font-black text-neutral-950 font-display">1</div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-neutral-500 mt-1">Point of Contact</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 4 Vertical Stacked Cards Matching the Concept Image */}
          <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-7">
            {steps.map((step, idx) => {
              const isSelected = activeStep === idx;

              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveStep(isSelected ? null : idx)}
                  className={`relative bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 xl:p-10 border transition-all duration-300 cursor-pointer shadow-xs hover:shadow-xl ${
                    isSelected
                      ? 'border-blue-500/80 ring-2 ring-blue-500/20 shadow-lg'
                      : 'border-neutral-200/90 hover:border-neutral-300'
                  }`}
                >
                  {/* Top Row: Large Watermark Number on Left & Blue Concept Icon on Right */}
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    {/* Watermark Number */}
                    <span
                      className={`text-5xl sm:text-6xl xl:text-7xl font-black font-display tracking-tight transition-colors duration-300 select-none ${
                        isSelected
                          ? 'text-blue-600/30'
                          : 'text-neutral-200 group-hover:text-neutral-300'
                      }`}
                    >
                      {step.num}
                    </span>

                    {/* Blue Concept Icon Matching the Artwork */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                      className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0"
                    >
                      {idx === 0 && (
                        /* Step 01: Open Book with Magnifying Glass */
                        <svg
                          viewBox="0 0 48 48"
                          fill="none"
                          className="w-11 h-11 sm:w-13 sm:h-13 text-blue-600"
                        >
                          {/* Book pages */}
                          <path
                            d="M6 10C12 8 18 9 24 13C30 9 36 8 42 10V33C36 31 30 32 24 36C18 32 12 31 6 33V10Z"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M24 13V36"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                          {/* Magnifying Glass overlay */}
                          <circle
                            cx="35"
                            cy="33"
                            r="6"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            fill="white"
                          />
                          <path
                            d="M39.5 37.5L44 42"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}

                      {idx === 1 && (
                        /* Step 02: Radiating Lightbulb with Arrows */
                        <svg
                          viewBox="0 0 48 48"
                          fill="none"
                          className="w-11 h-11 sm:w-13 sm:h-13 text-blue-600"
                        >
                          {/* Central lightbulb */}
                          <path
                            d="M18 20C18 16.6863 20.6863 14 24 14C27.3137 14 30 16.6863 30 20C30 22.5 28.5 24.5 27 26V28H21V26C19.5 24.5 18 22.5 18 20Z"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 31H27"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          {/* Radiating 8 arrows / rays */}
                          <path d="M24 5V9M24 5L21 7.5M24 5L27 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M43 24H39M43 24L40.5 21M43 24L40.5 27" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M24 43V39M24 43L21 40.5M24 43L27 40.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 24H9M5 24L7.5 21M5 24L7.5 27" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M37.5 10.5L34.5 13.5M37.5 10.5L34 11M37.5 10.5L37 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M37.5 37.5L34.5 34.5M37.5 37.5L34 37M37.5 37.5L37 34" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10.5 37.5L13.5 34.5M10.5 37.5L14 37M10.5 37.5L11 34" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10.5 10.5L13.5 13.5M10.5 10.5L14 11M10.5 10.5L11 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}

                      {idx === 2 && (
                        /* Step 03: 3 Stacked Isometric Layers */
                        <svg
                          viewBox="0 0 48 48"
                          fill="none"
                          className="w-11 h-11 sm:w-13 sm:h-13 text-blue-600"
                        >
                          {/* Top Layer */}
                          <path
                            d="M24 6L40 14L24 22L8 14L24 6Z"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinejoin="round"
                            fill="currentColor"
                            fillOpacity="0.15"
                          />
                          {/* Middle Layer */}
                          <path
                            d="M8 22L24 30L40 22"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Bottom Layer */}
                          <path
                            d="M8 30L24 38L40 30"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {idx === 3 && (
                        /* Step 04: Database Cylinder with Code Badge */
                        <svg
                          viewBox="0 0 48 48"
                          fill="none"
                          className="w-11 h-11 sm:w-13 sm:h-13 text-blue-600"
                        >
                          {/* Top cylinder ellipse */}
                          <ellipse
                            cx="24"
                            cy="12"
                            rx="16"
                            ry="6"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            fill="currentColor"
                            fillOpacity="0.1"
                          />
                          {/* Cylinder side body */}
                          <path
                            d="M8 12V24C8 27.31 15.16 30 24 30C25.5 30 27 29.9 28.4 29.7"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M40 12V22"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                          {/* Round Code Badge at Bottom-Right */}
                          <circle
                            cx="34"
                            cy="34"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="currentColor"
                          />
                          {/* Code bracket inside badge in white */}
                          <path
                            d="M32 31L29.5 34L32 37M36 31L38.5 34L36 37"
                            stroke="white"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl font-bold font-display text-neutral-950 tracking-tight mb-2 sm:mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base lg:text-lg text-neutral-600 leading-relaxed max-w-2xl font-normal">
                    {step.desc}
                  </p>

                  {/* Interactive Expandable Details (Click or Select) */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="overflow-hidden pt-5 mt-5 border-t border-neutral-100"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-200/80">
                          {/* Left: Deliverables list */}
                          <div className="sm:col-span-8 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">
                              <ShieldCheck size={14} className="text-blue-600" />
                              <span>Phase Deliverables</span>
                            </div>
                            <ul className="space-y-1.5 pt-1">
                              {step.deliverables.map((item, dIdx) => (
                                <li
                                  key={dIdx}
                                  className="text-xs sm:text-sm text-neutral-700 flex items-start gap-2"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="text-blue-600 mt-0.5 shrink-0"
                                  />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Right: Duration & Outcome */}
                          <div className="sm:col-span-4 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-neutral-200 pt-3 sm:pt-0 sm:pl-4">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 mb-1">
                                <Clock size={13} className="text-neutral-400" />
                                <span>{step.duration}</span>
                              </div>
                              <div className="text-xs font-medium text-neutral-900 leading-snug">
                                {step.outcome}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const el = document.getElementById('contact-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <span>Discuss {step.title}</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle expand cue bar */}
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full transition-colors ${
                          isSelected ? 'bg-blue-600' : 'bg-neutral-300'
                        }`}
                      />
                      {isSelected ? 'Click to collapse details' : 'Click to inspect deliverables'}
                    </span>
                    <span className="text-neutral-400 font-medium">
                      {isSelected ? '▲ Hide' : '▼ Expand'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
