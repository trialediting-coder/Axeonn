'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrustBadges } from '@/components/common/TrustBadges';
import { useLeadModal } from '@/components/common/LeadModalProvider';

// One word cycles in the otherwise-fixed headline "Get More ___",
// mirroring Scorpion's "MAXIMIZE Your ___" rotating-word pattern. Every word
// is an outcome the owner wants, never a deliverable (we sell customers).
const ROTATING_WORDS = ['Customers', 'Calls', 'Booked Jobs', 'Revenue'];
const ROTATE_INTERVAL_MS = 2200;

// Matches Tailwind's `sm` breakpoint: below it the hero uses the portrait phone media.
const MOBILE_QUERY = '(max-width: 639px)';

export function Hero() {
  const { open: openLeadModal } = useLeadModal();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [loopReady, setLoopReady] = useState(false);
  const [mobilePlaying, setMobilePlaying] = useState(false);
  const [avifFallback, setAvifFallback] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  // Read by the play/retry handlers below so scroll-triggered retries never
  // restart a video the viewer has scrolled past.
  const heroInViewRef = useRef(true);
  const [heroInView, setHeroInView] = useState(true);

  // Pause the hero media while it is off screen, resume when it comes back.
  // Saves decode work and battery on phones while the rest of the page is
  // being scrolled; the AVIF fallback (software-decoded) is swapped for the
  // static poster, since an animated image can't be paused.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      heroInViewRef.current = visible;
      setHeroInView(visible);
      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const video = isMobile ? mobileVideoRef.current : heroVideoRef.current;
      if (!video) return;
      if (!visible) {
        video.pause();
      } else if (video.paused) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Phones: nothing moving is fetched until the page has loaded, so the
  // copy, CSS and JS get the bandwidth first. The portrait poster covers
  // the gap.
  useEffect(() => {
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    let idleId: number | undefined;
    const start = () => {
      const ric = window.requestIdleCallback;
      if (ric) idleId = ric(() => setLoopReady(true), { timeout: 300 });
      else setLoopReady(true);
    };
    // Owner, 2026-10-04: waiting for window load made the video feel slow.
    start();
    return () => {
      window.removeEventListener('load', start);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    };
  }, []);

  // Phones play a real H.264 video (hardware-decoded, smooth). The animated
  // AVIF is decoded in software by WebKit on phones without AV1 hardware
  // (e.g. iPhone 15), which made it visibly choppy. iOS can still refuse to
  // autoplay (Low Power Mode, or until the first scroll), so the video stays
  // invisible, play glyph included, until frames are actually moving; if it
  // hasn't started within 3s the AVIF loop plays underneath as a fallback.
  // Any later touch/scroll retries play() and the video fades in over it.
  useEffect(() => {
    const video = mobileVideoRef.current;
    if (!loopReady || !video) return;

    const tryPlay = () => {
      if (!heroInViewRef.current) return;
      video.muted = true;
      video.defaultMuted = true;
      if (video.paused) video.play().catch(() => {});
    };
    // `paused` flips to false as soon as play() is called, even while the
    // file is still buffering, so track real playback via `playing`.
    let started = false;
    const onPlaying = () => {
      started = true;
      setMobilePlaying(true);
    };
    const onError = () => setAvifFallback(true);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    tryPlay();
    const fallbackId = window.setTimeout(() => {
      if (!started) setAvifFallback(true);
    }, 3000);

    const gestureEvents = ['touchstart', 'pointerdown', 'click', 'scroll'] as const;
    gestureEvents.forEach((evt) => window.addEventListener(evt, tryPlay, { passive: true }));

    return () => {
      window.clearTimeout(fallbackId);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      gestureEvents.forEach((evt) => window.removeEventListener(evt, tryPlay));
    };
  }, [loopReady]);

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

  // Desktop/tablet only: phones get their own portrait video (with an AVIF
  // fallback for when iOS blocks autoplay), handled in the effect above.
  // Browsers can also silently drop the very first autoplay attempt when the
  // file is still buffering, so retry on readiness milestones, on tab
  // visibility/bfcache resume, and on a short poll until playback starts.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || window.matchMedia(MOBILE_QUERY).matches) return;

    const tryPlay = () => {
      if (!heroInViewRef.current) return;
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
      ref={sectionRef}
      id="hero-section"
      className="relative z-10 w-full min-h-[calc(100svh-7.5rem)] sm:min-h-[calc(100dvh-12.5rem)] flex items-stretch justify-center"
    >
      {/*
        The hero is a plain region. It used to be one giant click target that
        routed to /book (with a custom follow-the-mouse cursor advertising it),
        which produced accidental navigations from stray taps and polluted the
        click data. The two explicit CTAs below are the only actions now.
      */}
      {/* The hero stops short of the viewport so the "Helping 50+ Iowa Businesses" strip below is in the first screen. */}
      <div className="relative w-full bg-neutral-950 text-white flex flex-col px-6 sm:px-10 lg:px-16 xl:px-20 pt-20 sm:pt-28 pb-6 sm:pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-poster.webp"
            className="hidden sm:block w-full h-full object-cover object-center scale-105"
          >
            {/* No source matches on phones, so they never download the video. */}
            <source src="/videoplayback.mp4" type="video/mp4" media="(min-width: 640px)" />
          </video>
          {/*
            Phones: portrait center crop of the same 30s clip (540x960, 24fps).
            The old 480x270 landscape file was upscaled ~9x by object-cover on
            a tall screen, which is what made it blurry. Layers, bottom up:
            portrait poster (paints with the HTML) -> AVIF loop (only if the
            video can't start, see avifFallback) -> H.264 video (faded in once
            it is actually playing). Once the video plays, the poster/AVIF
            layer is faded out and the AVIF dropped; both sit at full opacity
            with the dark background, so leaving it would ghost through.
          */}
          <picture
            className={`block w-full h-full sm:hidden transition-opacity duration-700 ${mobilePlaying ? 'opacity-0' : 'opacity-100'}`}
          >
            {avifFallback && !mobilePlaying && heroInView && <source srcSet="/hero-loop.avif" type="image/avif" media="(max-width: 639px)" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-poster-mobile.webp"
              alt=""
              fetchPriority="high"
              style={{ backgroundImage: 'url(/hero-poster-mobile.webp)' }}
              className="w-full h-full object-cover object-center bg-cover bg-center scale-105"
            />
          </picture>
          {loopReady && (
            <video
              ref={mobileVideoRef}
              src="/hero-mobile.mp4"
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              className={`sm:hidden absolute inset-0 w-full h-full object-cover object-center scale-105 transition-opacity duration-700 ${mobilePlaying ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent sm:from-neutral-950/90 sm:via-neutral-950/60 sm:via-35% sm:to-transparent sm:to-70%" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-neutral-950/40" />
          {/* Soft glows as radial gradients: same look as a blurred disc, without a
              64px blur filter that phones have to rasterize over the video. */}
          <div className="absolute -top-[13rem] -right-[13rem] w-[678px] h-[678px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.25)_62%,transparent)] pointer-events-none" />
          <div className="absolute -bottom-16 right-[calc(25%-4rem)] w-[528px] h-[528px] rounded-full bg-[radial-gradient(closest-side,rgb(244_63_94/0.15)_52%,transparent)] pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-3xl flex-1 flex flex-col justify-center sm:ml-16 lg:ml-24 xl:ml-32">
          <h1 className="hero-rise text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[-0.03em] [word-spacing:0.12em] leading-[1.05] font-display text-white">
            Get More
            {/* The rotating word always sits on its own line. */}
            <span className="grid">
              <AnimatePresence mode="wait" initial={false}>
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
          </h1>

          <p
            style={{ animationDelay: '0.15s' }}
            className="hero-rise mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-neutral-300 font-normal leading-relaxed max-w-xl"
          >
            We get Iowa businesses found on Google, chosen over the competition, and
            booked solid. Backed by our 90-day customer guarantee.
          </p>

          <div
            style={{ animationDelay: '0.25s' }}
            className="hero-rise mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
          >
            {/* Primary: the dedicated intake page (same form as the contact section) */}
            <Link
              href="/get-started"
              id="hero-primary-cta"
              data-track="cta_click"
              data-track-cta="get_started_hero"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-[18px] rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get More Customers</span>
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight size={15} />
              </div>
            </Link>

            {/* Secondary: for visitors who want a human first */}
            <button
              type="button"
              id="hero-secondary-cta"
              onClick={() => openLeadModal('hero')}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-[18px] rounded-full border border-white/40 bg-neutral-950/40 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-neutral-950/55 hover:border-white/60 text-white text-base sm:text-lg font-semibold transition-all duration-200 cursor-pointer"
            >
              <span>Book My Free Call</span>
              <ArrowRight size={18} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Tertiary: answers the #1 objection (price) */}
            <Link
              href="/pricing"
              data-track="cta_click"
              data-track-cta="see_pricing"
              className="hidden sm:inline-flex items-center justify-center py-2 sm:py-4 text-base sm:text-lg font-semibold text-white/80 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors"
            >
              See pricing
            </Link>
          </div>

          <div
            style={{ animationDelay: '0.35s' }}
            className="hero-rise mt-8 hidden sm:block"
          >
            <TrustBadges variant="dark" size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
