import { ShieldCheck } from 'lucide-react';
import type { Niche } from '@/data/nichesData';

// Same Get Found -> Get Chosen -> Get Booked steps as the /go ad pages, so the
// story is identical wherever someone lands. Lead-system pieces are AxeonCORE.
const STEPS = [
  {
    step: 'Step 1',
    title: 'Get found',
    body: 'Show up on Google, on the map, and in AI answers when people nearby search for what you do.',
  },
  {
    step: 'Step 2',
    title: 'Get chosen',
    body: 'A fast site with your reviews up front that makes you the obvious pick.',
  },
  {
    step: 'Step 3',
    title: 'Get booked',
    body: 'Tap-to-call and a quote form on every page. On AxeonCORE, AI chat and automatic follow-up answer every lead in seconds.',
  },
];

export function NicheSystem({ niche }: { niche: Niche }) {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ THE SYSTEM ]</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 mb-10">
          How we get you more {niche.customerNoun}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl bg-white border border-neutral-200 p-7">
              <p className="text-sm font-semibold text-neutral-400">{s.step}</p>
              <h3 className="mt-1 text-2xl font-black font-display tracking-tight text-neutral-950">{s.title}</h3>
              <p className="mt-3 text-neutral-700 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-4 rounded-2xl bg-neutral-950 text-white p-6 sm:p-7">
          <ShieldCheck size={28} className="shrink-0 text-blue-400" />
          <div>
            <p className="font-bold">90-Day Customer Guarantee</p>
            <p className="mt-1 text-neutral-300 leading-relaxed">
              More calls and leads in your first 90 days than you were getting before, or we keep working for free until
              you do.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
