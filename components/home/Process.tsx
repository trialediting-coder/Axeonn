import Link from 'next/link';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { guaranteeSentence } from '@/data/pricingData';

interface ProcessStep {
  num: string;
  title: string;
  desc: string;
  duration: string;
  deliverables: string[];
  outcome: string;
}

const steps: ProcessStep[] = [
  {
    num: '01',
    title: 'Discovery',
    desc: 'We look at how customers find you today, where they slip away, and set your baseline: the calls and leads you get now.',
    duration: 'Kicks off right away',
    deliverables: ['Goals & baseline set together', 'Search & competitor review', 'Walkthrough of your site & lead flow'],
    outcome: 'You know exactly where customers are slipping away.',
  },
  {
    num: '02',
    title: 'Strategy',
    desc: 'We plan how you get found on Google, chosen over the competition, and booked without chasing.',
    duration: 'Fast-tracked',
    deliverables: ['Pages & message plan', 'Lead flow from first click to booked job', 'Follow-up plan so no lead goes cold'],
    outcome: 'A plan built around more customers, not more pages.',
  },
  {
    num: '03',
    title: 'Design & Build',
    desc: 'We design and build a site that makes customers pick you, on every phone.',
    duration: 'Rapid turnaround',
    deliverables: ['Clickable mockups you review', 'Pages written to turn visitors into calls', 'Instant lead alerts set up'],
    outcome: 'A site you are proud of, approved with your feedback.',
  },
  {
    num: '04',
    title: 'Launch & 90 Days',
    desc: "We launch, track every call and lead from day one, and keep improving until you're getting more than before.",
    duration: 'Your first 90 days',
    deliverables: ['Launch & search setup', 'Every call and lead tracked', 'Monthly calls & leads report'],
    outcome: guaranteeSentence,
  },
];

/**
 * /process: a vertical big-number timeline, every step open (the payoff is the
 * point, so nothing hides behind a tap). Step 04 is the dark slab that carries
 * the guarantee. Server-rendered and visible by default -- no scroll-triggered
 * opacity, which left the heading faded in captures.
 */
export function Process() {
  const lastIdx = steps.length - 1;
  return (
    <section id="clear-process" className="w-full py-16 lg:py-24 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-6xl mx-auto">
        <div className="max-w-4xl mb-12 sm:mb-16">
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ FROM FIRST CALL TO MORE CUSTOMERS ]
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.05]">
            Four steps. The last one lasts 90 days.
          </h2>
          <p className="mt-5 text-base sm:text-xl text-neutral-600 leading-relaxed max-w-2xl">
            One goal: more calls, more booked jobs, more customers. You always know what we&apos;re doing and why.
          </p>
        </div>

        <ol className="relative">
          {steps.map((step, idx) => {
            const isLast = idx === lastIdx;
            if (isLast) {
              return (
                <li key={step.num} className="mt-4 sm:mt-6 rounded-[28px] sm:rounded-[36px] bg-neutral-950 text-white p-6 sm:p-10 lg:p-14">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                    <div className="lg:col-span-3">
                      <span className="block text-7xl sm:text-8xl lg:text-9xl font-black font-display tracking-tighter text-blue-500 leading-none">
                        {step.num}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                        <Clock size={13} /> {step.duration}
                      </span>
                    </div>
                    <div className="lg:col-span-9">
                      <h3 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">{step.title}</h3>
                      <p className="mt-3 text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">{step.desc}</p>
                      <ul className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base text-neutral-200">
                        {step.deliverables.map((d) => (
                          <li key={d} className="flex items-center gap-2">
                            <Check size={16} className="text-blue-400 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 rounded-2xl bg-blue-600 p-5 sm:p-7">
                        <p className="text-xs font-mono font-bold tracking-widest uppercase text-blue-100">
                          [ THE 90-DAY CUSTOMER GUARANTEE ]
                        </p>
                        <p className="mt-2 text-xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
                          {step.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            }
            return (
              <li
                key={step.num}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 py-8 sm:py-10 border-t border-neutral-200"
              >
                <div className="lg:col-span-3">
                  <span className="block text-7xl sm:text-8xl lg:text-9xl font-black font-display tracking-tighter text-neutral-950 leading-none">
                    {step.num}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500">
                    <Clock size={13} /> {step.duration}
                  </span>
                </div>
                <div className="lg:col-span-9">
                  <h3 className="text-2xl sm:text-4xl font-bold font-display tracking-tight text-neutral-950">{step.title}</h3>
                  <p className="mt-3 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">{step.desc}</p>
                  <ul className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base text-neutral-800">
                    {step.deliverables.map((d) => (
                      <li key={d} className="flex items-center gap-2">
                        <Check size={16} className="text-blue-600 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-base sm:text-lg font-semibold text-neutral-950">
                    <span className="text-blue-600">You get:</span> {step.outcome}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <Link
          href="/book"
          className="mt-10 inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-700"
        >
          Book your free strategy call <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
