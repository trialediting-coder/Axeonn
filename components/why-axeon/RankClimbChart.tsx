'use client';

import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

// viewBox 0 0 300 150. Y: 20 = rank #1 (best), 118 = lowest rank (worst).
const AXEON_POINTS: [number, number][] = [
  [20, 116],
  [85, 92],
  [150, 58],
  [215, 30],
  [280, 20],
];

const COMPETITOR_POINTS: [number, number][] = [
  [20, 112],
  [85, 104],
  [150, 96],
  [215, 90],
  [280, 86],
];

function toPath(points: [number, number][]) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

export function RankClimbChart() {
  const [axeonEndX, axeonEndY] = AXEON_POINTS[AXEON_POINTS.length - 1];
  const [compEndX, compEndY] = COMPETITOR_POINTS[COMPETITOR_POINTS.length - 1];

  return (
    <div>
      <div className="text-center text-[11px] font-mono uppercase tracking-wide text-neutral-400 mb-2">
        Google Search Ranking For Your Business
      </div>
      <div className="relative overflow-hidden">
        <svg viewBox="0 0 300 150" className="w-full h-auto">
          <line x1="20" y1="20" x2="280" y2="20" stroke="#404040" strokeDasharray="3 4" strokeWidth="1" />
          <line x1="20" y1="118" x2="280" y2="118" stroke="#404040" strokeDasharray="3 4" strokeWidth="1" />
          <text x="2" y="23" fontSize="9" fill="#737373" fontFamily="monospace">
            #1 spot
          </text>
          <text x="2" y="121" fontSize="9" fill="#737373" fontFamily="monospace">
            Page 2+
          </text>

          {/* Competitor line — modest rise */}
          <motion.path
            d={toPath(COMPETITOR_POINTS)}
            fill="none"
            stroke="#737373"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: 'easeInOut' }}
          />
          <motion.circle
            cx={compEndX}
            cy={compEndY}
            r="4"
            fill="#737373"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2.1, duration: 0.3 }}
          />

          {/* Axeon line — climbs to the top */}
          <motion.path
            d={toPath(AXEON_POINTS)}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.15 }}
          />
          <motion.circle
            cx={axeonEndX}
            cy={axeonEndY}
            r="5.5"
            fill="#2563EB"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2.3, duration: 0.3 }}
          />
        </svg>

        <motion.div
          className="absolute flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap"
          style={{ left: `${(axeonEndX / 300) * 100}%`, top: `${(axeonEndY / 150) * 100}%`, transform: 'translate(-100%, -160%)' }}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 2.5, duration: 0.3 }}
        >
          <TrendingUp size={10} /> #1 in Search
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3">
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
          <span className="w-3 h-0.5 rounded-full bg-neutral-500" /> Typical Agency
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-blue-400">
          <span className="w-3 h-0.5 rounded-full bg-blue-500" /> Axeon Studio
        </span>
      </div>
      <p className="text-center text-[10px] font-mono text-neutral-500 mt-1">
        Search visibility over time — results vary, but this is the direction we build for.
      </p>
    </div>
  );
}
