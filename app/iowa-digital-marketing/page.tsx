import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { ArrowRight, Globe, Megaphone, PhoneCall, Search, Star } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS, IOWA_CITIES, METRO_CITIES, iowaAreaServed, serviceJsonLd } from '@/lib/seo';
import { COMMITMENT_HEADLINE } from '@/data/pricingData';
import { cityPages, iowaCityPages, IOWA_PAGE } from '@/data/cityPages';
import { niches } from '@/data/nichesData';

// Iowa-wide page (2026-10-20). Semrush, US monthly volume / KD: "iowa web design"
// 590/48, "web design iowa" 390/49, "iowa digital marketing" 390/14, "iowa
// marketing agency" 320/54, "iowa seo" 320/8, "digital marketing agency iowa"
// 260/19. One page for the statewide terms; the cities with real volume have
// their own pages (Cedar Rapids, Iowa City, Quad Cities). Honest about reach:
// in person in the Des Moines metro, by phone and video elsewhere in Iowa.
const PATH = IOWA_PAGE.href;

export const metadata = buildMetadata({
  path: PATH,
  title: 'Iowa Digital Marketing Agency & Web Design | Axeon Studio',
  description:
    'Iowa web design, SEO and digital marketing for dental practices, med spas, law firms and CPA firms. Every inquiry answered in 60 seconds. From $799/mo.',
});

const iowaServiceJsonLd = serviceJsonLd({
  path: PATH,
  serviceType: 'Digital Marketing, Web Design and Local SEO',
  name: 'Axeon Studio: Iowa Digital Marketing and Web Design',
  description:
    'Website design, local SEO, 60-second intake, review requests and ads for dental practices, med spas, law firms and CPA firms across Iowa, from West Des Moines.',
  areaServed: iowaAreaServed([...METRO_CITIES, ...IOWA_CITIES]),
});

const TEL_HREF = `tel:${BUSINESS.telephone.replace(/-/g, '')}`;

const COVERS = [
  { icon: Globe, title: 'A website built for phones, with booking on every page' },
  { icon: Search, title: 'Local SEO: your Google profile, service and city pages' },
  { icon: PhoneCall, title: 'Every missed call and inquiry answered in 60 seconds' },
  { icon: Star, title: 'A review request after every appointment' },
  { icon: Megaphone, title: 'Google ads in AxeonGROWTH, measured in booked appointments' },
];

const CHIP =
  'min-h-11 inline-flex items-center gap-1.5 px-4 rounded-full border border-neutral-300 hover:border-blue-400 hover:bg-blue-50/40 text-sm font-semibold transition-colors';

const FAQ = [
  {
    question: 'Do you work with practices and firms outside Des Moines?',
    answer:
      'Yes, across Iowa. Outside the metro we work by phone and video and travel for setup or photo shoots when it helps.',
  },
  {
    question: 'How much does digital marketing cost with Axeon?',
    answer:
      'AxeonCORE is from $799/mo on a 12-month agreement, with $0 setup (normally $3,000). AxeonGROWTH, from $1,999/mo plus ad spend, adds ads.',
  },
  {
    question: 'Do you guarantee rankings?',
    answer: 'No, and nobody honest can. We commit to the work and to 60-second replies, in writing.',
  },
  {
    question: 'Will you also work with a competitor near us?',
    answer: 'No. One practice or firm per specialty within 5 miles, while your account is in good standing.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

export default function IowaDigitalMarketingPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={iowaServiceJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd items={[{ name: IOWA_PAGE.label, path: PATH }]} />

      {/* Purpose: the statewide search, the result, and the two ways to start. */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-12 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="eyebrow eyebrow-dark mb-3 sm:mb-4">Iowa digital marketing agency · Web design &amp; SEO</p>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08] sm:leading-[1.05] font-display mb-4 sm:mb-6 text-balance">
            Iowa web design and digital marketing that books appointments
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-6 sm:mb-10">
            For practices and firms across Iowa, with every inquiry answered in 60&nbsp;seconds.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_iowa"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
            >
              Check if your area is open <ArrowRight size={18} />
            </Link>
            <a
              href={TEL_HREF}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-base transition-colors"
            >
              <PhoneCall size={18} /> {BUSINESS.telephoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Purpose: what the work is, one line each, and what it costs. */}
      <section className="w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3">What it covers</p>
            <h2 className="text-[28px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.08] text-balance">
              Web design, SEO and marketing on one plan
            </h2>
            <p className="mt-3 sm:mt-5 text-[15px] sm:text-lg text-neutral-700">
              AxeonCORE from $799/mo, $0 setup (normally $3,000).{' '}
              <Link href="/pricing" className="font-semibold text-blue-600 hover:underline">
                See pricing
              </Link>
            </p>
          </div>
          <ul className="lg:col-span-7 divide-y divide-neutral-200 border-y border-neutral-200">
            {COVERS.map(({ icon: Icon, title }) => (
              <li key={title} className="flex gap-3 sm:gap-4 py-3.5 sm:py-5 text-base sm:text-lg font-semibold">
                <LineIcon>
                  <Icon size={20} className="text-blue-600" />
                </LineIcon>
                {title}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Purpose: where we work and how, honestly: in person in the metro, remote elsewhere. */}
      <section className="w-full py-10 sm:py-20 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3] border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-3">Where we work</p>
          <h2 className="text-[28px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-2 sm:mb-3">
            Based in West Des Moines, working across Iowa
          </h2>
          <p className="text-[15px] sm:text-lg text-neutral-600 mb-6 sm:mb-10">
            No offices elsewhere. Outside the metro, we work by phone and video.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold mb-3">In person: the Des Moines metro</h3>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link href="/des-moines-web-design" className={CHIP}>
                    Des Moines Web Design
                  </Link>
                </li>
                <li>
                  <Link href="/des-moines-seo" className={CHIP}>
                    Des Moines SEO
                  </Link>
                </li>
                {cityPages.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`} className={CHIP}>
                      {c.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold mb-3">Phone and video: the rest of Iowa</h3>
              <ul className="flex flex-wrap gap-2">
                {iowaCityPages.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`} className={CHIP}>
                      {c.linkLabel} <ArrowRight size={13} className="text-blue-600" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[15px] text-neutral-600">We travel for kickoff or a photo shoot when it helps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose: route each practice type to the page written for it. */}
      <section className="w-full py-10 sm:py-20 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-3">By specialty</p>
          <h2 className="text-[28px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-4 sm:mb-8">
            Marketing written for your field
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {niches.map((niche) => (
              <li key={niche.slug}>
                <Link
                  href={`/solutions/${niche.slug}`}
                  data-spot
                  className="group ix-card relative flex items-center justify-between gap-3 rounded-2xl bg-white border border-neutral-200 px-5 py-4 font-bold hover:border-blue-400 transition-colors"
                >
                  {niche.name}
                  <ArrowRight size={16} className="shrink-0 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Purpose: the questions people ask before hiring an Iowa agency. */}
      <section className="w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-3 sm:mb-10">
            Iowa digital marketing questions
          </h2>
          <FAQAccordion items={FAQ} />
        </div>
      </section>

      {/* Purpose: the offer and the commitment, with the way to start. */}
      <section className="w-full py-12 sm:py-20 px-5 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="eyebrow eyebrow-dark mb-3 sm:mb-4">90-day performance commitment</p>
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.1] mb-4 sm:mb-6 text-balance">
            $0 to start. Nothing due until it&apos;s working.
          </h2>
          <p className="text-[15px] sm:text-lg text-neutral-300 max-w-2xl mx-auto mb-6 sm:mb-10">{COMMITMENT_HEADLINE}</p>
          <Link
            href="/check-your-area"
            data-track="cta_click"
            data-track-cta="area_check_iowa_close"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
          >
            Check if your area is open <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
