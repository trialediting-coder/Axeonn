import Link from 'next/link';

export default function WhyAxeonClosingCTA() {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-5xl mx-auto rounded-[28px] bg-neutral-950 text-white p-8 sm:p-14 text-center">
        <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-4">
          [ THE 90-DAY CUSTOMER GUARANTEE ]
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display leading-tight mb-5">
          Ready for more customers?
        </h2>
        <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
          More calls and leads in your first 90 days than you were getting before, or we keep
          working for free until you do.
        </p>
        <p className="text-xs text-neutral-500 max-w-xl mx-auto mt-3 mb-10">
          Baseline set together on your kickoff call. Applies while you&apos;re on a monthly plan
          and answering new leads within one business day.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/book"
            className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
          >
            Book a Free Strategy Call
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 rounded-full border border-white/25 hover:bg-white/10 text-white font-semibold text-base transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
