import Link from 'next/link';
import {
  ArrowRight,
  Handshake,
  Send,
  Puzzle,
  Calculator,
  Camera,
  Printer,
  Landmark,
  Server,
  ShieldCheck,
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

const TRACKS = [
  {
    icon: Send,
    name: 'Referral Partner',
    tagline: 'You know a business that needs a better website.',
    description:
      'Introduce us to a business owner who needs a new site, better search visibility, or a real lead system. We handle the call, the scope, and the build. When they sign, you earn a referral reward.',
    points: [
      'A simple way to introduce clients, plus your own referral link',
      'A referral reward on every client who signs',
      'We keep you in the loop from first call to launch',
      'Your client gets the same care as anyone who finds us directly',
    ],
  },
  {
    icon: Puzzle,
    name: 'Collaboration Partner',
    tagline: 'You serve the same owners we do.',
    description:
      'For software and tool vendors and service businesses whose work fits next to ours. We recommend each other, hand over work that is a better fit for the other, and build integrations or joint offers when it makes sense.',
    points: [
      'Handoffs both ways when a client needs what the other does',
      'Integrations set up properly on the sites we build',
      'Joint offers, guides, or workshops for shared customers',
      'A listing on this page once we are working together',
    ],
  },
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
  { title: 'Partner agreement', description: 'A short, plain-English agreement with the terms in writing.' },
  { title: 'Start sending', description: 'You get your referral link and a partner kit, and we get to work.' },
];

const PROMISES = [
  'We only take partners whose clients we are confident we can help',
  'Every referral gets a fast, personal reply from the founder',
  'We never go around you to sell to your clients',
  'Referral rewards are paid once the client pays their first invoice',
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

export default function PartnersPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <BreadcrumbJsonLd items={[{ name: 'Partners', path: '/partners' }]} />

      {/* Hero */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-36 pb-20 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4 inline-flex items-center gap-2">
            <Handshake size={15} /> Axeon Partner Program
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] font-display mb-6">
            Grow Alongside Us
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-10">
            You already work with small business owners who need a better website, more visibility, and more
            leads. Send them our way, or build something with us for the customers we share.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={APPLY_HREF}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Apply to Partner <ArrowRight size={18} />
            </a>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-base transition-colors"
            >
              Book an Intro Call
            </Link>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">Two Ways to Partner</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            Pick the one that fits how you work. Not sure? Apply anyway and we will figure it out together.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {TRACKS.map(({ icon: Icon, name, tagline, description, points }) => (
              <div key={name} className="rounded-3xl border-2 border-blue-600/20 bg-blue-50/40 p-8 sm:p-10 flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="text-2xl font-bold mb-1">{name}</h3>
                <p className="text-blue-600 font-semibold mb-4">{tagline}</p>
                <p className="text-neutral-600 leading-relaxed mb-6">{description}</p>
                <ul className="space-y-3 mt-auto">
                  {points.map((point) => (
                    <li key={point} className="flex gap-3 text-neutral-800 leading-relaxed">
                      <span className="mt-2 flex-none w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who fits */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">Who We Partner With</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            The best partners are the people business owners already trust. If your customers ever ask who
            should build their website, this is for you.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FITS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-neutral-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works + promises */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">How It Works</h2>
            <ol className="space-y-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-5">
                  <span className="flex-none w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="text-neutral-300 leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-neutral-700 p-8">
              <h3 className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-5">Our Promise to Partners</h3>
              <ul className="space-y-4">
                {PROMISES.map((item) => (
                  <li key={item} className="flex gap-3 text-neutral-200 leading-relaxed">
                    <span className="mt-2 flex-none w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">Questions Partners Ask</h2>
          <FAQAccordion items={PARTNER_FAQ} defaultOpenCount={1} />
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">Built in Iowa</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Let&apos;s Help More Businesses Get Found
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Apply in a few minutes. We reply to every application.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={APPLY_HREF}
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
            >
              Apply to Partner
            </a>
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              Book an Intro Call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
