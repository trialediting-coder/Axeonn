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
    title: 'Free After-Hours Audit',
    desc: 'We call your practice or firm after hours, time how fast your website answers an inquiry, and compare your reviews to the top 3 competitors near you.',
    duration: 'Before you sign anything',
    deliverables: ['After-hours call test', 'Inquiry response time', 'Reviews vs. the top 3 nearby', 'Mobile speed'],
    outcome: 'A short video walkthrough of where patients and clients slip away today.',
  },
  {
    num: '02',
    title: 'Plan & Agreement',
    desc: 'We map how every call and web inquiry should be answered, booked and followed up for your practice or firm, then put the scope and price in writing.',
    duration: 'One call',
    deliverables: ['Intake flow for your front desk or intake team', 'Booking rules by provider, attorney or service', 'Signed Client Services Agreement'],
    outcome: 'A plan and a price, with the performance commitment written in.',
  },
  {
    num: '03',
    title: 'Build & Go Live',
    desc: 'We build your website and set up missed-call text-back, the 60-second inquiry reply, online booking, the text inbox for your front desk or intake team, and review requests.',
    duration: 'Live within 30 days of your materials',
    deliverables: ['Mockups you review', 'Phone, text and booking set up', 'Intake that never asks for health details'],
    outcome: 'Every call and inquiry answered, starting on launch day.',
  },
  {
    num: '04',
    title: 'Run & Prove It',
    desc: 'AxeonPROOF shows every recovered call and inquiry as it happens. We keep tuning the replies, booking and review requests from there.',
    duration: 'Your first 90 days, and every month after',
    deliverables: ['Live recovered-inquiry counter', 'Change requests in AxeonPROOF', 'Monthly report'],
    outcome: guaranteeSentence,
  },
];

/**
 * /process: a vertical big-number timeline, every step open (the payoff is the
 * point, so nothing hides behind a tap). Step 04 is the dark slab that carries
 * the performance commitment. Server-rendered and visible by default -- no scroll-triggered
 * opacity, which left the heading faded in captures.
 */
export function Process() {
  const lastIdx = steps.length - 1;
  return (
    <section id="clear-process" className="w-full py-16 lg:py-24 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-6xl mx-auto">
        <div className="max-w-4xl mb-12 sm:mb-16">
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ FROM FREE AUDIT TO EVERY INQUIRY ANSWERED ]
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.05]">
            Four steps. The first one is free.
          </h2>
          <p className="mt-5 text-base sm:text-xl text-neutral-600 leading-relaxed max-w-2xl">
            One goal: no patient or client waits until tomorrow for an answer. You always know what we&apos;re doing and why.
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
                          [ THE 90-DAY PERFORMANCE COMMITMENT ]
                        </p>
                        <p className="mt-2 text-lg sm:text-2xl font-extrabold font-display tracking-tight leading-snug">
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

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
          <Link
            href="/audit"
            className="py-2 inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-700"
          >
            Get your free after-hours audit <ArrowRight size={16} />
          </Link>
          <Link
            href="/book"
            className="py-2 inline-flex items-center gap-2 text-base font-semibold text-neutral-700 hover:text-neutral-950"
          >
            Book a call <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
