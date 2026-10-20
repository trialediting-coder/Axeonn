import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Sourced industry data (guardrails: every stat links to a real, checkable source).
// Named Testimonials for its existing importers; it is the "why speed wins" data block.
interface SourcedStat {
  value: string;
  title: string;
  body: string;
  source: string;
  href: string;
}

export const SPEED_STAT: SourcedStat = {
  value: '21×',
  title: 'more likely to win the lead',
  body: 'Leads called back within 5 minutes were about 21 times more likely to qualify than leads called back after 30.',
  source: 'MIT / InsideSales lead response study',
  href: 'https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf',
};

export const REVIEWS_STAT: SourcedStat = {
  value: '97%',
  title: 'read reviews before choosing',
  body: 'Nearly everyone checks reviews before they call, so the practice or firm with recent, visible reviews gets the call.',
  source: 'BrightLocal Local Consumer Review Survey 2026',
  href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
};

const SUPPORTING = [SPEED_STAT, REVIEWS_STAT];

const FIXES = [
  'Every missed call gets a text back within 60 seconds, 24/7',
  'Every web inquiry gets a first reply within 60 seconds',
  'A review request after every completed appointment',
];

function SourceLink({ stat, dark = false }: { stat: SourcedStat; dark?: boolean }) {
  return (
    <a
      href={stat.href}
      target="_blank"
      rel="noopener"
      className={`py-2 inline-block text-xs underline underline-offset-2 ${
        dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-700'
      }`}
    >
      Source: {stat.source}
    </a>
  );
}

/**
 * One message: the fastest answer wins the patient. The hero figure is our own
 * commitment (60 seconds), not a statistic; the two sourced studies sit beside
 * it as supporting context. No practice-specific stats (owner rule 2026-10-19).
 */
// Purpose: why answering first wins, with our 60-second commitment and two sourced studies.
export function Testimonials() {
  return (
    <section id="testimonials-section" className="w-full py-10 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-6xl mx-auto">
        <p className="eyebrow">WHY SPEED WINS</p>
        <h2 className="mt-2 sm:mt-4 text-[28px] sm:text-5xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.1] max-w-3xl">
          The fastest answer wins the new patient or client
        </h2>

        <div className="mt-5 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-7 border-t-4 border-blue-600 pt-4 sm:pt-6">
            <p className="text-[64px] sm:text-[150px] lg:text-[180px] leading-[0.85] font-black font-display tracking-tighter text-neutral-950">
              60 sec
            </p>
            <p className="mt-2 sm:mt-4 text-xl sm:text-3xl font-bold font-display tracking-tight text-neutral-950 leading-snug">
              to the first reply, day or night
            </p>
            <p className="mt-2 sm:mt-3 text-[15px] sm:text-lg text-neutral-600 leading-relaxed max-w-xl">
              That is our commitment, not a statistic.<span className="hidden sm:inline"> Someone looking for a new dentist, a med spa consult, an injury lawyer or a CPA in tax season who calls after
              hours or fills out a form at 9 PM hears back from you within a minute, with a way to book.</span>
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-8">
            {SUPPORTING.map((s) => (
              <div key={s.value} className="border-t border-neutral-300 pt-3 sm:pt-5">
                <p className="flex items-baseline gap-2 sm:block">
                  <span className="text-3xl sm:text-5xl font-black font-display tracking-tight text-neutral-950">{s.value}</span>
                  <span className="sm:block sm:mt-1 text-base sm:text-lg font-bold text-neutral-950">{s.title}</span>
                </p>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{s.body}</p>
                <div className="sm:mt-3">
                  <SourceLink stat={s} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 sm:mt-16 rounded-3xl bg-neutral-950 text-white p-5 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-8">
          {/* Phones: the band is just the link; the three fixes repeat the 60-second promise above. */}
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-wide uppercase text-blue-300">How AxeonCORE makes sure your practice or firm answers first</p>
            <ul className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-2 text-base sm:text-lg text-neutral-100">
              {FIXES.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/marketing-solutions#intake"
            className="py-2 shrink-0 inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-white transition-colors"
          >
            <span className="sm:hidden">See how AxeonCORE answers first</span>
            <span className="hidden sm:inline">See how it works</span> <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Slim dark band for /pricing, right under the plans: the 21x stat is the
 * reason AxeonCORE exists. One message: answering first wins.
 */
export function SpeedToLeadBand() {
  return (
    <div className="mt-10 sm:mt-20 max-w-6xl mx-auto rounded-[24px] sm:rounded-[36px] bg-neutral-950 text-white px-5 py-7 sm:px-12 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-12 items-center">
      <div className="lg:col-span-5">
        <p className="text-[64px] sm:text-[130px] leading-[0.85] font-black font-display tracking-tighter text-white">
          {SPEED_STAT.value}
        </p>
        <p className="mt-3 text-lg sm:text-xl font-bold text-neutral-200">{SPEED_STAT.title}</p>
      </div>
      <div className="lg:col-span-7">
        <p className="eyebrow eyebrow-dark">WHY AXEONCORE</p>
        <h3 className="mt-2 sm:mt-3 text-[22px] sm:text-4xl font-extrabold font-display tracking-tight leading-[1.12]">
          Answering first wins. That&apos;s what AxeonCORE adds.
        </h3>
        <p className="mt-3 sm:mt-4 text-[15px] sm:text-lg text-neutral-400 leading-relaxed">{SPEED_STAT.body}</p>
        <ul className="mt-3 sm:mt-5 flex flex-col gap-1.5 sm:gap-2 text-[15px] sm:text-base text-neutral-100">
          {FIXES.map((f) => (
            <li key={f} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-2 sm:mt-5">
          <SourceLink stat={SPEED_STAT} dark />
        </div>
      </div>
    </div>
  );
}
