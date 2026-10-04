import Link from 'next/link';
import { ArrowRight, MapPin, PhoneCall, Clapperboard, Handshake } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { niches } from '@/data/nichesData';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { Testimonials } from '@/components/home/Testimonials';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS, METRO_CITIES, serviceJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/des-moines-web-design',
  title: 'Des Moines Web Design & Marketing Agency | Axeon Studio',
  description:
    'Des Moines web design, local SEO, and ads that get you more customers, from one West Des Moines team. Plans from $2,800, backed by a 90-day guarantee.',
});

const webDesignServiceJsonLd = serviceJsonLd({
  path: '/des-moines-web-design',
  serviceType: 'Web Design & Digital Marketing',
  name: 'Axeon Studio — Des Moines Web Design & Digital Marketing',
  description:
    'Custom websites, local SEO/AEO/GEO, AI chat & scheduling, lead-generation pipelines, and on-site video for businesses across the Des Moines metro.',
});

const TEL_HREF = `tel:${BUSINESS.telephone.replace(/-/g, '')}`;

// One system, three jobs. Lead-system pieces are AxeonCORE; ads are an add-on scoped on a call.
const SYSTEM = [
  {
    step: 'Get found',
    title: 'SEO & Ads',
    description:
      'Show up on Google, the map, and AI answers when people across the metro search for what you do. Google & Meta Ads are an add-on, scoped on your call.',
    href: '/marketing-solutions/seo',
  },
  {
    step: 'Get chosen',
    title: 'Website & Video',
    description:
      'A fast, custom site with your reviews up front, plus on-site video with AxeonCORE, so you look like the obvious pick.',
    href: '/marketing-solutions/website',
  },
  {
    step: 'Get booked',
    title: 'AI Chat & Lead Capture',
    description:
      'Tap-to-call and a quote form on every page. On AxeonCORE, AI chat and automatic follow-up answer every lead in seconds.',
    href: '/marketing-solutions/ai-chat-scheduling',
  },
];

const LOCAL_REASONS = [
  {
    icon: PhoneCall,
    title: 'You call the person who built it',
    description:
      'Axeon is a West Des Moines studio, not a national agency with an Iowa landing page. The founder answers the phone, sits in on your strategy call, and builds the site himself.',
  },
  {
    icon: Clapperboard,
    title: 'On-site video shot at your location',
    description:
      'AxeonCORE includes a half-day shoot at your shop, office, or clinic anywhere in the metro — a hero film for the site, vertical cuts for social, and a photo set. No out-of-town crew, no travel fees.',
  },
  {
    icon: MapPin,
    title: 'Built for how Des Moines actually searches',
    description:
      'Suburb-level intent matters here — a Waukee homeowner and a downtown Des Moines law firm search differently. Every build ships with local SEO, structured data, and AI-answer-engine visibility tuned to the metro, not a generic "near me" template.',
  },
  {
    icon: Handshake,
    title: 'Proven right here in the metro',
    description:
      'A-1 Auto Detailing in Pleasant Hill went from page 2 to #1 on Google for "Pleasant Hill auto detailing" after we rebuilt their site. Published pricing, and every plan is backed by our 90-day customer guarantee.',
  },
];

const LOCAL_FAQ = [
  {
    question: 'Do you only work with businesses in Des Moines?',
    answer:
      'No, but the metro is home base. We are located in West Des Moines and serve the whole Des Moines area — including Ankeny, Urbandale, Waukee, Clive, Johnston, Grimes, Altoona, and Norwalk — in person. We also build for businesses across Iowa and the rest of the United States remotely; the only piece that requires proximity is the on-site video shoot.',
  },
  {
    question: 'Can we meet in person?',
    answer:
      'Yes. Strategy calls are usually a video call because it is faster for everyone, but if you are in the Des Moines metro and want to meet at your location, that is easy to arrange — and it happens anyway for the on-site videography included in AxeonCORE.',
  },
  {
    question: 'How much does a website cost in Des Moines?',
    answer:
      'Our pricing is published. Essentials is $2,800 to set up, then from $284/mo. AxeonCORE is $5,800 to set up, then from $574/mo, and adds a Custom CRM Pipeline, AI chat & online scheduling, automated follow-up, and a half-day on-site video shoot. Both are backed by our 90-day customer guarantee.',
  },
  {
    question: 'Will my business show up when people search on Google or ask ChatGPT?',
    answer:
      'That is the point of every build. Search engine optimization, answer engine optimization, and generative engine optimization are included by default — technical SEO, local structured data, and machine-readable content so your business is findable on Google Maps and Search and citable by AI assistants like ChatGPT, Perplexity, and Gemini.',
  },
  {
    question: 'What industries do you build for in the Des Moines area?',
    answer:
      'Our purpose-built systems cover dental practices, med spas, HVAC, roofing, law firms, accounting firms, home remodeling, real estate, landscaping, and auto detailing — and we build for any local small business that needs a site that produces calls, not just a brochure.',
  },
];

const localFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LOCAL_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function DesMoinesWebDesignPage() {
  const cityList = METRO_CITIES.join(', ');

  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={webDesignServiceJsonLd} />
      <JsonLd data={localFaqJsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'Des Moines Web Design', path: '/des-moines-web-design' }]} />

      {/* Hero */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-36 pb-20 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4 inline-flex items-center gap-2">
            <MapPin size={15} /> West Des Moines, Iowa · Serving the Des Moines Metro
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] font-display mb-6">
            Des Moines Web Design That Gets You More Customers
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-10">
            Axeon Studio gets businesses across the Des Moines metro more customers: found on Google, chosen
            over the competition, and booked. One West Des Moines team runs it all, backed by our 90-Day Customer
            Guarantee.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Free Strategy Call <ArrowRight size={18} />
            </Link>
            <a
              href={TEL_HREF}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-base transition-colors"
            >
              <PhoneCall size={18} /> {BUSINESS.telephoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Why local */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ WHY LOCAL ]</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight mb-4">
            Why Des Moines Businesses Get More Customers With a Local Team
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            Most web agencies pitching Iowa businesses are somewhere else. That shows up as slow replies, stock
            photos of a city that is not yours, and a site that reads like every other one in your industry.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {LOCAL_REASONS.map(({ icon: Icon, title, description }) => (
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

      {/* What we build */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ THE SYSTEM ]</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight mb-4">
            How We Get Metro Businesses More Customers
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            One team runs the whole system, so nothing gets lost between a designer, an SEO vendor, and a booking tool.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {SYSTEM.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group rounded-2xl border border-neutral-200 bg-white p-7 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                <p className="text-sm font-semibold text-blue-600">{item.step}</p>
                <h3 className="mt-1 text-2xl font-black font-display tracking-tight mb-3">{item.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{item.description}</p>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-neutral-700">
            Essentials: $2,800 setup, then from $284/mo. AxeonCORE: $5,800 setup, then from $574/mo.{' '}
            <Link href="/pricing" className="font-semibold text-blue-600 hover:underline">
              See both plans &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* Industries */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ WHO WE HELP ]</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight mb-4">
            Industries We Serve Across Des Moines
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-10 leading-relaxed">
            Pick yours to see how we get it found, chosen, and booked. Built around how your customers buy, not a
            template with your logo on it.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {niches.map((niche) => (
              <li key={niche.slug}>
                <Link
                  href={`/solutions/${niche.slug}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 px-5 py-4 hover:border-blue-400 hover:bg-blue-50/40 transition-colors font-semibold"
                >
                  {niche.name}
                  <ArrowRight size={16} className="text-blue-600" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-neutral-600">
            Something else?{' '}
            <Link href="/solutions#small-business" className="text-blue-600 font-semibold hover:underline">
              We build for any Des Moines small business.
            </Link>
          </p>
        </div>
      </section>

      {/* Service area */}
      <section className="w-full py-16 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Service Area</h2>
            <p className="text-neutral-300 leading-relaxed">
              Based in West Des Moines, IA 50266. In-person meetings and on-site video shoots anywhere in the
              metro; remote builds for the rest of Iowa and the United States.
            </p>
            <address className="not-italic mt-6 text-neutral-300 space-y-1">
              <div className="font-semibold text-white">{BUSINESS.name}</div>
              <div>West Des Moines, Iowa 50266</div>
              <div>
                <a href={TEL_HREF} className="hover:text-blue-400">
                  {BUSINESS.telephoneDisplay}
                </a>
              </div>
              <div>
                <a href={`mailto:${BUSINESS.email}`} className="hover:text-blue-400">
                  {BUSINESS.email}
                </a>
              </div>
              <div>Mon–Fri, 8:00 AM – 6:00 PM CT</div>
            </address>
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">Des Moines Metro</h3>
            <ul className="flex flex-wrap gap-2.5">
              {METRO_CITIES.map((city) => (
                <li
                  key={city}
                  className="px-4 py-2 rounded-full border border-neutral-700 text-sm font-medium text-neutral-200"
                >
                  {city}, IA
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-neutral-400">
              Also serving Polk, Dallas, Warren, and Story counties, and businesses statewide — {cityList} are
              simply where we can show up in person.
            </p>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* FAQ */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ FAQ ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-10">
            Questions Des Moines Business Owners Ask
          </h2>
          <FAQAccordion items={LOCAL_FAQ} defaultOpenCount={1} />
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-4">
            [ 90-DAY CUSTOMER GUARANTEE ]
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight mb-6">
            Ready for more customers?
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            More calls and leads in your first 90 days than you were getting before, or we keep working for free until
            you do.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Free Strategy Call <ArrowRight size={18} />
            </Link>
            <a
              href={TEL_HREF}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-base transition-colors"
            >
              <PhoneCall size={18} /> {BUSINESS.telephoneDisplay}
            </a>
          </div>
          <p className="mt-6 text-xs text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Baseline set together on your kickoff call. Applies while you&apos;re on a monthly plan and answering new
            leads within one business day.
          </p>
        </div>
      </section>
    </main>
  );
}
