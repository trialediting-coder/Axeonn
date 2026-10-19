'use client';

// components/axeonproof/GuaranteeScrubber.tsx
// Drag through the demo practice's first 90 days of the performance commitment:
// inquiries answered within 60 seconds and review requests sent climb day by
// day, and past the current day the numbers turn into "at this pace". Example
// figures for a fictional practice from data/proofPage.ts, labelled on screen.
import { useId, useState } from 'react';
import { EXAMPLE } from '@/data/proofPage';
import { GLASS, LABEL } from '@/components/axeonproof/ui';

const { inquiries, repliedIn60, reviewRequests, medianReplySeconds, day: TODAY } = EXAMPLE.commitment;
const DAYS = 90;
const scale = (total: number, d: number) => Math.round((total * d) / TODAY);

export function GuaranteeScrubber() {
  const [day, setDay] = useState(TODAY);
  const id = useId();
  const answered = scale(repliedIn60, day);
  const asked = scale(reviewRequests, day);
  const projected = day > TODAY;
  const rate = Math.round((repliedIn60 / inquiries) * 100);
  const bars = Array.from({ length: 18 }, (_, i) => scale(repliedIn60, Math.round(((i + 1) * DAYS) / 18)));
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
            {answered}
            <span className="ml-3 text-base font-semibold text-neutral-400">inquiries answered within 60 seconds</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-400">
            {rate}% inside 60 seconds · median reply {medianReplySeconds}s · {asked} review requests sent
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
        aria-valuetext={`Day ${day}: ${answered} inquiries answered within 60 seconds`}
      />
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-neutral-500">
        <span>Go-live</span>
        <span>Day 30</span>
        <span>Day 60</span>
        <span>Day 90: checked</span>
      </div>
      <p className="mt-4 text-xs text-neutral-500">{EXAMPLE.demoLabel}, example figures. Your own line starts the day you go live.</p>
    </div>
  );
}
