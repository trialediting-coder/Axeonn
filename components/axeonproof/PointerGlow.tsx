'use client';

// components/axeonproof/PointerGlow.tsx
// The cursor effect on /axeonproof: flow lines. A handful of thin ribbons in
// cyan, blue and violet chase the pointer on springs of different stiffness,
// so they swing out and curl behind it while it moves, then shrink back into
// the cursor and fade away when it stops (nothing is left sitting on the page
// at rest). Drawn on one canvas fixed to the viewport, under the content,
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
    const ribbons: Ribbon[] = SPECS.map((s) => ({ ...s, head: { x: 0, y: 0, vx: 0, vy: 0 }, pts: Array.from({ length: POINTS }, () => ({ x: 0, y: 0 })) }));

    const snap = () => {
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
      let spread = 0;
      ribbons.forEach((r) => {
        const hd = r.head;
        hd.vx = (hd.vx + (x - hd.x) * r.stiffness * dt) * Math.pow(r.damping, f);
        hd.vy = (hd.vy + (y - hd.y) * r.stiffness * dt) * Math.pow(r.damping, f);
        hd.x += hd.vx * dt;
        hd.y += hd.vy * dt;
        const pts = r.pts;
        pts[0].x = hd.x;
        pts[0].y = hd.y;
        const k = 1 - Math.pow(1 - r.follow, f);
        for (let i = 1; i < pts.length; i++) {
          pts[i].x += (pts[i - 1].x - pts[i].x) * k;
          pts[i].y += (pts[i - 1].y - pts[i].y) * k;
        }
        const tail = pts[pts.length - 1];
        spread = Math.max(spread, Math.hypot(tail.x - x, tail.y - y), Math.hypot(hd.vx, hd.vy) * 0.05);
      });
      // Visible while the lines are stretched out; fades once they have
      // gathered back into the cursor.
      const target = shown ? Math.min(1, spread / 60) : 0;
      energy += (target - energy) * (1 - Math.pow(1 - (target > energy ? 0.35 : 0.08), f));
      draw();
      if (energy > 0.01 || spread > 0.5) raf = requestAnimationFrame(tick);
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
