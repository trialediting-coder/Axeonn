import Link from 'next/link';
import { ArrowRight, MapPin, PhoneCall, Clapperboard, Handshake } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { Testimonials } from '@/components/home/Testimonials';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS, METRO_CITIES, serviceJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/des-moines-web-design',
  title: 'Des Moines Web Design & Marketing Agency | Axeon Studio',
  description:
    'Web design, SEO/AEO/GEO, AI scheduling, and lead pipelines for Des Moines-area businesses. Based in West Des Moines, flat pricing from $2,800, live in 7–14 days.',
});

const webDesignServiceJsonLd = serviceJsonLd({
  path: '/des-moines-web-design',
  serviceType: 'Web Design & Digital Marketing',
  name: 'Axeon Studio — Des Moines Web Design & Digital Marketing',
  description:
    'Custom websites, local SEO/AEO/GEO, AI chat & scheduling, lead-generation pipelines, and on-site video for businesses across the Des Moines metro.',
});

const TEL_HREF = `tel:${BUSINESS.telephone.replace(/-/g, '')}`;

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
      'The Acquisition Engine includes a half-day shoot at your shop, office, or clinic anywhere in the metro — a hero film for the site, vertical cuts for social, and a photo set. No out-of-town crew, no travel fees.',
  },
  {
    icon: MapPin,
    title: 'Built for how Des Moines actually searches',
    description:
      'Suburb-level intent matters here — a Waukee homeowner and a downtown Des Moines law firm search differently. Every build ships with local SEO, structured data, and AI-answer-engine visibility tuned to the metro, not a generic "near me" template.',
  },
  {
    icon: Handshake,
    title: 'Flat pricing, fixed timeline',
    description:
      'Two published builds — $2,800 and $5,800 — with a 7 or 14 business-day turnaround. No proposals, no hourly billing, no surprise invoices. You own the site, the code, and the design files.',
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
      'Yes. Strategy calls are usually a video call because it is faster for everyone, but if you are in the Des Moines metro and want to meet at your location, that is easy to arrange — and it happens anyway for the on-site videography included in the Acquisition Engine.',
  },
  {
    question: 'How much does a website cost in Des Moines?',
    answer:
      'Our pricing is published. The Core Web Build is $2,800 one-time and launches in 7 business days. The Acquisition Engine is $5,800 one-time, launches in 14 business days, and adds a Custom CRM Pipeline, AI chat & online scheduling, automated follow-up, and a half-day on-site video shoot.',
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

export default function DesMoinesWebDesignPage() {
  const cityList = METRO_CITIES.join(', ');

  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={webDesignServiceJsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'Des Moines Web Design', path: '/des-moines-web-design' }]} />

      {/* Hero */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-36 pb-20 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4 inline-flex items-center gap-2">
            <MapPin size={15} /> West Des Moines, Iowa · Serving the Des Moines Metro
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] font-display mb-6">
            Web Design &amp; Digital Marketing for Des Moines Businesses
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-10">
            Axeon Studio builds custom websites, local search visibility, AI scheduling, and lead pipelines for
            businesses across the Des Moines metro — from a studio in West Des Moines, at a flat price, live in
            7–14 business days.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Book a Strategy Call <ArrowRight size={18} />
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Why Des Moines Businesses Work With a Local Studio
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            What We Build for the Metro
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-12 leading-relaxed">
            One team handles the whole stack, so there is no handoff between a designer, an SEO vendor, and
            whoever set up your booking tool.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {marketingSolutions.map((solution) => (
              <Link
                key={solution.id}
                href={solution.href}
                className="group rounded-2xl border border-neutral-200 bg-white p-7 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {solution.title}
                  {solution.id === 'seo' ? ' / AEO / GEO' : ''}
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-4">{solution.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Learn more <ArrowRight size={14} />
                </span>
              </Link>
            ))}
            <Link
              href="/pricing"
              className="group rounded-2xl border-2 border-blue-600 bg-neutral-950 text-white p-7 hover:bg-neutral-900 transition-all"
            >
              <h3 className="text-lg font-bold mb-2">Flat-Rate Pricing</h3>
              <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                Core Web Build from $2,800. Acquisition Engine with on-site video from $5,800. No proposals.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400">
                See both builds <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Industries We Serve Across Des Moines
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mb-10 leading-relaxed">
            Each of these gets a purpose-built intake workflow and Custom CRM Pipeline — not a find-and-replace
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
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            Questions Des Moines Business Owners Ask
          </h2>
          <FAQAccordion items={LOCAL_FAQ} defaultOpenCount={1} />
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">Ready when you are</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy call and we will walk through exactly which build fits your business — and when we
            can be on site.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
