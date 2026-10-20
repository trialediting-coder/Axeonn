'use client';

// components/common/InteractionLayer.tsx
// Subtle desktop-only pointer interactions for the whole marketing site, from
// one delegated listener (styles: "Desktop interactions" in app/globals.css).
// Owner 2026-10-20: "subtle interactive aspects... for desktop". Nothing here
// follows the cursor across the page (owner rejected cursor trails); every
// effect lives inside the element under the pointer:
//   - [data-spot]: a soft light inside the card, under the pointer.
//   - Primary pill buttons (blue rounded-full, or [data-magnetic]): a 5px pull.
//   - [data-parallax]: the hero photo drifts up to 8px against the pointer.
//   - [data-strike]: a crossed-out price draws its line once in view.
// Off on touch screens and under prefers-reduced-motion: the html gets no
// "ix-on" class, so the page renders exactly as before.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const MAGNET_MAX = 5; // px
const PARALLAX_MAX = 8; // px
const MAGNET_EASE = 'transform 320ms cubic-bezier(.2,.8,.2,1)';

function isMagnetic(el: HTMLElement): boolean {
  if (el.hasAttribute('data-magnetic')) return true;
  const c = el.className;
  return typeof c === 'string' && /\brounded-full\b/.test(c) && /(^|\s)bg-(blue-600|\[#0080FF\])(\s|$)/.test(c);
}

export function InteractionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    if (!mq.matches) return;
    const root = document.documentElement;
    root.classList.add('ix-on');

    let spot: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    let last: PointerEvent | null = null;
    let frame = 0;

    const clearSpot = () => {
      spot?.classList.remove('is-spot');
      spot = null;
    };
    const clearMagnet = () => {
      const m = magnet;
      magnet = null;
      if (!m) return;
      m.style.transform = '';
      window.setTimeout(() => {
        if (magnet !== m) m.style.removeProperty('transition');
      }, 340);
    };

    const tick = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      const s = target?.closest<HTMLElement>('[data-spot]') ?? null;
      if (s !== spot) {
        clearSpot();
        spot = s;
        s?.classList.add('is-spot');
      }
      if (s) {
        const r = s.getBoundingClientRect();
        s.style.setProperty('--spot-x', `${Math.round(e.clientX - r.left)}px`);
        s.style.setProperty('--spot-y', `${Math.round(e.clientY - r.top)}px`);
      }

      const btn = target?.closest<HTMLElement>('a, button') ?? null;
      const m = btn && isMagnetic(btn) ? btn : null;
      if (m !== magnet) {
        clearMagnet();
        magnet = m;
        if (m) m.style.transition = `${MAGNET_EASE}, background-color 200ms, color 200ms, box-shadow 200ms, scale 200ms`;
      }
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
        m.style.transform = `translate(${(dx * MAGNET_MAX).toFixed(1)}px, ${(dy * MAGNET_MAX * 0.6).toFixed(1)}px)`;
      }

      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((p) => {
        const r = p.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        p.style.transform = `translate3d(${(-x * PARALLAX_MAX).toFixed(1)}px, ${(-y * PARALLAX_MAX * 0.6).toFixed(1)}px, 0)`;
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      clearSpot();
      clearMagnet();
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
      onLeave();
      root.classList.remove('ix-on');
    };
  }, []);

  // Crossed-out prices on the page now: draw the line once each scrolls into view.
  useEffect(() => {
    if (!window.matchMedia(QUERY).matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      },
      { threshold: 0.6 },
    );
    // Only prices being watched lose their line until they draw it; one that
    // renders later (a tab, a popup) keeps the plain line-through.
    const id = window.setTimeout(() => {
      document.querySelectorAll('[data-strike]:not(.is-in)').forEach((el) => {
        el.classList.add('ix-wait');
        io.observe(el);
      });
    }, 50);
    return () => {
      window.clearTimeout(id);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
