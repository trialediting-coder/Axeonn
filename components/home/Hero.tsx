'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrustBadges } from '@/components/common/TrustBadges';

// The headline is "Get More ___": the result a practice or firm buys, not the
// service (owner, 2026-10-19: sell the outcome). Each result belongs to one of
// the four verticals, and the background crossfades to that vertical's photo
// with it, so no single kind of practice owns the first screen (owner,
// 2026-10-19: tailor to all our verticals, not just clinics).
const SLIDES = [
  { word: 'New Patients', image: '/who-we-help/dental.webp', position: 'object-[70%_center]' },
  { word: 'Consultations', image: '/who-we-help/med-spa.webp', position: 'object-[60%_center]' },
  { word: 'Signed Cases', image: '/who-we-help/law-firms.webp', position: 'object-center' },
  { word: 'New Clients', image: '/who-we-help/accounting.webp', position: 'object-[65%_center]' },
] as const;
const ROTATE_INTERVAL_MS = 2600;

export function Hero() {
  const [index, setIndex] = useState(0);
  // Highest slide reached so far. Photos mount one slide ahead of it, so a phone
  // fetches the first photo (and the next one) instead of all four at once: they
  // all sit in the viewport, so loading="lazy" never deferred them.
  const [reached, setReached] = useState(0);
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
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    setReached((r) => Math.max(r, index));
  }, [index]);

  const slide = SLIDES[reducedMotion ? 0 : index];

  return (
    <section
      id="hero-section"
      className="relative z-10 w-full min-h-[calc(100svh-7.5rem)] sm:min-h-[calc(100dvh-12.5rem)] flex items-stretch justify-center"
    >
      {/* The hero stops short of the viewport so the "what's included" strip below is in the first screen. */}
      <div className="relative w-full bg-neutral-950 text-white flex flex-col px-6 sm:px-10 lg:px-16 xl:px-20 pt-20 sm:pt-28 pb-6 sm:pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* All four photos are stacked and crossfade with the headline word.
              Only the first is fetched eagerly; the rest load while it shows. */}
          {SLIDES.map((s, i) =>
            i > reached + 1 ? null : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.image}
              src={s.image}
              alt=""
              width={1600}
              height={1067}
              fetchPriority={i === 0 ? 'high' : 'low'}
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 w-full h-full object-cover ${s.position} transition-[opacity,transform] duration-[1400ms] ease-out ${
                s === slide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
            ),
          )}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-neutral-950/95 via-neutral-950/60 to-neutral-950/20 sm:from-neutral-950/90 sm:via-neutral-950/60 sm:via-35% sm:to-transparent sm:to-70%" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-neutral-950/40" />
          <div className="absolute -top-[13rem] -right-[13rem] w-[678px] h-[678px] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.25)_62%,transparent)] pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-3xl flex-1 flex flex-col justify-center sm:ml-16 lg:ml-24 xl:ml-32">
          {/* Phones: the two flex-1 spacers center the headline + CTAs and pin the
              badges to the bottom of the hero, right above the "what's included" band. */}
          <div aria-hidden="true" className="flex-1 sm:hidden" />
          <p className="hero-rise text-center sm:text-left text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-blue-300">
            Dental · Med spa · Law · Accounting
          </p>
          <h1 className="hero-rise mt-3 text-center sm:text-left text-[min(2.75rem,11vw)] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-[-0.03em] [word-spacing:0.12em] leading-[1.05] font-display text-white">
            Get More
            {/* The rotating phrase always sits on its own line. Old and new words
                share one grid cell and crossfade, so the line is never empty (with
                mode="wait" it went blank for ~0.4 s on every change). An invisible
                copy of the longest word holds the height and width steady. */}
            <span className="grid">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                Consultations
              </span>
              <AnimatePresence initial={false}>
                <motion.span
                  key={slide.word}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="col-start-1 row-start-1 text-blue-400"
                >
                  {slide.word}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Phones: one short line on what Axeon does, so a practice owner knows
              this isn't another SEO agency before they scroll. */}
          <p
            style={{ animationDelay: '0.15s' }}
            className="hero-rise sm:hidden mt-4 text-center text-[15px] leading-snug text-neutral-200 max-w-sm mx-auto"
          >
            We answer every missed call and web inquiry within 60 seconds, 24/7, and book the appointment.
          </p>

          <p
            style={{ animationDelay: '0.15s' }}
            className="hero-rise hidden sm:block mt-6 text-lg lg:text-xl text-neutral-300 font-normal leading-relaxed max-w-xl"
          >
            {/* Desktop only: on phones the hero is eyebrow, headline, CTAs and badges (owner, 2026-10-10). */}
            Your growth partner for dental practices, med spas, law firms and accounting firms: a website,
            SEO and ads that bring patients and clients in, and a system that answers every call and
            inquiry within 60 seconds, 24/7, and books them.
          </p>

          <div
            style={{ animationDelay: '0.25s' }}
            className="hero-rise mt-8 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
          >
            {/* Primary: the area check */}
            <Link
              href="/check-your-area"
              id="hero-primary-cta"
              data-track="cta_click"
              data-track-cta="area_check_hero"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-[18px] rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Check if your area is open</span>
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight size={15} />
              </div>
            </Link>

            {/* Secondary as a text link, not a second button: one clear action per screen.
                Goes to /book like every other "Book a call" on the site. */}
            <Link
              href="/book"
              id="hero-secondary-cta"
              data-track="cta_click"
              data-track-cta="book_call_hero"
              className="inline-flex items-center justify-center gap-1.5 py-2 sm:py-4 text-base sm:text-lg font-semibold text-white/85 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors cursor-pointer"
            >
              or book a call
            </Link>
          </div>

          <div aria-hidden="true" className="flex-1 min-h-6 sm:hidden" />

          <div style={{ animationDelay: '0.35s' }} className="hero-rise sm:mt-8">
            <TrustBadges variant="dark" size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
