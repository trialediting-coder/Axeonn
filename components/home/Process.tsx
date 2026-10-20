import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { COMMITMENT_HEADLINE } from '@/data/pricingData';

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
    title: 'Check Your Area',
    desc: 'Tell us your specialty and city. We confirm within one business day whether your 5-mile area is open, then show you what we found about your practice or firm on a short call.',
    duration: 'Before you sign anything',
    deliverables: ['Your area confirmed', 'After-hours call test', 'Website reply speed', 'Reviews vs. the top 3 nearby'],
    outcome: 'A clear picture of where patients and clients slip away today.',
  },
  {
    num: '02',
    title: 'Plan & Agreement',
    desc: 'We map how every call and web inquiry should be answered, booked and followed up for your practice or firm, then put the scope and price in writing.',
    duration: 'One call',
    deliverables: ['Intake flow for your front desk or intake team', 'Booking rules by provider, attorney or service', 'Signed Client Services Agreement'],
    outcome: '$0 setup (normally $3,000) on the 12-month agreement, with the performance commitment written in.',
  },
  {
    num: '03',
    title: 'Build & Go Live',
    desc: 'We build your website and set up missed-call text-back, the 60-second inquiry reply, online booking, the text inbox for your front desk or intake team, and review requests.',
    duration: 'Live within 30 days of your materials',
    deliverables: ['Mockups you review', 'Phone, text and booking set up', 'Intake that never asks for health details'],
    outcome: 'Every call and inquiry answered, starting on launch day. Your first payment starts here, not before.',
  },
  {
    num: '04',
    title: 'Run & Prove It',
    desc: 'AxeonPROOF shows every recovered call and inquiry as it happens. From there we stay on as your growth partner, tuning replies, booking and review requests.',
    duration: 'Your first 90 days, and every month after',
    deliverables: ['Live recovered-inquiry counter', 'Change requests in AxeonPROOF', 'Monthly report'],
    outcome: COMMITMENT_HEADLINE,
  },
];

/**
 * /process: a vertical big-number timeline, every step open (the payoff is the
 * point, so nothing hides behind a tap). Step 04 is the dark slab that carries
 * the performance commitment. Server-rendered and visible by default -- no scroll-triggered
 * opacity, which left the heading faded in captures.
 *
 * Phones (mobile-first, owner 2026-10-19): each step is its own heading-level
 * block sized to fit one screen, with nothing cut; desktop keeps the big numbers.
 */
// Purpose: show the four steps from area check to every inquiry answered, and what each one gives the client.
export function Process() {
  const lastIdx = steps.length - 1;
  return (
    <section id="clear-process" className="w-full py-10 sm:py-16 lg:py-24 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-6xl mx-auto">
        <div className="max-w-4xl mb-6 sm:mb-16">
          <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ FROM AREA CHECK TO EVERY INQUIRY ANSWERED ]
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-neutral-950 font-display tracking-tight leading-[1.05]">
            Four steps. $0 to start.
          </h2>
          <p className="mt-3 sm:mt-5 text-base sm:text-xl text-neutral-600 leading-relaxed max-w-2xl">
            One goal: no patient or client waits until tomorrow for an answer. We work as your partner, so you always know what we&apos;re doing and why.
          </p>
        </div>

        <ol className="relative">
          {steps.map((step, idx) => {
            const isLast = idx === lastIdx;
            if (isLast) {
              return (
                <li key={step.num} className="mt-4 sm:mt-6 rounded-[24px] sm:rounded-[36px] bg-neutral-950 text-white p-5 sm:p-10 lg:p-14">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-12">
                    <div className="lg:col-span-3">
                      <span className="block text-5xl sm:text-8xl lg:text-9xl font-black font-display tracking-tighter text-blue-500 leading-none">
                        {step.num}
                      </span>
                      <span className="mt-3 flex items-start gap-1.5 text-xs font-mono text-neutral-400">
                        <LineIcon>
                          <Clock size={13} />
                        </LineIcon>
                        <span>{step.duration}</span>
                      </span>
                    </div>
                    <div className="lg:col-span-9">
                      <h2 className="text-2xl sm:text-4xl font-bold font-display tracking-tight">{step.title}</h2>
                      <p className="mt-2 sm:mt-3 text-[15px] sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">{step.desc}</p>
                      <ul className="mt-3 sm:mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1.5 sm:gap-y-2 text-sm sm:text-base text-neutral-200">
                        {step.deliverables.map((d) => (
                          <li key={d} className="flex items-center gap-2">
                            <Check size={16} className="text-blue-400 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 sm:mt-8 rounded-2xl bg-blue-600 p-4 sm:p-7">
                        <p className="text-xs font-mono font-bold tracking-widest uppercase text-blue-100">
                          [ THE 90-DAY PERFORMANCE COMMITMENT ]
                        </p>
                        <p className="mt-2 text-base sm:text-2xl font-extrabold font-display tracking-tight leading-snug">
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
                className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 lg:gap-12 py-6 sm:py-10 border-t border-neutral-200"
              >
                <div className="lg:col-span-3">
                  <span className="block text-5xl sm:text-8xl lg:text-9xl font-black font-display tracking-tighter text-neutral-950 leading-none">
                    {step.num}
                  </span>
                  <span className="mt-3 flex items-start gap-1.5 text-xs font-mono text-neutral-500">
                    <LineIcon>
                      <Clock size={13} />
                    </LineIcon>
                    <span>{step.duration}</span>
                  </span>
                </div>
                <div className="lg:col-span-9">
                  <h2 className="text-2xl sm:text-4xl font-bold font-display tracking-tight text-neutral-950">{step.title}</h2>
                  <p className="mt-2 sm:mt-3 text-[15px] sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">{step.desc}</p>
                  <ul className="mt-3 sm:mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1.5 sm:gap-y-2 text-sm sm:text-base text-neutral-800">
                    {step.deliverables.map((d) => (
                      <li key={d} className="flex items-center gap-2">
                        <Check size={16} className="text-blue-600 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 sm:mt-5 text-[15px] sm:text-lg font-semibold text-neutral-950">
                    <span className="text-blue-600">You get:</span> {step.outcome}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
          <Link
            href="/check-your-area"
            className="py-2 inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-700"
          >
            Check if your area is open <ArrowRight size={16} />
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
