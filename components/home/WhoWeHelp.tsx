'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Scale,
  TrendingUp,
  Building2,
  Smile,
  Store,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { whoWeHelpEntries, whoWeHelpHeroVideo, whoWeHelpHeroImage, type WhoWeHelpEntry } from '@/data/whoWeHelpData';

function IndustryVideoLayer({
  entry,
  isActive,
}: {
  entry: WhoWeHelpEntry;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none"
      style={{
        opacity: isActive ? 1 : 0,
      }}
    >
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload={isActive ? 'auto' : 'none'}
        poster={entry.image}
        src={entry.video}
        className="w-full h-full object-cover object-[70%_center] sm:object-center"
      />
    </div>
  );
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'Home Services': Home,
  'Legal': Scale,
  'Financial': TrendingUp,
  'Real Estate': Building2,
  'Dental': Smile,
  'Small Business': Store,
};

export function WhoWeHelp() {
  const [activeIndustryId, setActiveIndustryId] = useState<string>('home-services');

  const activeEntry =
    whoWeHelpEntries.find((e) => e.id === activeIndustryId) || whoWeHelpEntries[0];

  return (
    <section
      id="who-we-help"
      className="w-full py-20 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-transparent text-neutral-950"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        {/* Top Eyebrow & Headlines */}
        <div className="mb-12 sm:mb-16">
          <p className="text-sm sm:text-base font-bold tracking-[0.22em] text-[#3366ff] uppercase mb-4 sm:mb-5">
            The Difference
          </p>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black tracking-tight text-neutral-950 leading-[1.14]">
            The solutions, commitment, and expertise to deliver{' '}
            <span className="inline-block bg-[#dfe8ff] text-neutral-950 px-5 sm:px-7 py-2 rounded-2xl font-black mt-2 sm:mt-0 align-middle">
              growth
            </span>
          </h2>

          <p className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-6 sm:mt-8">
            Choose your industry and let&apos;s get started.
          </p>
        </div>

        {/* Grand Video Canvas Card (Scaled 1.5x) */}
        <div className="relative rounded-[36px] sm:rounded-[48px] overflow-hidden min-h-[920px] lg:min-h-[1040px] shadow-2xl bg-neutral-950 flex flex-col justify-center border border-black/5">
          {/* Base / Idle Video Background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none"
            style={{ opacity: activeIndustryId === null ? 1 : 0 }}
          >
            <video
              loop
              muted
              playsInline
              preload={activeIndustryId === null ? 'auto' : 'none'}
              poster={whoWeHelpHeroImage}
              src={whoWeHelpHeroVideo}
              className="w-full h-full object-cover object-[70%_center] sm:object-center"
            />
          </div>

          {/* Per-Industry Videos with Smooth Crossfade */}
          {whoWeHelpEntries.map((entry) => (
            <IndustryVideoLayer
              key={entry.id}
              entry={entry}
              isActive={activeIndustryId === entry.id}
            />
          ))}

          {/* Gradient Scrim: Dark on left so buttons & text are crisp, translucent on right to reveal footage */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/75 to-neutral-950/20 sm:from-neutral-950/90 sm:via-neutral-950/65 sm:to-transparent pointer-events-none"
          />

          {/* Top subtle inner shadow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none"
          />

          {/* Navigation Overlay - Two columns opening horizontally side-by-side (Scaled 1.5x) */}
          <div className="relative z-10 p-6 sm:p-12 lg:p-18 xl:p-22 w-full flex flex-col justify-center my-auto">
            {/* Small uppercase label */}
            <div className="mb-6 pl-1">
              <span className="text-sm sm:text-base font-extrabold tracking-[0.25em] text-white/90 uppercase">
                WHO WE HELP
              </span>
            </div>

            {/* Horizontal Side-by-Side Flex Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6 md:gap-8 max-w-full">
              {/* Left Column: Stack of Industry Pills (Scaled 1.5x) */}
              <div className="w-full sm:w-[480px] md:w-[540px] shrink-0 flex flex-col gap-4">
                {whoWeHelpEntries.map((entry) => {
                  const Icon = INDUSTRY_ICONS[entry.label] || Home;
                  const isActive = activeIndustryId === entry.id;

                  const tabContent = (
                    <>
                      {/* Left: Icon + Industry Name */}
                      <div className="flex items-center gap-5 min-w-0">
                        <div
                          className={`w-10 h-10 flex items-center justify-center shrink-0 transition-colors ${
                            isActive ? 'text-blue-200' : 'text-blue-300 group-hover:text-blue-200'
                          }`}
                        >
                          <Icon size={30} strokeWidth={2.4} />
                        </div>
                        <span className="font-bold text-white text-xl sm:text-2xl tracking-tight truncate">
                          {entry.label}
                        </span>
                      </div>

                      {/* Right: Clean Arrow Icon */}
                      <div className="shrink-0 ml-4 text-white transition-colors">
                        <ArrowRight
                          size={24}
                          strokeWidth={2.5}
                          className="group-hover:translate-x-1.5 transition-transform"
                        />
                      </div>
                    </>
                  );

                  const commonClasses = `group w-full flex items-center justify-between px-8 py-6 sm:py-6.5 rounded-2xl transition-all duration-200 cursor-pointer border text-left backdrop-blur-md ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2c40a5] via-[#374cb8] to-[#425ec8] border-blue-300/60 shadow-2xl shadow-blue-950/70 ring-2 ring-blue-300/40'
                      : 'bg-white/[0.09] hover:bg-white/[0.16] border-white/20 hover:border-white/35 shadow-lg shadow-black/25'
                  }`;

                  if (entry.href) {
                    return (
                      <Link
                        key={entry.id}
                        href={entry.href}
                        id={`industry-tab-${entry.id}`}
                        onMouseEnter={() => setActiveIndustryId(entry.id)}
                        onClick={() => setActiveIndustryId(entry.id)}
                        className={commonClasses}
                      >
                        {tabContent}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      id={`industry-tab-${entry.id}`}
                      onClick={() => setActiveIndustryId(entry.id)}
                      onMouseEnter={() => setActiveIndustryId(entry.id)}
                      className={commonClasses}
                    >
                      {tabContent}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Flyout Niche Card for categories with multiple sub-niches (Scaled 1.5x) */}
              <AnimatePresence mode="wait">
                {activeEntry && activeEntry.niches && activeEntry.niches.length > 0 && (
                  <motion.div
                    key={activeEntry.id}
                    id={`niches-list-${activeEntry.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="w-full sm:w-[380px] md:w-[420px] shrink-0 rounded-2xl bg-gradient-to-b from-[#3a50be]/95 via-[#3245aa]/95 to-[#273787]/95 backdrop-blur-xl border border-blue-400/50 p-6 sm:p-7 shadow-2xl flex flex-col justify-center"
                  >
                    <div className="flex flex-col gap-2">
                      {activeEntry.niches.map((niche) => (
                        <Link
                          key={niche.label}
                          href={niche.href}
                          className="group/niche flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-white/10 active:bg-white/20 text-left transition-all text-white cursor-pointer"
                        >
                          <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                            {niche.label}
                          </span>
                          <ArrowRight
                            size={20}
                            strokeWidth={2.4}
                            className="text-white/80 group-hover/niche:text-white group-hover/niche:translate-x-1 transition-transform shrink-0 ml-2"
                          />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


