'use client';

// components/axeonproof/PointerGlow.tsx
// The cursor effect on /axeonproof: flow lines. A handful of thin ribbons in
// cyan, blue and violet chase the pointer on springs of different stiffness,
// so they swing out and curl behind it while it moves. When it rests they
// keep flowing, each circling the cursor in its own loose loop, over a faint
// halo. Drawn on one canvas fixed to the viewport, under the content,
// additive over the black. Mouse and pen only; nothing on touch or under
// reduced motion. Easing is time-based so it feels the same on any screen.
import { useEffect, useRef, useState } from 'react';

type Ribbon = {
  color: [number, number, number];
  stiffness: number; // spring pull on the head, per second squared
  damping: number; // velocity kept per 60 Hz frame
  follow: number; // how fast each tail point catches the one ahead, per 60 Hz frame
  width: number;
  head: { x: number; y: number; vx: number; vy: number };
  pts: { x: number; y: number }[];
};

const POINTS = 28;
const SPECS: Omit<Ribbon, 'head' | 'pts'>[] = [
  { color: [34, 211, 238], stiffness: 420, damping: 0.8, follow: 0.62, width: 3 },
  { color: [56, 189, 248], stiffness: 300, damping: 0.83, follow: 0.56, width: 2.2 },
  { color: [37, 99, 235], stiffness: 230, damping: 0.86, follow: 0.52, width: 3.4 },
  { color: [99, 102, 241], stiffness: 170, damping: 0.88, follow: 0.48, width: 3.2 },
  { color: [139, 92, 246], stiffness: 120, damping: 0.9, follow: 0.44, width: 2.4 },
  { color: [168, 85, 247], stiffness: 85, damping: 0.915, follow: 0.4, width: 2 },
];

// Where each line circles while the pointer rests (px, radians per second).
const ORBITS = [
  { radius: 46, speed: 2.4, phase: 0 },
  { radius: 70, speed: -1.9, phase: 1.1 },
  { radius: 58, speed: 1.6, phase: 2.3 },
  { radius: 88, speed: -1.35, phase: 3.4 },
  { radius: 76, speed: 1.15, phase: 4.4 },
  { radius: 100, speed: -0.95, phase: 5.3 },
];
const HALO = 170; // glow radius, px

export function PointerGlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let x = 0;
    let y = 0;
    let shown = false;
    let energy = 0; // 0..1, how visible the lines are; rises with movement, decays at rest
    let raf = 0;
    let last = 0;
    let clock = 0;
    let idle = 0;
    let lastMove = 0;
    const halo = { x: 0, y: 0 };
    const ribbons: Ribbon[] = SPECS.map((s) => ({ ...s, head: { x: 0, y: 0, vx: 0, vy: 0 }, pts: Array.from({ length: POINTS }, () => ({ x: 0, y: 0 })) }));

    const snap = () => {
      halo.x = x;
      halo.y = y;
      ribbons.forEach((r) => {
        r.head = { x, y, vx: 0, vy: 0 };
        r.pts.forEach((p) => {
          p.x = x;
          p.y = y;
        });
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (energy < 0.01) return;
      ctx.globalCompositeOperation = 'lighter';
      // Subtle glow: a soft blue-violet halo around the cursor, under the lines.
      const g = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, HALO);
      g.addColorStop(0, `rgba(59,130,246,${(0.16 * energy).toFixed(3)})`);
      g.addColorStop(0.45, `rgba(124,58,237,${(0.07 * energy).toFixed(3)})`);
      g.addColorStop(1, 'rgba(124,58,237,0)');
      ctx.fillStyle = g;
      ctx.fillRect(halo.x - HALO, halo.y - HALO, HALO * 2, HALO * 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ribbons.forEach((r) => {
        const [cr, cg, cb] = r.color;
        const pts = r.pts;
        // Taper: draw segment by segment, thick and bright at the head, thin
        // and faint at the tail. A wide faint pass under a thin bright one
        // gives the glow without a costly canvas blur.
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < pts.length - 1; i++) {
            const t = 1 - i / pts.length;
            const a = pts[i - 1];
            const b = pts[i];
            const c = pts[i + 1];
            ctx.beginPath();
            ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
            ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
            const alpha = energy * t * t * (pass === 0 ? 0.22 : 0.95);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
            ctx.lineWidth = (pass === 0 ? r.width * 5 : r.width) * (0.35 + 0.65 * t);
            ctx.stroke();
          }
        }
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(now - (last || now - 16.7), 50) / 1000;
      last = now;
      const f = dt * 60; // frames' worth of time at 60 Hz
      clock += dt;
      // Idle: ramps up from 0.25 s after the pointer stops, gone the moment
      // it moves. While idle each line chases a point circling the cursor
      // at its own radius, speed and direction, so the lines keep flowing in
      // loose loops around it instead of disappearing.
      const still = now - lastMove;
      idle += ((still > 250 ? 1 : 0) - idle) * (1 - Math.pow(1 - (still > 250 ? 0.03 : 0.25), f));
      // The halo trails the pointer a little, like the lines.
      const hk = 1 - Math.pow(1 - 0.12, f);
      halo.x += (x - halo.x) * hk;
      halo.y += (y - halo.y) * hk;
      let spread = 0;
      ribbons.forEach((r, j) => {
        const hd = r.head;
        const orbit = ORBITS[j];
        const ang = clock * orbit.speed + orbit.phase;
        const rad = orbit.radius * (1 + 0.22 * Math.sin(clock * 0.9 + j * 1.7)) * idle;
        const tx = x + Math.cos(ang) * rad;
        const ty = y + Math.sin(ang) * rad * 0.8;
        hd.vx = (hd.vx + (tx - hd.x) * r.stiffness * dt) * Math.pow(r.damping, f);
        hd.vy = (hd.vy + (ty - hd.y) * r.stiffness * dt) * Math.pow(r.damping, f);
        hd.x += hd.vx * dt;
        hd.y += hd.vy * dt;
        const pts = r.pts;
        pts[0].x = hd.x;
        pts[0].y = hd.y;
        // Tails hang back further at rest so the loops draw long arcs.
        const k = 1 - Math.pow(1 - r.follow * (1 - 0.82 * idle), f);
        for (let i = 1; i < pts.length; i++) {
          pts[i].x += (pts[i - 1].x - pts[i].x) * k;
          pts[i].y += (pts[i - 1].y - pts[i].y) * k;
        }
        const tail = pts[pts.length - 1];
        spread = Math.max(spread, Math.hypot(tail.x - x, tail.y - y), Math.hypot(hd.vx, hd.vy) * 0.05);
      });
      // Bright while the lines stretch out in motion, a calmer level while
      // they circle at rest, gone when the pointer leaves the window.
      const target = shown ? Math.max(Math.min(1, spread / 60), idle * 0.6) : 0;
      energy += (target - energy) * (1 - Math.pow(1 - (target > energy ? 0.35 : 0.08), f));
      draw();
      if (shown || energy > 0.01 || spread > 0.5) raf = requestAnimationFrame(tick);
      else {
        last = 0;
        ctx.clearRect(0, 0, w, h);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      x = e.clientX;
      y = e.clientY;
      lastMove = performance.now();
      if (!shown) {
        // First move, or back from outside the window: start on the pointer.
        snap();
        shown = true;
      }
      kick();
    };
    const leave = () => {
      shown = false;
      kick();
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) leave();
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', out);
    window.addEventListener('blur', leave);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', out);
      window.removeEventListener('blur', leave);
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [on]);

  if (!on) return null;
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
