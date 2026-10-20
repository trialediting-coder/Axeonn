import Link from 'next/link';
import { ArrowRight, ArrowUpRight, PhoneCall, Timer, Star, Gauge, MessageSquareText, FileBarChart } from 'lucide-react';

// Homepage proof section (repositioning 2026-10-19). Axeon has no practice
// clients yet, so this never shows a client result, testimonial or stat. It
// shows two things a practice owner can check for themselves: what we find
// about their own practice (shown on the call after an area check), and AxeonPROOF, the portal
// every client gets. Real past builds live on /work as "Recent builds".
const AUDIT_STEPS = [
  { icon: PhoneCall, title: 'We call after hours', body: 'The way a new patient or client would, and note what they hear.' },
  { icon: Timer, title: 'We time your website', body: 'We send an inquiry through your site and clock the first reply.' },
  { icon: Star, title: 'We compare your reviews', body: 'Your Google reviews next to the top 3 nearby competitors.' },
];

const PORTAL = [
  { icon: Gauge, title: 'Recovered-inquiry counter', body: 'Every missed call and form that got a 60-second reply, live.' },
  { icon: MessageSquareText, title: 'Change requests', body: 'Ask for an update to your site and track it to done.' },
  { icon: FileBarChart, title: 'Monthly report', body: 'Replies, bookings and review requests, in plain numbers.' },
];

export function HomeProof() {
  return (
    <section
      id="proof"
      aria-labelledby="home-proof-heading"
      data-track-location="home_proof"
      className="w-full py-24 sm:py-32 px-4 sm:px-8 lg:px-14 xl:px-20"
    >
      <div className="w-full max-w-[1180px] mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-[#2563eb] uppercase">Proof you can check</p>
          <h2
            id="home-proof-heading"
            className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-neutral-950 leading-[1.08] text-balance"
          >
            Don&apos;t take our word for it. Test your own practice or firm.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed">
            Check your area and we&apos;ll show you what happens today when someone calls or writes in. Once we&apos;re
            partners, you see every reply and booking in your own portal.
          </p>
        </div>

        <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* What we find about their practice */}
          <div className="rounded-[28px] bg-neutral-950 text-white p-7 sm:p-10 flex flex-col">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">[ What we show you on the call ]</p>
            <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
              What your next new patient or client experiences today, tested on your own practice or firm.
            </h3>
            <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {AUDIT_STEPS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4 py-4">
                  <Icon size={20} className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true" />
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-0.5 text-sm text-neutral-400 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 lg:mt-auto lg:pt-8">
              <Link
                href="/check-your-area"
                data-track="cta_click"
                data-track-cta="home_proof_area_check"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-600/25"
              >
                Check if your area is open <ArrowUpRight size={16} />
              </Link>
              <p className="mt-3 text-xs text-neutral-500">$0 to start. Nothing due until it&apos;s working.</p>
            </div>
          </div>

          {/* The portal */}
          <div className="rounded-[28px] border border-neutral-200 bg-white p-7 sm:p-10 flex flex-col">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ AxeonPROOF ]</p>
            <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug text-neutral-950">
              The client portal every practice and firm gets. You see the work, not a summary we wrote.
            </h3>
            <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {PORTAL.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4 py-4">
                  <Icon size={20} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-neutral-950">{title}</p>
                    <p className="mt-0.5 text-sm text-neutral-600 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 lg:mt-auto lg:pt-8">
              <Link
                href="/axeonproof"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-neutral-300 text-neutral-950 font-bold hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Tour AxeonPROOF <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm sm:text-base text-neutral-500">
          Want to see sites we have built?{' '}
          <Link href="/work" className="inline-block py-2 font-semibold text-neutral-800 hover:text-blue-600 underline underline-offset-4">
            Recent builds
          </Link>
        </p>
      </div>
    </section>
  );
}
