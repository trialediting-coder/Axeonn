import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { ProofScrollFrame } from '@/components/home/ProofScrollFrame';

// Homepage AxeonPROOF section (layout 2026-10-22: what we do -> PROOF -> office
// test). Axeon has no practice results to show yet, so the software that will
// show them is the trust signal: a large, readable screen of the public demo
// (made-up practice, labelled), a tour link and a jump to the form below.
// Real pilot results go here once a practice has a month of numbers (owner OK
// per practice). Empty means the row doesn't render. Never invent one.
const PILOT_RESULTS: { practice: string; result: string }[] = [];

// Purpose: the visitor sees the dashboard they will watch, instead of taking our word for it.
export function HomeProof() {
  return (
    <section
      id="proof"
      aria-labelledby="home-proof-heading"
      data-track-location="home_proof"
      className="w-full py-14 sm:py-24 px-4 sm:px-8 lg:px-14 xl:px-20 bg-neutral-50"
    >
      <div className="w-full max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-blue-600">AxeonPROOF · ROI software</p>
          <h2
            id="home-proof-heading"
            className="mt-3 text-[28px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08]"
          >
            {/* Two fixed lines: the promise, then the answer in blue. */}
            <span className="block">Don&apos;t take our word for&nbsp;it.</span>
            <span className="block text-blue-600">Watch the&nbsp;number.</span>
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-neutral-600 max-w-2xl mx-auto">
            AxeonPROOF is the ROI software every client gets. Every call, inquiry and booking we handle
            shows up on your own dashboard, live, with the revenue it&nbsp;brought&nbsp;in.
          </p>
        </div>

        <figure className="mt-8 sm:mt-14">
          <ProofScrollFrame>
          <Link href="/axeonproof" className="group block max-sm:max-w-[320px] max-sm:mx-auto rounded-2xl sm:rounded-[28px] overflow-hidden border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10">
            {/* Phones get the phone layout of the dashboard, so the numbers stay readable. */}
            <picture>
            <source media="(max-width: 639px)" srcSet="/home/proof-demo-phone.webp" width={780} height={1192} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/proof-demo.webp"
              alt="AxeonPROOF dashboard for an example dental practice: calls, leads, bookings, estimated new patients, map rank and the current phase of the delivery schedule"
              width={2160}
              height={1320}
              loading="lazy"
              decoding="async"
              className="w-full h-auto group-hover:scale-[1.01] motion-safe:transition-transform motion-safe:duration-500"
            />
            </picture>
          </Link>
          </ProofScrollFrame>
          <figcaption className="mt-4 text-center text-xs sm:text-sm text-neutral-500">
            AxeonPROOF, shown with an example practice and made-up numbers.
          </figcaption>
        </figure>

        {PILOT_RESULTS.length > 0 && (
          <ul className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {PILOT_RESULTS.map(({ practice, result }) => (
              <li key={practice} className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-6">
                <p className="text-lg sm:text-xl font-bold text-neutral-950">{result}</p>
                <p className="mt-1 text-sm text-neutral-500">{practice}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Two next steps: see the software, or go straight to the form at the bottom of the page. */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/axeonproof"
            data-track="cta_click"
            data-track-cta="home_proof_tour"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold transition-colors"
          >
            Tour AxeonPROOF <ArrowRight size={16} />
          </Link>
          <a
            href="#contact-section"
            data-track="cta_click"
            data-track-cta="home_proof_form"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/20"
          >
            Get this for your practice <ArrowDown size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
