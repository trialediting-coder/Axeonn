import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, PhoneCall, Timer, Star } from 'lucide-react';

// Homepage proof section (repositioning 2026-10-19, simplified 2026-10-20 after
// the owner found the two text-heavy cards "cluttered" and "a little tacky").
// Axeon has no practice clients yet, so this never shows a client result: the
// left card is what we test on the visitor's own practice, the right card is an
// example AxeonPROOF screen (made-up practice, labelled). Real past builds live
// on /work as "Recent builds".
const AUDIT_STEPS = [
  { icon: PhoneCall, title: 'We call after hours, like a new patient or client would' },
  { icon: Timer, title: 'We time the reply to your website form' },
  { icon: Star, title: 'We put your reviews next to the top 3 nearby' },
];

// Purpose: the visitor sees what we test on their own practice or firm, and what they get to watch after.
export function HomeProof() {
  return (
    <section
      id="proof"
      aria-labelledby="home-proof-heading"
      data-track-location="home_proof"
      className="w-full py-10 sm:py-28 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="w-full max-w-[1180px] mx-auto">
        <h2
          id="home-proof-heading"
          className="text-center text-[28px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08]"
        >
          Don&apos;t take our word for&nbsp;it.
        </h2>

        <div className="mt-6 sm:mt-14 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Before: we test their practice */}
          <div className="rounded-[24px] sm:rounded-[28px] bg-neutral-950 text-white p-6 sm:p-10 flex flex-col">
            <h3 className="text-xl sm:text-3xl font-extrabold font-display tracking-tight">First, we test your&nbsp;office.</h3>
            <ul className="mt-5 sm:mt-8 space-y-3.5 sm:space-y-5">
              {AUDIT_STEPS.map(({ icon: Icon, title }) => (
                <li key={title} className="flex gap-3 text-[15px] sm:text-lg text-neutral-200">
                  <LineIcon>
                    <Icon size={20} className="text-blue-400" aria-hidden="true" />
                  </LineIcon>
                  {title}
                </li>
              ))}
            </ul>
            <div className="mt-6 sm:mt-auto sm:pt-10">
              <Link
                href="/check-your-area"
                data-track="cta_click"
                data-track-cta="home_proof_area_check"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
              >
                Check if your area is open <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          {/* After: they watch it work */}
          <div className="rounded-[24px] sm:rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-10 flex flex-col">
            <h3 className="text-xl sm:text-3xl font-extrabold font-display tracking-tight text-neutral-950">Then you watch it&nbsp;work.</h3>
            <figure className="mt-5 sm:mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/proof-example.webp"
                alt="AxeonPROOF dashboard for an example dental practice: inquiries, estimated new patients, visits and the current phase of the delivery schedule"
                width={1600}
                height={778}
                loading="lazy"
                decoding="async"
                className="w-full h-auto rounded-2xl border border-neutral-200"
              />
              <figcaption className="mt-2 text-xs text-neutral-500">AxeonPROOF, shown with an example practice.</figcaption>
            </figure>
            <div className="mt-6 sm:mt-auto sm:pt-8">
              <Link
                href="/axeonproof"
                className="inline-flex items-center gap-2 font-bold text-neutral-950 hover:text-blue-600 transition-colors"
              >
                Tour AxeonPROOF <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
