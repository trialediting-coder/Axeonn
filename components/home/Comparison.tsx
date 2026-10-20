import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  typical: string;
  axeon: string;
  /** Phone copy: same facts, fewer words. */
  axeonShort?: string;
}

// The lead row, shown as a giant before/after.
const LEAD = {
  typical: 'A website, a report, hours billed',
  axeon: 'Answered',
  axeonDetail:
    'Every missed call and web inquiry gets a reply within 60 seconds, 24/7, backed by our 90-day performance commitment.',
};

// Supporting rows, deliberately smaller so the lead row carries the message.
const ROWS: ComparisonRow[] = [
  {
    dimension: 'Pricing',
    typical: 'A large build fee up front, plus separate software, phone and marketing bills every month.',
    axeon: 'AxeonCORE from $799/mo on a 12-month agreement. $0 setup (normally $3,000) and nothing is due until it is working.',
    axeonShort: "From $799/mo, 12-month agreement. $0 setup, nothing due until it's working.",
  },
  {
    dimension: 'After hours',
    typical: 'Calls go to voicemail and web forms wait until the front desk or intake team is back',
    axeon: 'A text reply within 60 seconds and a link to book, any hour of the day',
  },
  {
    dimension: 'Reviews',
    typical: 'Someone remembers to ask, sometimes',
    axeon: 'An automatic review request after every completed appointment',
  },
  {
    dimension: 'Communication',
    typical: 'Account managers and handoffs before you reach the builder',
    axeon: 'Direct access to the person building your system',
  },
  {
    dimension: 'Reporting',
    typical: 'Clicks, impressions, and rankings',
    axeon: 'AxeonPROOF: every recovered call and inquiry, live, plus a monthly report',
  },
];

// Server-rendered and visible by default: no scroll-triggered opacity, which
// left this section blank in full-page captures.
//
// Phones: the lead before/after sits side by side, and the rows show only the
// Axeon side next to a narrow label (the "typical" side is the struck-out lead
// above), so the whole comparison reads in one screen.
//
// Purpose: the visitor sees that they pay for answered inquiries, not deliverables.
export function Comparison() {
  return (
    <section id="comparison" className="w-full py-10 sm:py-32 lg:py-40 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-4xl">
          <span className="eyebrow hidden sm:block mb-4">
            WHY PRACTICES AND FIRMS SWITCH
          </span>
          <h2 className="text-[28px] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.1] sm:leading-[1.08]">
            You Pay for Every Inquiry Answered, Not Deliverables
          </h2>
        </div>

        {/* The one comparison that matters: what you actually pay for. */}
        <div className="mt-5 sm:mt-14 grid grid-cols-2 md:grid-rows-[auto_1fr] rounded-[20px] sm:rounded-[36px] overflow-hidden border border-neutral-200">
          <div className="bg-neutral-100 p-4 sm:p-10 lg:p-12 md:row-span-2">
            <p className="eyebrow text-neutral-500">
              Typical agency<span className="hidden sm:inline"> · you pay for</span>
            </p>
            <p className="mt-2 sm:mt-6 text-lg sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.15] sm:leading-[1.08] text-neutral-400 line-through decoration-2 decoration-neutral-400">
              {LEAD.typical}
            </p>
          </div>
          <div className="bg-blue-600 text-white p-4 sm:p-10 lg:p-12 md:pb-0 lg:pb-0">
            <p className="eyebrow eyebrow-onblue">
              Axeon<span className="hidden sm:inline"> · you pay for</span>
            </p>
            <p className="mt-2 sm:mt-6 text-[32px] sm:text-7xl lg:text-8xl font-black font-display tracking-tight leading-none">
              {LEAD.axeon}
            </p>
          </div>
          <p className="hidden md:block bg-blue-600 text-white px-10 lg:px-12 pt-6 pb-10 lg:pb-12 text-xl text-blue-50 leading-relaxed">
            <span className="block max-w-md">{LEAD.axeonDetail}</span>
          </p>
        </div>

        {/* Everything else, in small type. */}
        <dl className="mt-4 sm:mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
          {ROWS.map((row) => (
            <div
              key={row.dimension}
              className="grid grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 sm:gap-x-8 gap-y-1.5 py-2.5 sm:py-5 text-sm sm:text-base"
            >
              <dt className="text-[13px] sm:text-base font-bold text-neutral-950">{row.dimension}</dt>
              <dd className="hidden sm:flex items-start gap-2 text-neutral-500">
                <LineIcon>
                  <X size={16} className="text-neutral-400" aria-label="Typical agency" />
                </LineIcon>
                <span>{row.typical}</span>
              </dd>
              <dd className="flex items-start gap-2 text-neutral-900 font-medium leading-snug sm:leading-normal">
                <LineIcon className="hidden sm:flex">
                  <Check size={16} className="text-blue-600" aria-label="Axeon Studio" />
                </LineIcon>
                <span>
                  <span className="sm:hidden">{row.axeonShort ?? row.axeon}</span>
                  <span className="hidden sm:inline">{row.axeon}</span>
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 sm:mt-10 flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
          <Link
            href="/check-your-area"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
          >
            Check if your area is open
          </Link>
          <Link
            href="/why-axeon"
            className="w-full sm:w-auto text-center py-3 sm:px-8 sm:py-3.5 rounded-full sm:border sm:border-neutral-300 text-neutral-900 font-semibold underline underline-offset-4 decoration-neutral-300 sm:no-underline hover:bg-neutral-50 transition-colors"
          >
            See the full comparison
          </Link>
        </div>
      </div>
    </section>
  );
}
