'use client';

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { TrustBadges } from '@/components/common/TrustBadges';
import { useLeadModal } from '@/components/common/LeadModalProvider';

// One word cycles in the otherwise-fixed 4-word headline "Grow Your Local ___",
// mirroring Scorpion's "MAXIMIZE Your ___" rotating-word pattern.
const ROTATING_WORDS = ['Revenue', 'Bookings', 'Business', 'Brand'];
const ROTATE_INTERVAL_MS = 2200;

export function Hero() {
  const router = useRouter();
  const { open: openLeadModal } = useLeadModal();
  const heroCardRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isOverInteractive, setIsOverInteractive] = useState(false);
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

  // Browsers can silently drop the very first autoplay attempt — most often
  // because the video is still buffering on a slow connection when autoplay
  // fires, and nothing tells the browser to try again once it's ready. A
  // hard refresh "fixes" it only because the file is then warm in HTTP
  // cache. Retry on every readiness milestone, on tab-visibility/bfcache
  // resume, and on a short poll as an ultimate safety net.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    if (window.matchMedia('(max-width: 640px)').matches) {
      video.src = '/videoplayback-mobile.mp4';
      video.load();
    }

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

    const readinessEvents = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'];
    readinessEvents.forEach((evt) => video.addEventListener(evt, tryPlay));
    document.addEventListener('visibilitychange', tryPlay);
    window.addEventListener('pageshow', tryPlay);

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (!video.paused || attempts >= 8) {
        window.clearInterval(intervalId);
        return;
      }
      tryPlay();
    }, 750);

    const gestureEvents = ['pointerdown', 'touchstart', 'keydown', 'wheel'] as const;
    const onFirstGesture = () => {
      tryPlay();
      gestureEvents.forEach((evt) => window.removeEventListener(evt, onFirstGesture));
    };
    gestureEvents.forEach((evt) => window.addEventListener(evt, onFirstGesture, { once: true, passive: true }));

    return () => {
      readinessEvents.forEach((evt) => video.removeEventListener(evt, tryPlay));
      document.removeEventListener('visibilitychange', tryPlay);
      window.removeEventListener('pageshow', tryPlay);
      window.clearInterval(intervalId);
      gestureEvents.forEach((evt) => window.removeEventListener(evt, onFirstGesture));
    };
  }, []);

  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const springConfig = { damping: 28, stiffness: 350, mass: 0.25 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    if (!isHovered) setIsHovered(true);

    const target = e.target as HTMLElement | null;
    const isInteractive = Boolean(
      target?.closest('button') ||
        target?.closest('a') ||
        target?.closest('input') ||
        target?.closest('[role="button"]')
    );
    setIsOverInteractive(isInteractive);
  };

  const handleMouseEnter = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (mouseX.get() < -100) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      smoothX.jump(e.clientX);
      smoothY.jump(e.clientY);
    } else {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsOverInteractive(false);
  };

  const isClickOnControl = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    return Boolean(el?.closest('a') || el?.closest('button') || el?.closest('input'));
  };

  const handleHeroCardClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isClickOnControl(e.target)) return;
    router.push('/book');
  };

  const handleHeroCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isClickOnControl(e.target)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push('/book');
    }
  };

  return (
    <section
      id="hero-section"
      className="hero-video-cursor relative z-10 w-full h-[100svh] sm:h-[100dvh] flex items-stretch justify-center"
    >
      <motion.div
        aria-hidden="true"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        initial={false}
        animate={{
          scale: isHovered && !isOverInteractive ? 1 : 0,
          opacity: isHovered && !isOverInteractive ? 1 : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 420, damping: 26 },
          opacity: { duration: 0.15 },
        }}
        className="hidden sm:flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-950 border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xs select-none"
      >
        <ArrowUpRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
      </motion.div>

      <div
        ref={heroCardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleHeroCardClick}
        onKeyDown={handleHeroCardKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Axeon Studio Hero Section — click to book a strategy call"
        title="Click to book a strategy call with Axeon Studio"
        className="hero-video-cursor relative w-full h-full bg-neutral-950 text-white flex flex-col px-6 sm:px-10 lg:px-16 xl:px-20 pt-24 sm:pt-28 pb-8 sm:pb-10 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 overflow-hidden"
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-poster.webp"
            src="/videoplayback.mp4"
            className="w-full h-full object-cover object-center opacity-70 scale-105"
          />
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
            Websites, SEO, and automated intake — built and run by one Iowa team you can
            actually call.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              id="hero-primary-cta"
              onClick={openLeadModal}
              className="group inline-flex items-center gap-4 px-6 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Show Me How</span>
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight size={15} />
              </div>
            </button>
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
