'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useInView, useReducedMotion } from 'motion/react';
import { services } from '@/data/marketingSolutionsData';

// "What we do" (owner, 2026-10-22: say what we actually provide, end-to-end
// digital marketing). One card per service page, in the order a new patient or
// client meets them: found, chosen, answered, booked. Titles, one-liners and
// links come from data/marketingSolutionsData.ts so the menu and this section agree.
// Photos are the ones the service pages already use (public/services).
//
// Shown as a 3D carousel (owner, 2026-10-22: "focus on one card at a time and
// automatically scroll ... cards in the distance come to the front"): one large
// card in front, the rest stepping back in depth on both sides. It advances on
// its own while on screen, pauses on hover or focus, and takes arrows, swipes,
// dots or a click on a card in the back. Reduced motion: no auto-advance.
const SERVICE_IMAGES: Record<string, { src: string; alt: string; position?: string }> = {
  website: { src: '/services/website-devices.webp', alt: 'A practice website open on a laptop and a phone', position: 'object-[center_70%]' },
  seo: { src: '/services/seo-maps.webp', alt: 'Google Maps results for a local search on a phone' },
  advertising: { src: '/services/advertising-dashboard.webp', alt: 'An ads report open on a laptop' },
  'video-photography': { src: '/services/video-photography.webp', alt: 'A camera filming an interview in an office' },
  'lead-generation': { src: '/services/lead-generation-call.webp', alt: 'A front-desk staff member answering a call' },
  'ai-chat-scheduling': { src: '/services/ai-chat-window.webp', alt: 'A website chat window offering to book a time' },
};
const ORDER = ['website', 'seo', 'advertising', 'video-photography', 'lead-generation', 'ai-chat-scheduling'];
const ADVANCE_MS = 4000;

const cards = ORDER.map((slug) => services.find((s) => s.slug === slug)).filter(
  (s): s is (typeof services)[number] => Boolean(s),
);

// Where a card sits in the stack: 0 in front, negative to the left, positive to
// the right, wrapping around so the ring never runs out.
function offsetFrom(index: number, active: number, count: number) {
  let d = index - active;
  if (d > count / 2) d -= count;
  if (d < -count / 2) d += count;
  return d;
}

// `jumped` is true when a card wraps from one end of the ring to the other.
// It moves there without a transition (it's hidden at both ends), otherwise
// it would fly across the stage behind the front card.
function cardStyle(offset: number, jumped: boolean): CSSProperties {
  const depth = Math.abs(offset);
  return {
    transform: `translateX(${offset * 58}%) translateZ(${-depth * 260}px) rotateY(${offset * -16}deg)`,
    opacity: depth > 2 ? 0 : 1,
    zIndex: 10 - depth,
    pointerEvents: depth > 2 ? 'none' : 'auto',
    transition: jumped ? 'none' : undefined,
  };
}

// Purpose: the visitor sees exactly what Axeon provides, end to end, one service at a time.
export function ThreePillars() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.4 });
  const reduce = useReducedMotion();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = cards.length;
  // Each card's offset on the previous render, to spot ring wrap-arounds.
  const prevOffsets = useRef<number[]>(cards.map((_, i) => offsetFrom(i, 0, count)));
  useEffect(() => {
    prevOffsets.current = cards.map((_, i) => offsetFrom(i, active, count));
  }, [active, count]);

  const go = useCallback((dir: 1 | -1) => setActive((a) => (a + dir + count) % count), [count]);

  useEffect(() => {
    if (reduce || paused || !inView) return;
    const id = window.setTimeout(() => go(1), ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, inView, reduce, go]);

  return (
    <section
      ref={sectionRef}
      id="what-we-do"
      aria-labelledby="what-we-do-heading"
      aria-roledescription="carousel"
      className="w-full py-14 sm:py-24 bg-black text-white overflow-hidden"
    >
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <h2
          id="what-we-do-heading"
          className="text-[32px] sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] sm:leading-[1.02]"
        >
          What we do.
        </h2>
        <p className="mt-3 sm:mt-5 max-w-3xl text-lg sm:text-2xl font-semibold text-neutral-300 leading-snug">
          End-to-end digital marketing for practices and firms. One team builds it, runs it and reports on it.
        </p>
      </div>

      {/* The stage: every card shares one grid cell, so the stage is as tall as the tallest card. */}
      <div
        className="mt-10 sm:mt-14 grid place-items-center touch-pan-y"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          setPaused(false);
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          // Only a mostly sideways swipe changes cards, so scrolling the page
          // past the section doesn't flip it.
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
      >
        <ul className="col-start-1 row-start-1 grid w-full place-items-center [perspective:1800px]">
          {cards.map((service, i) => {
            const offset = offsetFrom(i, active, count);
            const isActive = offset === 0;
            const img = SERVICE_IMAGES[service.slug];
            // Cards in the back keep a solid background and fade only their
            // contents, so nothing shows through the card in front.
            const inner = (
              <div
                style={{ opacity: isActive ? 1 : Math.abs(offset) === 1 ? 0.45 : 0.2 }}
                className="motion-safe:transition-opacity motion-safe:duration-700"
              >
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-neutral-900">
                  {img && (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 86vw, 720px"
                      className={`object-cover ${img.position ?? 'object-center'}`}
                    />
                  )}
                </div>
                <div className="p-5 sm:p-8 text-left">
                  <h3 className="flex items-start justify-between gap-3 text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
                    {service.title}
                    <ArrowUpRight size={28} className="shrink-0 mt-1 text-blue-400" />
                  </h3>
                  <p className="mt-2 sm:mt-3 text-base sm:text-xl text-neutral-300 leading-snug">{service.outcome}</p>
                </div>
              </div>
            );
            return (
              <li
                key={service.slug}
                aria-hidden={!isActive}
                style={cardStyle(offset, Math.abs(offset - (prevOffsets.current[i] ?? offset)) > count / 2)}
                className="col-start-1 row-start-1 w-[86vw] sm:w-[620px] lg:w-[720px] will-change-transform motion-safe:transition-[transform,opacity] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {/* Always the same element, so a card coming to the front isn't
                    remounted (that reloaded its photo and made it blink). A card
                    in the back brings itself to the front instead of navigating. */}
                <Link
                  href={service.href}
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => {
                    if (isActive) return;
                    e.preventDefault();
                    setActive(i);
                  }}
                  className={`block overflow-hidden rounded-[24px] sm:rounded-[32px] border bg-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-white transition-[border-color,box-shadow] duration-700 ${
                    isActive ? 'border-white/15 shadow-2xl shadow-blue-900/30' : 'border-white/10'
                  }`}
                >
                  {inner}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 sm:mt-10 max-w-[1720px] mx-auto px-4 sm:px-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous service"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {cards.map((service, i) => (
            <button
              key={service.slug}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${service.title}`}
              aria-current={i === active}
              className={`relative h-2 rounded-full transition-all duration-500 after:absolute after:-inset-x-1 after:-inset-y-4 after:content-[''] ${i === active ? 'w-8 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next service"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <p className="mt-6 sm:mt-8 px-4 text-center text-base sm:text-lg text-neutral-400">
        Plus a review request after every visit, and every result on one dashboard.{' '}
        <Link href="/marketing-solutions" className="font-bold text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">
          See how it fits together
        </Link>
      </p>
    </section>
  );
}

export default ThreePillars;
