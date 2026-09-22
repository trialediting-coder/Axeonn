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
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { whoWeHelpEntries, whoWeHelpHeroVideo, whoWeHelpHeroImage, type WhoWeHelpEntry } from '@/data/whoWeHelpData';
import { useIsMobile } from '@/lib/useMediaQuery';

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
        className="w-full h-full object-cover object-center"
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

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function NicheLinks({ entry, compact }: { entry: WhoWeHelpEntry; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-1 sm:gap-2">
      {entry.niches?.map((niche) => (
        <Link
          key={niche.label}
          href={niche.href}
          className={`group/niche flex items-center justify-between rounded-xl hover:bg-white/10 active:bg-white/20 text-left transition-colors text-white cursor-pointer ${
            compact ? 'py-3 px-4 min-h-[48px]' : 'py-3.5 px-4'
          }`}
        >
          <span className={`font-bold tracking-tight text-white ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
            {niche.label}
          </span>
          <ArrowRight
            size={compact ? 18 : 20}
            strokeWidth={2.4}
            className="text-white/80 group-hover/niche:text-white group-hover/niche:translate-x-1 transition-transform shrink-0 ml-2"
          />
        </Link>
      ))}
    </div>
  );
}

export function WhoWeHelp() {
  // `null` until hydration so we never mount autoplay video on a phone.
  const isMobile = useIsMobile();
  const [activeIndustryId, setActiveIndustryId] = useState<string | null>('home-services');

  const activeEntry = whoWeHelpEntries.find((e) => e.id === activeIndustryId) ?? null;
  const showVideo = isMobile === false;

  return (
    <section
      id="who-we-help"
      className="w-full py-16 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-transparent text-neutral-950"
    >
      <div className="w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto">
        {/* Top Eyebrow & Headlines */}
        <div className="mb-8 sm:mb-16">
          <p className="text-sm sm:text-base font-bold tracking-[0.22em] text-[#3366ff] uppercase mb-4 sm:mb-5">
            The Difference
          </p>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black tracking-tight text-neutral-950 leading-[1.14]">
            The solutions, commitment, and expertise to deliver{' '}
            <span className="inline-block bg-[#dfe8ff] text-neutral-950 px-5 sm:px-7 py-2 rounded-2xl font-black mt-2 sm:mt-0 align-middle">
              growth
            </span>
          </h2>

          <p className="text-xl sm:text-3xl font-bold text-neutral-950 mt-5 sm:mt-8">
            Choose your industry and let&apos;s get started.
          </p>
        </div>

        {/* Grand Video Canvas Card. On phones the card hugs its content and uses a
            static still instead of autoplay video: the video is almost entirely
            hidden behind the scrim at that width, so it was pure bandwidth. */}
        <div className="relative rounded-[28px] sm:rounded-[48px] overflow-hidden sm:min-h-[920px] lg:min-h-[1040px] shadow-2xl bg-neutral-950 flex flex-col justify-center border border-black/5">
          {/* Base / Idle Background: still image everywhere, video on sm+ only */}
          <div
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none"
            style={{ opacity: showVideo && activeIndustryId !== null ? 0 : 1 }}
          >
            {showVideo ? (
              <video
                loop
                muted
                playsInline
                preload={activeIndustryId === null ? 'auto' : 'none'}
                poster={whoWeHelpHeroImage}
                src={whoWeHelpHeroVideo}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={whoWeHelpHeroImage}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-[70%_center]"
              />
            )}
          </div>

          {/* Per-Industry Videos with Smooth Crossfade (desktop/tablet only) */}
          {showVideo &&
            whoWeHelpEntries.map((entry) => (
              <IndustryVideoLayer
                key={entry.id}
                entry={entry}
                isActive={activeIndustryId === entry.id}
              />
            ))}

          {/* Gradient Scrim: Dark on left so buttons & text are crisp, translucent on right to reveal footage */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-neutral-950/92 via-neutral-950/85 to-neutral-950/92 sm:bg-gradient-to-r sm:from-neutral-950/90 sm:via-neutral-950/65 sm:to-transparent pointer-events-none"
          />

          {/* Top subtle inner shadow */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none"
          />

          {/* Navigation Overlay - Two columns opening horizontally side-by-side on sm+,
              a single accordion column on phones */}
          <div className="relative z-10 p-5 sm:p-12 lg:p-18 xl:p-22 w-full flex flex-col justify-center my-auto">
            {/* Small uppercase label */}
            <div className="mb-4 sm:mb-6 pl-1">
              <span className="text-xs sm:text-base font-extrabold tracking-[0.25em] text-white/90 uppercase">
                WHO WE HELP
              </span>
            </div>

            {/* Horizontal Side-by-Side Flex Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-6 md:gap-8 max-w-full">
              {/* Left Column: Stack of Industry Pills */}
              <div className="w-full sm:w-[480px] md:w-[540px] shrink-0 flex flex-col gap-2.5 sm:gap-4">
                {whoWeHelpEntries.map((entry) => {
                  const Icon = INDUSTRY_ICONS[entry.label] || Home;
                  const isActive = activeIndustryId === entry.id;
                  const hasNiches = !!entry.niches && entry.niches.length > 0;
                  // On phones the sub-niche list expands inline under its pill,
                  // so the pill behaves like an accordion toggle instead of a link.
                  const isMobileAccordion = isMobile === true && hasNiches;

                  const tabContent = (
                    <>
                      {/* Left: Icon + Industry Name */}
                      <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 transition-colors ${
                            isActive ? 'text-blue-200' : 'text-blue-300 group-hover:text-blue-200'
                          }`}
                        >
                          <Icon className="w-6 h-6 sm:w-[30px] sm:h-[30px]" strokeWidth={2.4} />
                        </div>
                        <span className="font-bold text-white text-lg sm:text-2xl tracking-tight truncate">
                          {entry.label}
                        </span>
                      </div>

                      {/* Right: Arrow, or a chevron when the pill expands in place */}
                      <div className="shrink-0 ml-4 text-white transition-colors">
                        {isMobileAccordion ? (
                          <ChevronDown
                            size={22}
                            strokeWidth={2.5}
                            className={`transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                          />
                        ) : (
                          <ArrowRight
                            size={22}
                            strokeWidth={2.5}
                            className="group-hover:translate-x-1.5 transition-transform"
                          />
                        )}
                      </div>
                    </>
                  );

                  const commonClasses = `group w-full flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6.5 rounded-2xl transition-all duration-200 cursor-pointer border text-left backdrop-blur-md ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2c40a5] via-[#374cb8] to-[#425ec8] border-blue-300/60 shadow-2xl shadow-blue-950/70 ring-2 ring-blue-300/40'
                      : 'bg-white/[0.09] hover:bg-white/[0.16] active:bg-white/[0.16] border-white/20 hover:border-white/35 shadow-lg shadow-black/25'
                  }`;

                  // Hover-to-preview only makes sense with a real pointer. Touch
                  // browsers synthesise mouseenter right before click, which would
                  // otherwise fight the tap handler.
                  const hoverProps = isMobile ? {} : { onMouseEnter: () => setActiveIndustryId(entry.id) };

                  let pill;
                  if (entry.href && !isMobileAccordion) {
                    pill = (
                      <Link
                        href={entry.href}
                        id={`industry-tab-${entry.id}`}
                        {...hoverProps}
                        onClick={() => setActiveIndustryId(entry.id)}
                        className={commonClasses}
                      >
                        {tabContent}
                      </Link>
                    );
                  } else {
                    pill = (
                      <button
                        type="button"
                        id={`industry-tab-${entry.id}`}
                        aria-expanded={isMobileAccordion ? isActive : undefined}
                        aria-controls={hasNiches ? `niches-list-${entry.id}` : undefined}
                        {...hoverProps}
                        onClick={() =>
                          setActiveIndustryId((current) =>
                            isMobileAccordion && current === entry.id ? null : entry.id
                          )
                        }
                        className={commonClasses}
                      >
                        {tabContent}
                      </button>
                    );
                  }

                  return (
                    <div key={entry.id} className="flex flex-col">
                      {pill}

                      {/* Phone: sub-niches expand directly under the pill that was tapped */}
                      {isMobileAccordion && (
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              key="niches"
                              id={`niches-list-${entry.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: { duration: 0.32, ease: EASE_OUT },
                                opacity: { duration: 0.2 },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 rounded-2xl bg-gradient-to-b from-[#3a50be]/95 via-[#3245aa]/95 to-[#273787]/95 border border-blue-400/50 p-2 shadow-xl">
                                <NicheLinks entry={entry} compact />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column (sm+): Flyout Niche Card for categories with multiple sub-niches */}
              {isMobile !== true && (
                <AnimatePresence mode="wait">
                  {activeEntry && activeEntry.niches && activeEntry.niches.length > 0 && (
                    <motion.div
                      key={activeEntry.id}
                      id={`niches-list-${activeEntry.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="hidden sm:flex w-full sm:w-[380px] md:w-[420px] shrink-0 rounded-2xl bg-gradient-to-b from-[#3a50be]/95 via-[#3245aa]/95 to-[#273787]/95 backdrop-blur-xl border border-blue-400/50 p-6 sm:p-7 shadow-2xl flex-col justify-center"
                    >
                      <NicheLinks entry={activeEntry} />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
