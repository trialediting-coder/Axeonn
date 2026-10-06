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

export const UNANSWERED_STAT: SourcedStat = {
  value: '62%',
  title: 'of calls go unanswered',
  body: 'In a study of 85 small businesses, most calls were never picked up. Those callers dial the next company.',
  source: '411 Locals call study',
  href: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
};

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
  body: 'Nearly everyone checks your reviews before they call, so the business with visible reviews gets the call.',
  source: 'BrightLocal Local Consumer Review Survey 2026',
  href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
};

const SUPPORTING = [SPEED_STAT, REVIEWS_STAT];

const FIXES = [
  'Your phone rings the second a form comes in',
  'Missed calls get a text back right away',
  'Automatic follow-up until they book',
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
 * One message: most calls go unanswered, and the fastest answer wins. 62% is
 * the hero number; 21x and 97% sit beside it as smaller supporting proof.
 */
export function Testimonials() {
  return (
    <section id="testimonials-section" className="w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-6xl mx-auto">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ WHY SPEED WINS ]</p>
        <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.1] max-w-3xl">
          The fastest answer wins the customer
        </h2>

        <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-7 border-t-4 border-blue-600 pt-6">
            <p className="text-[96px] sm:text-[150px] lg:text-[180px] leading-[0.85] font-black font-display tracking-tighter text-neutral-950">
              {UNANSWERED_STAT.value}
            </p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold font-display tracking-tight text-neutral-950 leading-snug">
              {UNANSWERED_STAT.title}
            </p>
            <p className="mt-3 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl">{UNANSWERED_STAT.body}</p>
            <div className="mt-4">
              <SourceLink stat={UNANSWERED_STAT} />
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8">
            {SUPPORTING.map((s) => (
              <div key={s.value} className="border-t border-neutral-300 pt-5">
                <p className="text-4xl sm:text-5xl font-black font-display tracking-tight text-neutral-950">{s.value}</p>
                <p className="mt-1 text-lg font-bold text-neutral-950">{s.title}</p>
                <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">{s.body}</p>
                <div className="mt-3">
                  <SourceLink stat={s} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl bg-neutral-950 text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <p className="text-sm font-bold tracking-wide uppercase text-blue-300">How AxeonCORE makes sure you answer first</p>
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
            href="/marketing-solutions/lead-generation"
            className="py-2 shrink-0 inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-white transition-colors"
          >
            See how it works <ArrowRight size={16} />
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
    <div className="mt-16 sm:mt-20 max-w-6xl mx-auto rounded-[28px] sm:rounded-[36px] bg-neutral-950 text-white px-6 py-10 sm:px-12 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <div className="lg:col-span-5">
        <p className="text-[88px] sm:text-[130px] leading-[0.85] font-black font-display tracking-tighter text-white">
          {SPEED_STAT.value}
        </p>
        <p className="mt-3 text-lg sm:text-xl font-bold text-neutral-200">{SPEED_STAT.title}</p>
      </div>
      <div className="lg:col-span-7">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ WHY AXEONCORE ]</p>
        <h3 className="mt-3 text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-[1.12]">
          Answering first wins. That&apos;s what AxeonCORE adds.
        </h3>
        <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">{SPEED_STAT.body}</p>
        <ul className="mt-5 flex flex-col gap-2 text-base text-neutral-100">
          {FIXES.map((f) => (
            <li key={f} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <SourceLink stat={SPEED_STAT} dark />
        </div>
      </div>
    </div>
  );
}
