import Link from 'next/link';
import { Check, X } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  typical: string;
  axeon: string;
}

// The lead row, shown as a giant before/after.
const LEAD = {
  typical: 'A website, a report, hours billed',
  axeon: 'Customers',
  axeonDetail: 'Calls and leads tracked from day one, backed by our 90-day customer guarantee.',
};

// Supporting rows, deliberately smaller so the lead row carries the message.
const ROWS: ComparisonRow[] = [
  {
    dimension: 'Pricing',
    typical: 'A large up-front build fee, plus separate CRM and marketing retainers.',
    axeon: '$99 to start, then a flat $149, $299, or $999 a month, with the CRM pipeline, follow-up, and AxeonPROOF included from AxeonCORE up',
  },
  {
    dimension: 'Timeline',
    typical: 'Weeks to months, scope often expands along the way',
    axeon: 'Fixed scope and a fast turnaround — live in a fraction of the usual time, no surprise invoices',
  },
  {
    dimension: 'AI & Automation',
    typical: 'One generic AI tool, deployed the same way for every client',
    axeon: 'A CRM Pipeline built around your actual lead-to-close workflow',
  },
  {
    dimension: 'Communication',
    typical: 'Account managers and handoffs before you reach the builder',
    axeon: 'Direct access to the person building your system',
  },
  {
    dimension: 'Reporting',
    typical: 'Clicks, impressions, and rankings',
    axeon: 'A monthly report on calls, leads, and exactly where each one came from',
  },
];

// Server-rendered and visible by default: no scroll-triggered opacity, which
// left this section blank in full-page captures.
export function Comparison() {
  return (
    <section id="comparison" className="w-full py-20 sm:py-32 lg:py-40 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-4xl">
          <span className="block text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
            [ WHY OWNERS SWITCH ]
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08]">
            You Pay for Customers, Not Deliverables
          </h2>
        </div>

        {/* The one comparison that matters: what you actually pay for. */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 rounded-[28px] sm:rounded-[36px] overflow-hidden border border-neutral-200">
          <div className="bg-neutral-100 p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase">
              Typical agency · you pay for
            </p>
            <p className="mt-4 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.08] text-neutral-400 line-through decoration-2 decoration-neutral-400">
              {LEAD.typical}
            </p>
          </div>
          <div className="bg-blue-600 text-white p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-100 uppercase">Axeon · you pay for</p>
            <p className="mt-4 sm:mt-6 text-5xl sm:text-7xl lg:text-8xl font-black font-display tracking-tight leading-none">
              {LEAD.axeon}
            </p>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-blue-50 leading-relaxed max-w-md">{LEAD.axeonDetail}</p>
          </div>
        </div>

        {/* Everything else, in small type. */}
        <dl className="mt-8 sm:mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
          {ROWS.map((row) => (
            <div
              key={row.dimension}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-8 gap-y-1.5 py-4 sm:py-5 text-sm sm:text-base"
            >
              <dt className="font-bold text-neutral-950">{row.dimension}</dt>
              <dd className="flex items-start gap-2 text-neutral-500">
                <X size={16} className="shrink-0 mt-0.5 sm:mt-1 text-neutral-400" aria-label="Typical agency" />
                <span>{row.typical}</span>
              </dd>
              <dd className="flex items-start gap-2 text-neutral-900 font-medium">
                <Check size={16} className="shrink-0 mt-0.5 sm:mt-1 text-blue-600" aria-label="Axeon Studio" />
                <span>{row.axeon}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/book"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
          >
            Book a Free Strategy Call
          </Link>
          <Link
            href="/why-axeon"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full border border-neutral-300 text-neutral-900 font-semibold hover:bg-neutral-50 transition-colors"
          >
            See the full comparison
          </Link>
        </div>
      </div>
    </section>
  );
}
