'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrustBadges } from '@/components/common/TrustBadges';
import { useLeadModal } from '@/components/common/LeadModalProvider';

// One word cycles in the otherwise-fixed 4-word headline "Grow Your Local ___",
// mirroring Scorpion's "MAXIMIZE Your ___" rotating-word pattern.
const ROTATING_WORDS = ['Revenue', 'Bookings', 'Business', 'Brand'];
const ROTATE_INTERVAL_MS = 2200;

// Matches Tailwind's `sm` breakpoint: below it the hero shows the AVIF loop.
const MOBILE_QUERY = '(max-width: 639px)';

export function Hero() {
  const { open: openLeadModal } = useLeadModal();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  // Desktop/tablet only: phones get the animated AVIF below instead, because
  // iOS (Safari and Chrome alike) often refuses to autoplay even a muted
  // video until the first scroll, and no retry from script gets around it.
  // Browsers can also silently drop the very first autoplay attempt when the
  // file is still buffering, so retry on readiness milestones, on tab
  // visibility/bfcache resume, and on a short poll until playback starts.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || window.matchMedia(MOBILE_QUERY).matches) return;

    const tryPlay = () => {
      video.muted = true;
      video.defaultMuted = true;
      if (video.paused) {
        video.play().catch(() => {
          // Will retry on the next readiness event or poll tick below.
        });
      }
    };

    tryPlay();

    const readinessEvents = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'progress', 'suspend', 'stalled'];
    readinessEvents.forEach((evt) => video.addEventListener(evt, tryPlay));
    document.addEventListener('visibilitychange', tryPlay);
    window.addEventListener('pageshow', tryPlay);

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (!video.paused || attempts >= 40) {
        window.clearInterval(intervalId);
        return;
      }
      tryPlay();
    }, 500);

    // If the browser still refuses, the first interaction unlocks play().
    // Keep listening until the video is actually playing rather than giving
    // up after the first event, which may not have counted as a gesture.
    const gestureEvents = ['pointerdown', 'pointerup', 'click', 'keydown', 'wheel', 'scroll'] as const;
    const removeGestureListeners = () => {
      gestureEvents.forEach((evt) => window.removeEventListener(evt, tryPlay));
    };
    gestureEvents.forEach((evt) => window.addEventListener(evt, tryPlay, { passive: true }));
    video.addEventListener('playing', removeGestureListeners);

    return () => {
      readinessEvents.forEach((evt) => video.removeEventListener(evt, tryPlay));
      document.removeEventListener('visibilitychange', tryPlay);
      window.removeEventListener('pageshow', tryPlay);
      window.clearInterval(intervalId);
      video.removeEventListener('playing', removeGestureListeners);
      removeGestureListeners();
    };
  }, []);

  return (
    <section
      id="hero-section"
      className="relative z-10 w-full h-[100svh] sm:h-[100dvh] flex items-stretch justify-center"
    >
      {/*
        The hero is a plain region. It used to be one giant click target that
        routed to /book (with a custom follow-the-mouse cursor advertising it),
        which produced accidental navigations from stray taps and polluted the
        click data. The two explicit CTAs below are the only actions now.
      */}
      <div className="relative w-full h-full bg-neutral-950 text-white flex flex-col px-6 sm:px-10 lg:px-16 xl:px-20 pt-24 sm:pt-28 pb-8 sm:pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-poster.webp"
            className="hidden sm:block w-full h-full object-cover object-center opacity-70 scale-105"
          >
            {/* No source matches on phones, so they never download the video. */}
            <source src="/videoplayback.mp4" type="video/mp4" media="(min-width: 640px)" />
          </video>
          {/*
            Phones get the same 30s clip as an animated AVIF: images aren't
            subject to autoplay policy, so it moves on load even where iOS
            holds a muted video on its play glyph (or Low Power Mode blocks it).
            Browsers without animated AVIF fall back to the still poster.
          */}
          <picture className="block w-full h-full sm:hidden">
            <source srcSet="/hero-loop.avif" type="image/avif" media="(max-width: 639px)" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-poster.webp"
              alt=""
              fetchPriority="high"
              className="w-full h-full object-cover object-center opacity-70 scale-105"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-neutral-950/95 via-neutral-950/60 to-transparent sm:from-neutral-950 sm:via-neutral-950/80 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/30" />
          <div className="absolute -top-40 -right-40 w-[550px] h-[550px] bg-[#2563EB]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-3xl flex-1 flex flex-col justify-center sm:ml-16 lg:ml-24 xl:ml-32">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[-0.03em] leading-[1.05] font-display text-white"
          >
            Grow Your Local{' '}
            <span className="inline-grid">
              <AnimatePresence mode="wait">
                <motion.span
                  key={reducedMotion ? 'static' : ROTATING_WORDS[wordIndex]}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-blue-400"
                >
                  {reducedMotion ? ROTATING_WORDS[0] : ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-base sm:text-lg lg:text-xl text-neutral-300 font-normal leading-relaxed max-w-xl"
          >
            We build and run websites that turn local searches into phone calls, with
            flat-rate pricing and a team you can actually reach.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
          >
            {/* Primary: the real ask, named as what it is */}
            <button
              type="button"
              id="hero-primary-cta"
              onClick={() => openLeadModal('hero')}
              className="group inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Book a Free Strategy Call</span>
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight size={15} />
              </div>
            </button>

            {/* Secondary: the lighter action, answers the #1 objection (price) */}
            <Link
              href="/pricing"
              id="hero-secondary-cta"
              data-track="cta_click"
              data-track-cta="see_pricing"
              className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/40 text-white text-base font-semibold backdrop-blur-sm transition-all duration-200 cursor-pointer"
            >
              <span>See Flat-Rate Pricing</span>
              <ArrowRight size={16} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6"
          >
            <TrustBadges variant="dark" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
