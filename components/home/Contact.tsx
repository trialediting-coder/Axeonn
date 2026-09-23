'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BookingCalendar } from '@/components/booking/BookingCalendar';

export interface ContactProps {
  onBookAudit?: () => void;
}

export function Contact({ onBookAudit }: ContactProps) {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  // Interactive High-Performance Clean Wave / Constellation Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let running = false;
    let visibility: IntersectionObserver | null = null;
    let width = 0;
    let height = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      radius: number;
      alpha: number;
      hue: number;
    }

    let particles: Particle[] = [];

    const initParticles = () => {
      const isMobile = width < 768;
      const count = isMobile ? 36 : 72;
      particles = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 1.8 + 1.2,
          alpha: Math.random() * 0.45 + 0.25,
          hue: Math.random() > 0.4 ? 217 : 240, // Electric blue to subtle indigo
        });
      }
    };

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle wave harmonics across background
      ctx.lineWidth = 1;
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const waveOffset = w * 1.8;
        const waveY = height * (0.35 + w * 0.18);
        const waveAlpha = 0.04 + w * 0.02;

        ctx.strokeStyle = `rgba(59, 130, 246, ${waveAlpha})`;
        for (let x = 0; x <= width; x += 16) {
          const y = waveY + Math.sin(x * 0.004 + time + waveOffset) * 28 + Math.cos(x * 0.002 - time * 0.7) * 16;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Update & Draw Particles and Connecting Constellation Lines
      const maxConnectDist = width < 768 ? 95 : 125;
      const mouseDistThreshold = 140;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic harmonic drift
        p.x += p.vx + Math.sin(time + i) * 0.15;
        p.y += p.vy + Math.cos(time + i * 0.8) * 0.15;

        // Bounce boundaries softly
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
        }

        // Mouse interaction: gentle magnetic displacement
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseDistThreshold && dist > 0) {
            const force = (1 - dist / mouseDistThreshold) * 2.2;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
          }
        }

        // Connecting lines to neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(96, 165, 250, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.alpha})`;
        ctx.fill();
      }

      if (running) animationFrameId = requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      animationFrameId = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
    };

    // One static frame for reduced-motion users; otherwise only animate while
    // the section is actually on screen (the neighbour loop is O(n²) per frame).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render();
    } else if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      visibility = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0.05 }
      );
      visibility.observe(containerRef.current);
    } else {
      start();
    }

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      visibility?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <section
      ref={containerRef}
      id="contact-section"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full py-16 sm:py-20 lg:py-24 px-0 bg-[#07090E] relative flex flex-col justify-center overflow-hidden rounded-none border-y border-neutral-800/60 select-none"
    >
      {/* Dynamic Animated Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Modern Gradient Ambient Glow Blobs */}
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-24 -left-24 w-[600px] sm:w-[750px] h-[600px] sm:h-[750px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none z-0"
      />

      <motion.div
        animate={{
          x: [0, -50, 50, 0],
          y: [0, 50, -30, 0],
          scale: [0.95, 1.1, 1, 0.95],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        className="absolute -bottom-32 -right-32 w-[650px] sm:w-[800px] h-[650px] sm:h-[800px] rounded-full bg-indigo-600/12 blur-[150px] pointer-events-none z-0"
      />

      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [0.9, 1.05, 0.9],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] rounded-full bg-cyan-600/8 blur-[160px] pointer-events-none z-0"
      />

      {/* Elegant Radial Dot Grid Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)] pointer-events-none z-0" />

      {/* Subtle Top & Bottom Vignettes for Smooth Flow */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07090E] to-transparent pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07090E] to-transparent pointer-events-none z-0" />

      {/* Content Container (Spans full screen without outer card radius) */}
      <div className="relative z-10 w-full max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-8 lg:px-14 xl:px-20 py-8 lg:py-12 select-text">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-start lg:items-center">
          {/* Left Column: Clean White Card with Embedded Booking Calendar */}
          <motion.div
            id="contact-card-container"
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 xl:col-span-7 bg-white text-neutral-950 rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 lg:p-10 shadow-2xl border border-neutral-100 max-w-3xl w-full mx-auto lg:mx-0"
          >
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-1">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-neutral-950 leading-tight">
                    Let&apos;s Talk About Your Project
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 mt-1.5">
                    Pick a day and time that works for you. We&apos;ll hop on a quick call to chat about your goals.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full w-fit">
                  Central Time (US)
                </span>
              </div>

              {/* On phones the calendar is two screens tall; give callers the fast path first */}
              <a
                href="tel:+15154938017"
                className="sm:hidden flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-neutral-300 text-neutral-900 font-semibold text-base active:bg-neutral-50"
              >
                Prefer to call? (515) 493-8017
              </a>

              {/* Real-time booking calendar embed */}
              <div className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-2xs">
                <BookingCalendar theme="light" minHeight="720px" />
              </div>
            </div>
          </motion.div>

          {/* Right Column: High-Impact Typography & Direct Contact Details */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center text-white"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display tracking-tight text-white leading-[1.08]">
              Let&apos;s talk about <br className="hidden sm:inline" />
              growing your business
            </h2>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-neutral-300 max-w-xl leading-relaxed font-normal">
              New site, better rankings, or automation that actually catches your leads — tell us what&apos;s slowing you down and we&apos;ll map out the fix.
            </p>

            {/* Direct Contact Details */}
            <div className="mt-10 sm:mt-12 space-y-6">
              <div>
                <div className="text-xs sm:text-sm font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Email:
                </div>
                <a
                  href="mailto:hello@axeonstudio.co"
                  className="mt-1.5 inline-block text-xl sm:text-2xl font-medium text-white hover:text-blue-400 transition-colors"
                >
                  hello@axeonstudio.co
                </a>
              </div>

              <div>
                <div className="text-xs sm:text-sm font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Phone:
                </div>
                <a
                  href="tel:+15154938017"
                  className="mt-1.5 inline-block text-xl sm:text-2xl font-medium text-white hover:text-blue-400 transition-colors font-mono"
                >
                  +1 (515) 493-8017
                </a>
                <p className="text-sm text-neutral-400 mt-1.5">
                  Typically responding within one business day.
                </p>
              </div>
            </div>

            {/* Book a Strategy Call Pill Button */}
            <div className="mt-10">
              <a
                href="tel:+15154938017"
                className="inline-flex items-center gap-3 px-9 py-4.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base sm:text-lg transition-all cursor-pointer shadow-xl hover:shadow-blue-500/25 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span>Call (515) 493-8017</span>
                <ArrowRight size={20} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
