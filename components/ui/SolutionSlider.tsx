'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface DetailedSolutionBreakdown {
  title: string;
  badge?: string;
  category: string;
  image: string;
  imageAlt: string;
  summary: string;
  fullBreakdown: string[];
  deliverables: string[];
  impactMetric: {
    value: string;
    label: string;
  };
  turnaround: string;
  technologies: string[];
}

interface SolutionSliderProps {
  solutions: DetailedSolutionBreakdown[];
  categoryTag?: string;
  sectionTitle?: string;
  subtitle?: string;
  promptText?: string;
  onSelectSolution?: (solution: DetailedSolutionBreakdown) => void;
}

export const SolutionSlider: React.FC<SolutionSliderProps> = ({
  solutions,
  categoryTag,
  sectionTitle = 'Services Engineered to Connect With Your Audience',
  promptText = 'Select a service to learn more:',
  onSelectSolution,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!solutions || solutions.length === 0) return null;

  const current = solutions[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? solutions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === solutions.length - 1 ? 0 : prev + 1));
  };

  const displayCategoryTag =
    categoryTag ||
    (current.category ? `${current.category.toUpperCase()} SERVICES` : 'ENGINEERED SOLUTIONS');

  return (
    <div className="w-full flex flex-col justify-center py-6 sm:py-10 lg:py-14">
      {/* 1. Header: Eyebrow + Big Punchy Title + Selector Prompt */}
      <div className="mb-8 sm:mb-12">
        <div className="text-xs font-mono font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          {displayCategoryTag}
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.08] max-w-4xl mb-4">
          {sectionTitle}
        </h2>

        <p className="text-base sm:text-lg text-neutral-600 font-normal">
          {promptText}
        </p>
      </div>

      {/* 2. Service Tabs Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-8 sm:mb-12">
        {solutions.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={item.title + idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-neutral-950 text-white border border-neutral-950 shadow-xs'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 hover:border-neutral-400'
              }`}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* 3. Main Slide Showcase (Expansive 58% Media, 120px+ Gutter, 100% Clean Image) */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 xl:gap-32 items-center"
          >
            {/* Left Column: Text */}
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.15] mb-5">
                {current.title}
              </h3>

              {/* Description */}
              <div className="space-y-3 mb-6 max-w-xl">
                <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
                  {current.summary}
                </p>
                {current.fullBreakdown && current.fullBreakdown[1] && current.fullBreakdown[1] !== current.summary && (
                  <p className="text-sm sm:text-base text-neutral-500 leading-relaxed font-normal">
                    {current.fullBreakdown[1]}
                  </p>
                )}
              </div>

              {/* Deliverables Checklist */}
              {current.deliverables && current.deliverables.length > 0 && (
                <div className="mb-8 pt-5 border-t border-neutral-200/80">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                    Included Execution &amp; Deliverables:
                  </div>
                  <ul className="space-y-2.5">
                    {current.deliverables.slice(0, 3).map((del, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-neutral-700">
                        <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{del}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Primary CTA */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectSolution) onSelectSolution(current);
                  }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-neutral-950 hover:bg-blue-600 text-white font-semibold text-base tracking-tight shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <span>Start Your Project</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Bottom Controls: Previous / Next Circle Buttons + Slide Count */}
              <div className="flex items-center justify-between pt-5 border-t border-neutral-200/80">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous solution slide"
                    className="w-11 h-11 rounded-full border border-neutral-300 hover:border-neutral-950 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next solution slide"
                    className="w-11 h-11 rounded-full border border-neutral-300 hover:border-neutral-950 bg-white hover:bg-neutral-50 text-neutral-800 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="text-xs sm:text-sm font-mono font-medium text-neutral-500">
                  Slide {currentIndex + 1} of {solutions.length}
                </div>
              </div>
            </div>

            {/* Right Column: Image */}
            <div className="flex items-center justify-center">
              <div className="w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-lg aspect-[4/3]">
                <img
                  src={current.image}
                  alt={current.imageAlt || current.title}
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
