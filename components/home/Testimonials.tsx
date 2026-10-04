import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Sourced industry data (guardrails: every stat links to a real, checkable source).
// Named Testimonials for its existing importers; it is the "why speed wins" data block.
const STATS = [
  {
    value: '62%',
    title: 'of calls go unanswered',
    body: 'In a study of 85 small businesses, most calls were never picked up. Those callers dial the next company.',
    source: '411 Locals call study',
    href: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
  },
  {
    value: '21×',
    title: 'more likely to win the lead',
    body: 'Leads called back within 5 minutes were about 21 times more likely to qualify than leads called back after 30.',
    source: 'MIT / InsideSales lead response study',
    href: 'https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf',
  },
  {
    value: '97%',
    title: 'read reviews before choosing',
    body: 'Nearly everyone checks your reviews before they call, so the business with visible reviews gets the call.',
    source: 'BrightLocal Local Consumer Review Survey 2026',
    href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
  },
];

const FIXES = [
  'Your phone rings the second a form comes in',
  'Missed calls get a text back right away',
  'Automatic follow-up until they book',
];

export function Testimonials() {
  return (
    <section id="testimonials-section" className="w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20">
      <div className="w-full max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-600 uppercase">The data</p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.1]">
            The fastest answer wins the customer
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {STATS.map((s) => (
            <div key={s.value} className="border-t-2 border-neutral-950 pt-6">
              <p className="text-6xl sm:text-7xl font-black font-display tracking-tight text-neutral-950">{s.value}</p>
              <p className="mt-2 text-lg font-bold text-neutral-950">{s.title}</p>
              <p className="mt-3 text-neutral-600 leading-relaxed">{s.body}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener"
                className="mt-4 inline-block text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2"
              >
                Source: {s.source}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-neutral-950 text-white p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <p className="text-sm font-bold tracking-wide uppercase text-blue-300">How we make sure you answer first</p>
            <ul className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-2 text-lg text-neutral-100">
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
            className="shrink-0 inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-white transition-colors"
          >
            See how it works <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
