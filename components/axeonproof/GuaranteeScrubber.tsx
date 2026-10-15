'use client';

// components/axeonproof/GuaranteeScrubber.tsx
// Drag through the example business's first 90 days: the calls-and-leads
// count climbs from the baseline set at kickoff, the bar fills, and past the
// current day the number turns into "at this pace". Example figures from
// data/proofPage.ts, labelled on screen.
import { useId, useState } from 'react';
import { EXAMPLE } from '@/data/proofPage';
import { GLASS, LABEL } from '@/components/axeonproof/ui';

const { baseline, now, day: TODAY } = EXAMPLE.guarantee;
const DAYS = 90;
const atDay = (d: number) => Math.round(baseline + (now - baseline) * Math.min(1, d / TODAY) + (d > TODAY ? ((now - baseline) * (d - TODAY)) / TODAY : 0));

export function GuaranteeScrubber() {
  const [day, setDay] = useState(TODAY);
  const id = useId();
  const value = atDay(day);
  const projected = day > TODAY;
  const above = value - baseline;
  const bars = Array.from({ length: 18 }, (_, i) => atDay(Math.round(((i + 1) * DAYS) / 18)));
  const max = Math.max(...bars);
  return (
    <div className={`rounded-3xl p-5 sm:p-7 ${GLASS}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <label htmlFor={id} className={LABEL}>
            Drag through the 90 days
          </label>
          <p className="mt-3 text-sm text-neutral-400">
            Day <span className="font-bold text-white tabular-nums">{day}</span> of 90 · {projected ? 'at this pace' : 'measured'}
          </p>
          <p className="mt-1 text-5xl font-black tracking-tight text-white tabular-nums sm:text-6xl">
            {value}
            <span className="ml-3 text-base font-semibold text-neutral-400">calls + leads this month</span>
          </p>
          <p className={`mt-2 text-sm font-semibold ${above > 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
            {above > 0 ? `+${above} above the ${baseline} you started with` : `Starting point: ${baseline} a month, set together at kickoff`}
          </p>
        </div>
        <div className="flex h-24 w-full items-end gap-1 lg:w-80">
          {bars.map((v, i) => {
            const d = Math.round(((i + 1) * DAYS) / 18);
            const on = d <= day;
            return <div key={i} className={`flex-1 rounded-sm transition-colors ${on ? (d > TODAY ? 'bg-blue-400/50' : 'bg-blue-500') : 'bg-white/10'}`} style={{ height: `${(v / max) * 100}%` }} />;
          })}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={DAYS}
        value={day}
        onChange={(e) => setDay(Number(e.target.value))}
        className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-500 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/40 [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-neutral-950"
        aria-valuetext={`Day ${day}: ${value} calls and leads`}
      />
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-neutral-500">
        <span>Kickoff</span>
        <span>Day 30</span>
        <span>Day 60</span>
        <span>Day 90: compared</span>
      </div>
      <p className="mt-4 text-xs text-neutral-500">Example business, example month. Your own line starts the day your site goes live.</p>
    </div>
  );
}
