import Link from 'next/link';

// The performance commitment is stated once, in the band above. This is just the ask.
export default function WhyAxeonClosingCTA() {
  return (
    <section className="w-full py-20 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">[ NEXT STEP ]</div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display leading-tight text-neutral-950 mb-5">
          Find out what happens after hours
        </h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-10">
          We call your practice or firm after hours, check how fast your website answers an inquiry, and compare your reviews to
          the top 3 nearby competitors. You get a short video walkthrough. No charge.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <Link
            href="/audit"
            data-track="cta_click"
            data-track-cta="audit_why_axeon"
            className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-colors"
          >
            Get your free after-hours audit
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 rounded-full border border-neutral-300 hover:bg-neutral-50 text-neutral-900 font-semibold text-base transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
