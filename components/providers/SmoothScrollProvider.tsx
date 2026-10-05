'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Skip JS-driven smooth scroll on touch devices — re-implementing scroll
    // physics on top of native touch scrolling fights the browser's own
    // hardware-accelerated momentum scrolling and costs real main-thread
    // work on every frame, which reads as jank/slowness on mobile. Native
    // scroll is already smooth there, and every __lenis consumer in this
    // app already falls back to native scrollIntoView/scrollTo when it's
    // undefined, so skipping initialization entirely is safe.
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    // Initialize Lenis for luxurious, inertia-driven smooth scrolling
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.3,
      syncTouch: false,
    });

    lenisRef.current = lenis;
    (window as any).__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Watch for DOM size/layout mutations to automatically adjust scroll boundaries
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        lenis.resize();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      lenis.destroy();
      lenisRef.current = null;
      delete (window as any).__lenis;
    };
  }, []);

  // Back/forward should restore the previous scroll position, not jump to top.
  const isPopNavRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  useEffect(() => {
    const onPop = () => {
      isPopNavRef.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // When route changes, recalibrate and reset scroll position seamlessly.
  // If the new URL carries a hash (e.g. a Header link to "/#platform" from
  // another page), Lenis manages its own virtual scroll position, so the
  // browser's native hash-jump doesn't actually move it — we have to scroll
  // there ourselves once the new page's content has settled.
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.resize();
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        const timeoutId = window.setTimeout(() => {
          const el = document.getElementById(id);
          if (el && lenisRef.current) {
            lenisRef.current.resize();
            lenisRef.current.scrollTo(el, { offset: -70, duration: 1.2 });
          }
        }, 100);
        return () => window.clearTimeout(timeoutId);
      } else {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
      return;
    }

    // Touch devices (no Lenis): don't rely solely on Next's router scroll.
    // On iOS the html-level `scroll-behavior: smooth` animation can be cut
    // short by the new page's layout shifts, leaving the visitor mid-page.
    // Jump instantly, then once more after the new page has painted.
    const wasPopNav = isPopNavRef.current;
    isPopNavRef.current = false;
    const isFirstRender = !hasNavigatedRef.current;
    hasNavigatedRef.current = true;
    if (isFirstRender || wasPopNav || window.location.hash) return;
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    toTop();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(toTop);
    });
    // The phone menu holds a body scroll lock until its close animation
    // (~320ms) finishes; re-check after that unless the visitor has
    // already started scrolling on their own.
    let userScrolled = false;
    const onUserScroll = () => {
      userScrolled = true;
    };
    window.addEventListener('touchstart', onUserScroll, { passive: true });
    window.addEventListener('wheel', onUserScroll, { passive: true });
    const timeoutId = window.setTimeout(() => {
      if (!userScrolled) toTop();
    }, 400);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timeoutId);
      window.removeEventListener('touchstart', onUserScroll);
      window.removeEventListener('wheel', onUserScroll);
    };
  }, [pathname]);

  return <>{children}</>;
};

/**
 * Universal helper for smooth anchor/target scrolling across any page or component.
 */
export function smoothScrollTo(
  target: string | number | HTMLElement,
  offset: number = -80,
  duration: number = 1.2
) {
  const lenis = (window as any).__lenis as Lenis | undefined;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration });
  } else if (typeof target === 'string') {
    const id = target.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}
