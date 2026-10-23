'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

// The homepage AxeonPROOF screenshot tilts back like a screen lying on a desk
// and stands up flat as it scrolls into view (owner, 2026-10-22: "make the
// dashboard react when you scroll onto it"). Tied to scroll position, not a
// one-shot animation, so it reverses when you scroll back up. Reduced motion
// gets the flat screenshot.
export function ProofScrollFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const glow = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  if (reduce) return <div ref={ref}>{children}</div>;

  return (
    <div ref={ref} className="relative isolate [perspective:1600px]">
      {/* A blue glow fades in behind the screen as it stands up. */}
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className="absolute inset-x-[8%] top-[10%] bottom-0 -z-10 rounded-full bg-blue-500/30 blur-[90px]"
      />
      <motion.div style={{ rotateX, scale, y, transformOrigin: 'center bottom' }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
