import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { ArrowRight, MapPin, PhoneCall, Search, ShieldCheck, Star, LineChart } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS, serviceJsonLd } from '@/lib/seo';
import { COMMITMENT_HEADLINE } from '@/data/pricingData';
import { funnelPath } from '@/data/serviceFunnels';

// Des Moines SEO (2026-10-20). The easiest local search cluster in the Semrush
// research ("des moines search engine optimization" 590/KD 5, "seo company des
// moines" 390/KD 3, "des moines seo" 390/KD 14, "search engine marketing des
// moines" 880), and the site had no page for it; /des-moines-web-design keeps
// the web design intent. Short lines only (owner: no text blobs), no invented
// results or ranking promises.
export const metadata = buildMetadata({
  path: '/des-moines-seo',
  title: 'Des Moines SEO Company | Axeon Studio',
  description:
    'Des Moines SEO for dental practices, med spas, law firms and CPA firms: map pack, service pages and reviews, every call answered. From $799/mo.',
});

const seoServiceJsonLd = serviceJsonLd({
  path: '/des-moines-seo',
  serviceType: 'Search Engine Optimization',
  name: 'Axeon Studio: Des Moines SEO for Practices and Firms',
  description:
    'Local search engine optimization in Des Moines for dental practices, med spas, law firms and CPA firms: Google Business Profile, service and location pages, reviews and call tracking.',
});

const TEL_HREF = `tel:${BUSINESS.telephone.replace(/-/g, '')}`;

const COVERS = [
  { icon: MapPin, title: 'Your Google Business Profile, set up and kept current' },
  { icon: Search, title: 'A page for each service and city you want more of' },
  { icon: Star, title: 'A review request after every appointment, automatically' },
  { icon: LineChart, title: 'Calls tracked to booked appointments in AxeonPROOF' },
];

const BY_PRACTICE = [
  { label: 'Dental SEO', href: funnelPath('seo', 'dental') },
  { label: 'Med spa SEO', href: funnelPath('seo', 'med-spa') },
  { label: 'Law firm SEO', href: funnelPath('seo', 'law-firms') },
  { label: 'SEO for accountants', href: funnelPath('seo', 'accounting') },
];

const WHY_LOCAL = [
  { icon: PhoneCall, title: 'You call the team that does the work' },
  { icon: MapPin, title: 'One practice or firm per specialty within 5 miles' },
  { icon: ShieldCheck, title: 'Live in 30 days, 60-second replies, or you walk away' },
];

const FAQ = [
  {
    question: 'How much does SEO cost in Des Moines?',
    answer:
      'With Axeon, local SEO is part of AxeonCORE, from $799/mo, together with your website and 60-second intake. $0 setup, first payment once you are live.',
  },
  {
    question: 'How long does local SEO take?',
    answer:
      'Months, not weeks, and it depends on your specialty and competition. You see calls and bookings in AxeonPROOF every month.',
  },
  {
    question: 'Do you guarantee rankings?',
    answer:
      'No, and nobody honest can. We commit to the work and to answering every inquiry in 60 seconds, in writing.',
  },
  {
    question: 'Do you do search engine marketing too?',
    answer:
      'Yes. Google Ads and Local Services Ads are in AxeonGROWTH, from $1,999/mo plus ad spend, measured in booked appointments.',
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

export default function DesMoinesSeoPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={seoServiceJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'Des Moines SEO', path: '/des-moines-seo' }]} />

      {/* Purpose: the search people make, the result, and the two ways to start. */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-12 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="eyebrow eyebrow-dark mb-3 sm:mb-4">Des Moines SEO · Local team</p>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08] sm:leading-[1.05] font-display mb-4 sm:mb-6 text-balance">
            Des Moines SEO that ends in booked appointments
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-6 sm:mb-10">
            Search engine optimization for practices and firms, with every call answered in 60&nbsp;seconds.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_des_moines_seo"
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

      {/* Purpose: what the SEO work is, one line each, and what it costs. */}
      <section className="w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3">What it covers</p>
            <h2 className="text-[28px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.08] text-balance">
              Local SEO, done for you
            </h2>
            <p className="mt-3 sm:mt-5 text-[15px] sm:text-lg text-neutral-700">
              Included in AxeonCORE, from $799/mo.{' '}
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

      {/* Purpose: route each practice type to the SEO page written for it. */}
      <section className="w-full py-10 sm:py-20 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3] border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-3">By specialty</p>
          <h2 className="text-[28px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-4 sm:mb-8">
            SEO written for your field
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {BY_PRACTICE.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  data-spot
                  className="group ix-card relative flex items-center justify-between gap-3 rounded-2xl bg-white border border-neutral-200 px-5 py-4 font-bold hover:border-blue-400 transition-colors"
                >
                  {p.label}
                  <ArrowRight size={16} className="shrink-0 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Purpose: why a local SEO company, in three lines. */}
      <section className="w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-3">Why local</p>
          <h2 className="text-[28px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-4 sm:mb-8">
            A Des Moines SEO company you can meet
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            {WHY_LOCAL.map(({ icon: Icon, title }) => (
              <li key={title} className="flex gap-3 text-base sm:text-lg font-semibold">
                <LineIcon>
                  <Icon size={20} className="text-blue-600" />
                </LineIcon>
                {title}
              </li>
            ))}
          </ul>
          <p className="mt-6 sm:mt-10 text-[15px] sm:text-base text-neutral-600">
            Need a new site too?{' '}
            <Link href="/des-moines-web-design" className="font-semibold text-blue-600 hover:underline">
              Des Moines web design
            </Link>
          </p>
        </div>
      </section>

      {/* Purpose: the questions people search before hiring an SEO company. */}
      <section className="w-full py-10 sm:py-24 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-3 sm:mb-10">
            Des Moines SEO questions
          </h2>
          <FAQAccordion items={FAQ} />
        </div>
      </section>

      {/* Purpose: the offer and the commitment, with the two ways to start. */}
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
            data-track-cta="area_check_des_moines_seo_close"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
          >
            Check if your area is open <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
