import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Send,
  Puzzle,
  Calculator,
  Camera,
  Printer,
  Landmark,
  Server,
  ShieldCheck,
  UserRound,
  Hammer,
  Rocket,
  Gift,
} from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/partners',
  title: 'Partner Program | Axeon Studio',
  description:
    'Partner with Axeon Studio. Refer Iowa businesses that need a better website and earn referral rewards, or collaborate with us as a software vendor or service business that serves the same owners.',
});

const APPLY_SUBJECT = 'Axeon partner application';
const APPLY_BODY = [
  'Your name and role:',
  'Business or product name:',
  'Website:',
  'City / area you serve:',
  'Track (Referral, Collaboration, or not sure):',
  'Who your customers are:',
  'How you picture us working together:',
  'Best phone number:',
].join('\n\n');
const APPLY_HREF = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(APPLY_SUBJECT)}&body=${encodeURIComponent(APPLY_BODY)}`;

const BUTTON =
  'inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';

// The referral loop shown in the hero: who does what, in order.
const LOOP = [
  { icon: UserRound, who: 'You', what: 'Introduce a business that needs a better website' },
  { icon: Hammer, who: 'Axeon', what: 'Runs the call, scopes it, and builds the site' },
  { icon: Rocket, who: 'Your client', what: 'Launches a site that brings in leads' },
  { icon: Gift, who: 'Back to you', what: 'A referral reward once they pay their first invoice' },
];

const REFERRAL_POINTS = [
  'Your own referral link and a simple way to make intros',
  'A referral reward on every client who signs',
  'Updates from first call to launch',
  'Your client gets the same care as anyone who finds us directly',
];

const COLLAB_POINTS = [
  'Handoffs both ways when a client needs what the other does',
  'Your tool set up properly on the sites we build',
  'Joint offers, guides, or workshops for shared customers',
  'A listing on this page once we are working together',
];

const FITS = [
  {
    icon: Server,
    title: 'Software and tools',
    description: 'Booking, POS, CRM, payments, reviews, and other tools small businesses run on.',
  },
  {
    icon: Calculator,
    title: 'Accountants and bookkeepers',
    description: 'You see new businesses first, often before they have a website.',
  },
  {
    icon: Landmark,
    title: 'Lenders and insurance agents',
    description: 'Your clients are investing in their business and want it to look the part.',
  },
  {
    icon: Camera,
    title: 'Photographers and creatives',
    description: 'Your work deserves a website that shows it off, and we need great visuals.',
  },
  {
    icon: Printer,
    title: 'Sign, print, and branding shops',
    description: 'You handle how a business looks in person. We handle how it looks online.',
  },
  {
    icon: ShieldCheck,
    title: 'IT and managed services',
    description: 'You keep the tech running. We build the site and the lead system on top of it.',
  },
];

const STEPS = [
  { title: 'Apply', description: 'Tell us who you are, who you serve, and how you picture working together.' },
  { title: 'Intro call', description: 'A short call to see if we are a good fit and pick the right track.' },
  { title: 'Sign the agreement', description: 'A short, plain-English agreement with the terms in writing.' },
  { title: 'Start sending', description: 'You get your referral link and a partner kit, and we get to work.' },
];

const PROMISES = [
  'We only take partners whose clients we are confident we can help.',
  'Every referral gets a fast, personal reply from the founder.',
  'Referral rewards are paid once the client pays their first invoice.',
];

const PARTNER_FAQ = [
  {
    question: 'How much do referral partners earn?',
    answer:
      'Every client you refer who signs earns you a referral reward. The exact terms depend on the track and are spelled out in your partner agreement, so we share them on the intro call after you apply.',
  },
  {
    question: 'Who can apply?',
    answer:
      'Businesses and software vendors that work with small business owners, especially in Iowa. If your customers ever ask you who should build their website, you are a good fit.',
  },
  {
    question: 'Why do you review applications?',
    answer:
      'Your name is on every introduction you make, and ours is on every site we build. We keep the program small so each referral gets real attention and both of us look good.',
  },
  {
    question: 'Do I have to sell anything?',
    answer:
      'No. Just make the introduction. We run the discovery call, write the scope, and handle every question after that.',
  },
  {
    question: 'Do you white-label your work for other agencies?',
    answer:
      'Not right now. We build under the Axeon name. If you run an agency and we cover something you do not, the Collaboration track is the way to work together.',
  },
  {
    question: 'I build software for small businesses. How does that work?',
    answer:
      'Apply on the Collaboration track. If our clients would benefit from your product, we can recommend it, set it up properly on the sites we build, and send business your way, and you can do the same for us.',
  },
];

function ReferralLoop() {
  const last = LOOP.length - 1;
  return (
    <ol className="relative rounded-3xl bg-white text-neutral-950 p-5 sm:p-6 shadow-2xl shadow-black/40 space-y-4">
      {/* Connector running through the step icons */}
      <span aria-hidden className="absolute left-[42px] sm:left-[46px] top-10 bottom-10 w-px bg-neutral-200" />
      {LOOP.map(({ icon: Icon, who, what }, i) => (
        <li key={who} className="relative flex gap-4 items-center">
          <span
            className={`relative z-10 flex-none w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white ${
              i === last ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Icon size={18} />
          </span>
          <div>
            <p className="font-bold leading-tight">{who}</p>
            <p className="text-sm text-neutral-500 leading-snug">{what}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PartnersPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <BreadcrumbJsonLd items={[{ name: 'Partners', path: '/partners' }]} />

      {/* Hero: Iowa Capitol behind the pitch, with the referral loop alongside */}
      <section className="relative isolate w-full overflow-hidden px-6 sm:px-10 lg:px-16 xl:px-24 pt-36 pb-20 sm:pt-44 sm:pb-28 bg-neutral-950 text-white">
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
            <p className="text-blue-400 font-semibold mb-5">The Axeon Partner Program</p>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-[-0.04em] leading-[0.98] font-display mb-7">
              Send us a business.
              <br />
              <span className="text-neutral-400">We&apos;ll take it from there.</span>
            </h1>
            <p className="text-lg text-neutral-200 leading-relaxed max-w-xl mb-10">
              You already work with small business owners who need a better website, more visibility, and more
              leads. Introduce them to us and earn a reward, or team up with us to serve the customers we share.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={APPLY_HREF}
                className={`${BUTTON} bg-blue-600 hover:bg-blue-500 text-white focus-visible:outline-blue-400`}
              >
                Apply to partner <ArrowRight size={18} />
              </a>
              <Link
                href="/book"
                className={`${BUTTON} border border-white/30 hover:border-white/60 bg-neutral-950/30 text-white focus-visible:outline-blue-400`}
              >
                Book an intro call
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 w-full max-w-md lg:ml-auto">
            <ReferralLoop />
          </div>
        </div>
      </section>

      {/* Tracks: two deliberately different panels */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] font-display mb-4">Two ways to partner</h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Pick the one that fits how you work. Not sure? Apply anyway and we will figure it out together.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-[32px] bg-blue-600 text-white p-8 sm:p-12 flex flex-col">
              <Send size={28} className="mb-8 text-blue-200" />
              <h3 className="text-3xl font-black tracking-tight font-display mb-2">Referral Partner</h3>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                You know a business that needs a better website. Make the intro, we handle everything else, and you
                earn a reward when they sign.
              </p>
              <ul className="mt-auto divide-y divide-white/15 border-t border-white/15">
                {REFERRAL_POINTS.map((point) => (
                  <li key={point} className="py-3.5 text-white/95">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[32px] border-2 border-neutral-200 p-8 sm:p-12 flex flex-col">
              <Puzzle size={28} className="mb-8 text-blue-600" />
              <h3 className="text-3xl font-black tracking-tight font-display mb-2">Collaboration Partner</h3>
              <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
                You serve the same owners we do, with software or a service that fits next to ours. We recommend
                each other and build things together when it makes sense.
              </p>
              <ul className="mt-auto divide-y divide-neutral-200 border-t border-neutral-200">
                {COLLAB_POINTS.map((point) => (
                  <li key={point} className="py-3.5 text-neutral-800">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who fits: a quiet divided list */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] font-display mb-4">Who we partner with</h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              The people business owners already trust. If your customers ever ask who should build their website,
              this is for you.
            </p>
          </div>
          <ul className="lg:col-span-8 grid sm:grid-cols-2 gap-x-10 border-t border-neutral-300">
            {FITS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4 py-6 border-b border-neutral-300">
                <Icon size={22} className="flex-none mt-0.5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-lg mb-1">{title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works: a real sequence, so it gets numbers */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] font-display mb-14">How it works</h2>
          <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            <span aria-hidden className="hidden lg:block absolute top-6 left-6 right-[calc(25%-3rem)] h-px bg-neutral-200" />
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="relative z-10 flex w-12 h-12 rounded-full bg-neutral-950 text-white font-black text-lg items-center justify-center ring-8 ring-white mb-6">
                  {i + 1}
                </span>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Promise: one statement carries the section */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="text-blue-400 font-semibold mb-5">Our promise to partners</p>
            <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[1.02] font-display">
              We never go around you to sell to your clients.
            </p>
          </div>
          <ul className="lg:col-span-5 space-y-5 border-l border-neutral-800 pl-8">
            {PROMISES.map((item) => (
              <li key={item} className="text-neutral-300 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] font-display mb-10">Questions partners ask</h2>
          <FAQAccordion items={PARTNER_FAQ} defaultOpenCount={1} />
        </div>
      </section>

      {/* CTA */}
      <section className="w-full pb-20 sm:pb-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-blue-600 text-white px-8 py-14 sm:px-14 sm:py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] font-display mb-3">
              Know a business that needs us?
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">Apply in a few minutes. We reply to every application.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={APPLY_HREF}
              className={`${BUTTON} bg-white text-blue-700 hover:bg-blue-50 focus-visible:outline-white`}
            >
              Apply to partner
            </a>
            <Link
              href="/book"
              className={`${BUTTON} border border-white/40 hover:bg-white/10 text-white focus-visible:outline-white`}
            >
              Book an intro call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
