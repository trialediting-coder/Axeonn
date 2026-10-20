import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Briefcase,
  Receipt,
  Landmark,
  Server,
  ShieldCheck,
  UserRound,
  Search,
  Rocket,
  Gift,
} from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { PartnerTracks } from './PartnerTracks';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/partners',
  title: 'Partner Program | Axeon Studio',
  description:
    'CPAs, practice consultants and billing firms: refer dental practices, med spas, law firms and CPA firms to Axeon and earn a 15% recurring Technology Advisory Share, disclosed to the client in writing, or pass it to your client as a fee credit.',
});

const APPLY_SUBJECT = 'Axeon partner application';
const APPLY_BODY = [
  'Your name and role:',
  'Business or product name:',
  'Website:',
  'City / area you serve:',
  'Track (Practice Advisor, Referral, Collaboration, or not sure):',
  'Which practices or firms you work with:',
  'How you picture us working together:',
  'Best phone number:',
].join('\n\n');
const APPLY_HREF = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(APPLY_SUBJECT)}&body=${encodeURIComponent(APPLY_BODY)}`;
// The partner brief (PDF) is hand-delivered, so the CTA is an email request.
const BRIEF_HREF = 'mailto:hello@axeonstudio.co?subject=Partner%20brief';

const BUTTON =
  'inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

// The referral loop shown in the hero: who does what, in order.
const LOOP = [
  { icon: UserRound, who: 'You', what: 'Introduce a practice or firm that loses calls after hours' },
  { icon: Search, who: 'Axeon', what: 'Checks their area and walks them through what we find' },
  { icon: Rocket, who: 'Your client', what: 'Every missed call and inquiry answered within 60 seconds' },
  { icon: Gift, who: 'Back to you', what: 'A 15% recurring Technology Advisory Share, or a fee credit for your client' },
];

const ADVISOR_POINTS = [
  'A 15% recurring Technology Advisory Share for as long as the practice or firm stays a client',
  'Disclosed to your client in writing, every time',
  'Or pass the value to your client as a fee credit instead',
  '$0 to start for your clients: nothing due until it is working',
  'Your clients get the 90-day performance commitment',
];

const REFERRAL_POINTS = [
  'A simple way to make intros',
  'A referral reward when the practice or firm pays its first invoice',
  'Updates from the first call to launch',
];

const COLLAB_POINTS = [
  'Handoffs both ways when a client needs what the other does',
  'Your tool set up properly alongside the intake we install',
  'Joint guides or workshops for the practices and firms we both serve',
];

const FITS = [
  {
    icon: Calculator,
    title: 'CPAs and accounting firms',
    description: 'You already advise practice and firm owners on their numbers. Missed new patients and clients are part of those numbers.',
  },
  {
    icon: Briefcase,
    title: 'Practice and law firm consultants',
    description: 'You fix operations for dental offices, med spas, law firms and accounting firms. We handle the front door.',
  },
  {
    icon: Receipt,
    title: 'Billing and back-office firms',
    description: 'Dental and medical billing, legal billing, bookkeeping. You see the schedule gaps first. We help fill them with the inquiries that were going to voicemail.',
  },
  {
    icon: Server,
    title: 'Practice and firm software vendors',
    description: 'Practice and case management, tax workflow, scheduling and phone systems that practices and firms already run on.',
  },
  {
    icon: Landmark,
    title: 'Practice and firm lenders and brokers',
    description: 'Your clients are buying, expanding or transitioning a practice or firm and need new patients or clients to find it.',
  },
  {
    icon: ShieldCheck,
    title: 'IT and managed services for practices and firms',
    description: 'You keep the office tech running. We install the intake on top of it.',
  },
];

const STEPS = [
  { title: 'Request the brief', description: 'We hand-deliver the partner brief with the full terms.' },
  { title: 'Intro call', description: 'A short call to see if we are a good fit and pick the right track.' },
  { title: 'Sign the agreement', description: 'A short, plain-English agreement, including the client disclosure.' },
  { title: 'Introduce a practice or firm', description: 'We check their area and show them what we find.' },
];

const PROMISES = [
  'We only take partners whose clients we are confident we can help, then stay on as their growth partner.',
  'Every introduction gets a fast, personal reply from our team.',
  'The advisory share is always disclosed to your client in writing.',
];

const PARTNER_FAQ = [
  {
    question: 'What is the Technology Advisory Share?',
    answer:
      'CPAs, practice consultants and billing firms who introduce a practice or firm earn a 15% recurring share for as long as it stays a client. It is disclosed to the client in writing. The partner brief spells out exactly how it is calculated and paid.',
  },
  {
    question: 'My professional rules limit referral fees. Can I still partner?',
    answer:
      'Yes. You can pass the full value to your client as a fee credit on their Axeon account instead of taking the share. Either way, the arrangement is disclosed in writing. Check your own professional rules; we will follow whichever option you choose.',
  },
  {
    question: 'What do my clients get?',
    answer:
      "We check whether their specialty's 5-mile area is open, then show them what we found on a short call: an after-hours test call, how fast their website answers an inquiry, and their reviews next to the top 3 nearby competitors. If they partner with us, it is $0 to start and nothing is due until it's working.",
  },
  {
    question: 'Do I have to sell anything?',
    answer:
      'No. Just make the introduction. We run the area check, the call and the setup, and answer every question after that.',
  },
  {
    question: 'Why do you review applications?',
    answer:
      'Your name is on every introduction you make, and we take one practice or firm per specialty within 5 miles. We keep the program small so each introduction gets real attention.',
  },
  {
    question: 'I build software for practices or firms. How does that work?',
    answer:
      'Apply on the Collaboration track. If the practices and firms we serve would benefit from your product, we can recommend it and set it up properly alongside the intake we install, and you can do the same for us.',
  },
];

/**
 * The hero's message as a full-width visual: You -> Axeon -> your client ->
 * back to you. Big numbered stops with arrows between them (stacked on phones).
 */
// Purpose: the referral loop in four steps: you introduce, we check, your client gets answered, the share comes back to you.
function ReferralLoop() {
  const last = LOOP.length - 1;
  return (
    <section aria-labelledby="referral-loop-heading" className="w-full py-10 sm:py-20 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3] border-b border-neutral-200">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-2 sm:mb-3">[ HOW A REFERRAL WORKS ]</p>
        <h2 id="referral-loop-heading" className="text-[28px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.08] max-w-3xl">
          One introduction. It comes back to you.
        </h2>
        <ol className="mt-5 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-0">
          {LOOP.map(({ icon: Icon, who, what }, i) => {
            const isLast = i === last;
            return (
              <li key={who} className="relative flex lg:block items-start gap-4 lg:pr-10">
                <div
                  className={`flex-1 lg:flex-none flex items-center gap-4 sm:block rounded-2xl sm:rounded-3xl p-4 sm:p-7 h-full ${
                    isLast ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25' : 'bg-white border border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between shrink-0">
                    <span
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                        isLast ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <Icon size={22} className="sm:w-[26px] sm:h-[26px]" />
                    </span>
                    <span
                      className={`hidden sm:inline text-4xl font-black font-display tracking-tight ${
                        isLast ? 'text-white/40' : 'text-neutral-200'
                      }`}
                    >
                      0{i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="sm:mt-5 text-lg sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
                      <span className={`sm:hidden mr-1.5 font-mono text-xs ${isLast ? 'text-white/60' : 'text-neutral-400'}`}>0{i + 1}</span>
                      {who}
                    </p>
                    <p className={`mt-0.5 sm:mt-2 text-sm sm:text-base leading-snug ${isLast ? 'text-blue-50' : 'text-neutral-600'}`}>{what}</p>
                  </div>
                </div>
                {!isLast && (
                  <ArrowRight
                    aria-hidden
                    size={28}
                    className="hidden lg:block absolute right-1 top-1/2 -translate-y-1/2 text-blue-600"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default function PartnersPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <BreadcrumbJsonLd items={[{ name: 'Partners', path: '/partners' }]} />

      {/* Hero: Iowa Capitol behind the pitch; the referral loop gets its own band below */}
      {/* Purpose: who the program is for, what partners earn (15% share or fee credit), and the two ways in. */}
      <section className="relative isolate w-full overflow-hidden px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-12 sm:pt-44 sm:pb-28 bg-neutral-950 text-white">
        <Image
          src="/iowa_state_capitol_wide.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[center_30%]"
        />
        {/* Darken the photo enough for the headline, heaviest behind the text */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/50"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 -z-10 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-3 sm:mb-5">[ The Axeon Partner Program ]</p>
            <h1 className="text-[38px] sm:text-6xl xl:text-7xl font-black tracking-[-0.04em] leading-[1.02] sm:leading-[0.98] font-display mb-4 sm:mb-7">
              Send us a practice or firm.
              <br />
              <span className="text-neutral-400">We&apos;ll start by checking their area.</span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-200 leading-relaxed max-w-xl mb-6 sm:mb-10">
              CPAs, practice consultants and billing firms already advise the practices and firms that lose new patients and clients after hours.
              Introduce them to us and earn a 15% recurring Technology Advisory Share, disclosed to the client in writing,
              or pass it to your client as a fee credit.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href={BRIEF_HREF}
                data-track="cta_click"
                data-track-cta="partner_brief_hero"
                className={`${BUTTON} bg-blue-600 hover:bg-blue-500 text-white focus-visible:outline-blue-400`}
              >
                Request the partner brief <ArrowRight size={18} />
              </a>
              <a
                href={APPLY_HREF}
                className={`${BUTTON} border border-white/30 hover:border-white/60 bg-neutral-950/30 text-white focus-visible:outline-blue-400`}
              >
                Apply to partner
              </a>
            </div>
          </div>
        </div>
      </section>

      <ReferralLoop />

      {/* Tracks: the Practice Advisor track leads; referral and collaboration sit beside it */}
      {/* Purpose: the three partner tracks and the terms of each (phones: one track at a time). */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <PartnerTracks
          advisorPoints={ADVISOR_POINTS}
          referralPoints={REFERRAL_POINTS}
          collabPoints={COLLAB_POINTS}
          briefHref={BRIEF_HREF}
          button={BUTTON}
        />
      </section>

      {/* Who fits: a quiet divided list */}
      {/* Purpose: the six kinds of partner we work with (phones: compact two-column chips). */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-5 sm:gap-12">
          <div className="lg:col-span-4">
            <h2 className="text-[28px] sm:text-5xl font-black tracking-[-0.03em] font-display mb-2 sm:mb-4">Who we partner with</h2>
            <p className="text-[15px] sm:text-lg text-neutral-600 leading-relaxed">
              The people practice and firm owners already trust. If your clients run a dental office, med spa, law firm or
              accounting firm, this is for you.
            </p>
          </div>
          <ul className="lg:col-span-8 grid grid-cols-2 gap-2 sm:gap-x-10 sm:gap-y-0 sm:border-t border-neutral-300">
            {FITS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 sm:px-0 sm:py-6 rounded-xl sm:rounded-none bg-white sm:bg-transparent border border-neutral-200 sm:border-0 sm:border-b sm:border-neutral-300">
                <Icon size={22} className="flex-none sm:mt-0.5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-[15px] leading-snug sm:text-lg sm:leading-normal sm:mb-1">{title}</h3>
                  <p className="hidden sm:block text-neutral-600 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works: a real sequence, so it gets numbers */}
      {/* Purpose: the four steps from requesting the brief to your first introduction. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[28px] sm:text-5xl font-black tracking-[-0.03em] font-display mb-5 sm:mb-14">How it works</h2>
          <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-10 lg:gap-8">
            <span aria-hidden className="hidden lg:block absolute top-6 left-6 right-[calc(25%-3rem)] h-px bg-neutral-200" />
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex gap-3.5 sm:block">
                <span className="relative z-10 flex shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-neutral-950 text-white font-black text-base sm:text-lg items-center justify-center ring-4 sm:ring-8 ring-white sm:mb-6">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base sm:text-xl font-bold sm:mb-2">{step.title}</h3>
                  <p className="text-[15px] sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Promise: one statement carries the section */}
      {/* Purpose: the trust promise to partners (we never go around you), with three specifics. */}
      <section className="w-full py-10 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-6 sm:gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-3 sm:mb-5">[ Our promise to partners ]</p>
            <p className="text-[30px] sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[1.05] sm:leading-[1.02] font-display">
              We never go around you to sell to your clients.
            </p>
          </div>
          <ul className="lg:col-span-5 space-y-3 sm:space-y-5 border-l border-neutral-800 pl-5 sm:pl-8">
            {PROMISES.map((item) => (
              <li key={item} className="text-[15px] sm:text-base text-neutral-300 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      {/* Purpose: answer the partner objections (rules on referral fees, selling, review). Collapsed so every question shows at once. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] sm:text-5xl font-black tracking-[-0.03em] font-display mb-4 sm:mb-10">Questions partners ask</h2>
          <FAQAccordion items={PARTNER_FAQ} />
        </div>
      </section>

      {/* CTA */}
      {/* Purpose: the closing ask: request the brief or book an intro call. */}
      <section className="w-full pb-12 sm:pb-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto rounded-3xl sm:rounded-[32px] bg-neutral-950 text-white px-6 py-10 sm:px-14 sm:py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-xl">
            <h2 className="text-[28px] sm:text-4xl font-black tracking-[-0.03em] font-display mb-3">
              Know a practice or firm that loses calls after hours?
            </h2>
            <p className="text-lg text-neutral-300 leading-relaxed">
              Request the partner brief. We hand-deliver it with the full terms and reply to every request.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={BRIEF_HREF}
              data-track="cta_click"
              data-track-cta="partner_brief_closer"
              className={`${BUTTON} bg-blue-600 hover:bg-blue-500 text-white focus-visible:outline-blue-400`}
            >
              Request the partner brief
            </a>
            <Link
              href="/book"
              className={`${BUTTON} border border-white/30 hover:bg-white/10 text-white focus-visible:outline-blue-400`}
            >
              Book an intro call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
