'use client';

import React, { useEffect, useRef } from 'react';

export const InteractiveFluidAura: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Track mouse with smooth spring lerp
    let targetX = width * 0.45;
    let targetY = height * 0.35;
    let currentX = targetX;
    let currentY = targetY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetX = width * 0.45;
      targetY = height * 0.35;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          width = canvas.width = newWidth;
          height = canvas.height = newHeight;
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.008;

      // Lerp mouse
      const lerpSpeed = prefersReducedMotion ? 0.02 : 0.06;
      currentX += (targetX - currentX) * lerpSpeed;
      currentY += (targetY - currentY) * lerpSpeed;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle, organic luminous fluid blobs on the clean white canvas
      // Blob 1: Interactive cursor fluid light in royal sapphire
      const r1 = Math.min(width, height) * 0.38;
      const grad1 = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, r1);
      grad1.addColorStop(0, 'rgba(37, 99, 235, 0.09)');
      grad1.addColorStop(0.45, 'rgba(59, 130, 246, 0.05)');
      grad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(currentX, currentY, r1, 0, Math.PI * 2);
      ctx.fill();

      // Blob 2: Counter-balancing ambient indigo wave
      const waveX = width * 0.75 + Math.sin(time * 0.8) * 60;
      const waveY = height * 0.65 + Math.cos(time * 0.6) * 50;
      const r2 = Math.min(width, height) * 0.45;
      const grad2 = ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, r2);
      grad2.addColorStop(0, 'rgba(79, 70, 229, 0.06)');
      grad2.addColorStop(0.5, 'rgba(147, 197, 253, 0.03)');
      grad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(waveX, waveY, r2, 0, Math.PI * 2);
      ctx.fill();

      // Blob 3: Top-left subtle atmospheric lift
      const topX = width * 0.15 + Math.cos(time * 0.5) * 40;
      const topY = height * 0.15 + Math.sin(time * 0.7) * 30;
      const r3 = Math.min(width, height) * 0.32;
      const grad3 = ctx.createRadialGradient(topX, topY, 0, topX, topY, r3);
      grad3.addColorStop(0, 'rgba(2, 132, 199, 0.05)');
      grad3.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.arc(topX, topY, r3, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
    >
      {/* Dynamic Canvas Interaction (Zero dots, pure fluid ambient light) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Subtle organic light sheen */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-50/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
