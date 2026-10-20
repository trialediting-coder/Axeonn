import LineIcon from '@/components/common/LineIcon';
import { COMMITMENT_HEADLINE } from '@/data/pricingData';
import Link from 'next/link';
import { ArrowRight, MapPin, PhoneCall, Users, ShieldCheck } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { niches } from '@/data/nichesData';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { Testimonials } from '@/components/home/Testimonials';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS, METRO_CITIES, serviceJsonLd } from '@/lib/seo';
import { cityPages, METRO_SYSTEM as SYSTEM } from '@/data/cityPages';

export const metadata = buildMetadata({
  path: '/des-moines-web-design',
  title: 'Des Moines Web Design Company | Axeon Studio',
  description:
    'Web design in Des Moines for dental practices, med spas, law firms and CPA firms: websites that book, every inquiry answered in 60 seconds. From $799/mo.',
});

const webDesignServiceJsonLd = serviceJsonLd({
  path: '/des-moines-web-design',
  serviceType: 'Patient & Client Intake for Practices and Firms',
  name: 'Axeon Studio — Des Moines Patient & Client Intake for Practices and Firms',
  description:
    'Websites, 24/7 missed-call text-back, 60-second replies to web inquiries, online consultation booking and automated review requests for dental practices, med spas, law firms and CPA firms across the Des Moines metro.',
});

const TEL_HREF = `tel:${BUSINESS.telephone.replace(/-/g, '')}`;

// What we do, one line each, in the words people search (Semrush On Page SEO
// Checker, 2026-10-20: this page ranks for "web design company des moines",
// "seo company in des moines", "marketing agencies des moines", "web development
// company des moines" and "des moines content writing" without using them).
const WHAT_WE_DO = [
  { label: 'Web design and web development', line: 'Custom, mobile-first websites built to book, not templates.', href: '/marketing-solutions/website' },
  { label: 'Local SEO', line: 'The SEO company side: Google profile, a page for every service and town.', href: '/des-moines-seo' },
  { label: 'Content writing', line: 'We write every page. You approve every word.', href: '/marketing-solutions/website' },
  { label: 'Lead generation and intake', line: 'Every missed call and form answered in 60 seconds.', href: '/marketing-solutions/lead-generation' },
  { label: 'Digital advertising', line: 'Google Ads and Local Services Ads, tracked to booked appointments.', href: '/marketing-solutions/advertising' },
  { label: 'Video production and photography', line: 'Real photos and short videos of your team.', href: '/marketing-solutions/video-photography' },
];

const LOCAL_REASONS = [
  {
    icon: PhoneCall,
    title: 'You call the team that built it',
    description:
      'A West Des Moines studio. The people who build it answer the phone.',
  },
  {
    icon: Users,
    title: 'Front-desk training in person',
    description:
      'At your office, with the people who use it every day.',
  },
  {
    icon: MapPin,
    title: 'One practice or firm per specialty within 5 miles',
    description:
      'We never work for the competitor down the street.',
  },
  {
    icon: ShieldCheck,
    title: 'A commitment you can hold us to',
    description:
      'Live in 30 days, 60-second replies, or you walk away.',
  },
];

const LOCAL_FAQ = [
  {
    question: 'Do you only work with practices and firms in Des Moines?',
    answer:
      'No. The metro is home base, in person, and we work with practices and firms across Iowa remotely.',
  },
  {
    question: 'Can we meet in person?',
    answer:
      'Yes. We usually meet at your office for kickoff and front-desk training.',
  },
  {
    question: 'How much does Axeon cost for a Des Moines practice or firm?',
    answer:
      'AxeonCORE is from $799/mo, with $0 setup (normally $3,000) and nothing due until it is working. AxeonGROWTH is from $1,999/mo plus ad spend.',
  },
  {
    question: 'What kinds of practices and firms do you work with?',
    answer:
      'Dental practices, med spas, law firms and CPA firms. If you book consults, we will tell you honestly whether it fits.',
  },
  {
    question: 'Does the intake collect any health or financial details?',
    answer:
      'No. Intake collects name, contact, service and preferred time only. Never symptoms, insurance, health or financial details.',
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

  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={webDesignServiceJsonLd} />
      <JsonLd data={localFaqJsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'Des Moines Web Design', path: '/des-moines-web-design' }]} />

      {/* Hero */}
      {/* Purpose: the result for metro practices and firms, and the two ways to start. */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-12 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="eyebrow eyebrow-dark mb-3 sm:mb-4 flex items-start gap-2">
            <LineIcon>
              <MapPin size={15} />
            </LineIcon>
            <span>West Des Moines, Iowa · Serving the Des Moines Metro</span>
          </p>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08] sm:leading-[1.05] font-display mb-4 sm:mb-6 text-balance">
            Des Moines web design that answers every inquiry in 60 seconds
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-6 sm:mb-10">
            Every missed call answered, booked and followed by a review request.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_des_moines"
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

      {/* Purpose: everything one Des Moines web design company and marketing agency does, one line each. */}
      <section className="w-full py-10 sm:py-20 px-4 sm:px-10 lg:px-16 xl:px-24 border-b border-neutral-200">
        <div className="max-w-5xl mx-auto">
          <p className="eyebrow mb-2 sm:mb-3">What we do</p>
          <h2 className="text-[26px] sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-5 sm:mb-10 text-balance">
            A Des Moines web design company and marketing agency in one
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {WHAT_WE_DO.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-2xl border border-neutral-200 p-4 sm:p-6 hover:border-blue-300 transition-colors"
                >
                  <span className="flex items-center justify-between gap-3 font-bold text-[17px] sm:text-lg group-hover:text-blue-600 transition-colors">
                    {item.label}
                    <ArrowRight size={16} className="shrink-0 text-neutral-400 group-hover:text-blue-600 transition-colors" />
                  </span>
                  <span className="mt-1 block text-[15px] sm:text-base text-neutral-600 leading-snug">{item.line}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why local: one message -- the team that builds it answers the phone. */}
      {/* Purpose: why a local team: the people who build it answer the phone and train your staff. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Decorative name card: tablet and up (the heading says the same thing on phones). */}
          <div className="hidden sm:block lg:col-span-5">
            <div className="relative w-full max-w-sm mx-auto lg:max-w-none rounded-3xl overflow-hidden bg-neutral-950 text-white border border-neutral-800 shadow-xl p-8 sm:p-10">
              <div className="eyebrow eyebrow-dark">WEST DES MOINES, IOWA</div>
              <div className="mt-3 text-3xl sm:text-4xl font-extrabold font-display leading-tight">Axeon Studio</div>
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                Built in the metro, answering the phone in the metro.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="eyebrow mb-3">
              WHY A LOCAL TEAM
            </p>
            <h2 className="text-[28px] sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.1] sm:leading-[1.05]">
              The team that builds it answers the phone.
            </h2>
            <p className="mt-3 sm:mt-5 text-[15px] sm:text-lg text-neutral-600 leading-snug sm:leading-relaxed">{LOCAL_REASONS[0].description}</p>
            <a
              href={TEL_HREF}
              className="mt-1 sm:mt-5 min-h-11 inline-flex items-center gap-2 text-base font-bold text-blue-600 hover:text-blue-700"
            >
              <PhoneCall size={18} /> {BUSINESS.telephoneDisplay}
            </a>

            <ul className="mt-3 sm:mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
              {LOCAL_REASONS.slice(1, 3).map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3 sm:gap-4 py-3.5 sm:py-5">
                  <LineIcon className="text-base sm:text-lg leading-snug">
                    <Icon size={20} className="text-blue-600" />
                  </LineIcon>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug">{title}</h3>
                    <p className="mt-1 text-[15px] sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* The commitment card: tablet and up. On phones the same commitment closes the page, in full. */}
            <div className="hidden sm:flex mt-8 gap-4 rounded-3xl bg-neutral-950 text-white p-6 sm:p-8">
              <LineIcon className="text-lg sm:text-xl leading-snug">
                <ShieldCheck size={22} className="text-blue-400" />
              </LineIcon>
              <div>
                <h3 className="text-lg sm:text-xl font-bold leading-snug">{LOCAL_REASONS[3].title}</h3>
                <p className="mt-2 text-neutral-300 leading-relaxed">{LOCAL_REASONS[3].description}</p>
                <Link
                  href="/check-your-area"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-white"
                >
                  Check if your area is open <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The system, as one slim strip (not another card grid). */}
      {/* Purpose: the three layers every practice gets, and the price. */}
      <section className="w-full py-8 sm:py-12 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3] border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
            <div className="lg:w-72 shrink-0">
              <p className="eyebrow">THE SYSTEM</p>
              <h2 className="mt-2 text-2xl font-extrabold font-display tracking-tight leading-tight">
                What every metro practice and firm gets
              </h2>
            </div>
            <ol className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
              {SYSTEM.map((item, idx) => (
                <li key={item.step}>
                  <Link
                    href={item.href}
                    data-spot
                    className="group ix-card relative flex items-center justify-between gap-3 rounded-2xl bg-white border border-neutral-200 px-4 py-3 sm:px-5 sm:py-4 hover:border-blue-400 transition-colors"
                  >
                    <span>
                      <span className="block text-xs font-mono font-bold text-neutral-400">0{idx + 1}</span>
                      <span className="block text-lg font-extrabold font-display tracking-tight">{item.step}</span>
                      <span className="block text-sm text-neutral-500">{item.title}</span>
                    </span>
                    {/* Centered on the whole card on purpose (number + title + line). */}
                    <ArrowRight
                      size={16}
                      data-icon-align="block"
                      className="shrink-0 text-blue-600 group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-neutral-700">
            AxeonCORE from $799/mo. AxeonGROWTH from $1,999/mo plus ad spend.{' '}
            <Link href="/pricing" className="font-semibold text-blue-600 hover:underline">
              See pricing &rarr;
            </Link>{' '}
            <Link href="/des-moines-seo" className="font-semibold text-blue-600 hover:underline">
              Des Moines SEO &rarr;
            </Link>{' '}
            <Link href="/iowa-digital-marketing" className="font-semibold text-blue-600 hover:underline">
              Iowa digital marketing &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* Industries */}
      {/* Purpose: route each practice type to its own page. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <p className="eyebrow mb-3">WHO WE HELP</p>
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.1] mb-3 sm:mb-4 text-balance">
            Practices and firms we serve across Des Moines
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 sm:gap-3">
            {niches.map((niche) => (
              <li key={niche.slug}>
                <Link
                  href={`/solutions/${niche.slug}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 sm:px-5 sm:py-4 hover:border-blue-400 hover:bg-blue-50/40 transition-colors font-semibold"
                >
                  <span>{niche.name} in Des Moines</span>
                  <LineIcon>
                    <ArrowRight size={16} className="text-blue-600" />
                  </LineIcon>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 sm:mt-8 text-[15px] sm:text-base text-neutral-600">
            A different kind of practice or firm?{' '}
            <Link href="/solutions#other-practices" className="whitespace-nowrap text-blue-600 font-semibold hover:underline">
              See whether it fits.
            </Link>
          </p>
        </div>
      </section>

      {/* Service area */}
      {/* Purpose: where we are, hours, and the metro pages. */}
      <section className="w-full py-10 sm:py-16 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-5 sm:gap-10 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-4">Service Area</h2>
            <p className="text-neutral-300 leading-relaxed">
              In person across the metro. Remote across Iowa.
            </p>
            <address className="not-italic mt-3 sm:mt-6 text-[15px] sm:text-base text-neutral-300 space-y-0.5 sm:space-y-1">
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
            <h3 className="eyebrow eyebrow-dark mb-2.5 sm:mb-4">Serving the Metro</h3>
            <ul className="flex flex-wrap gap-2 sm:gap-2.5">
              {METRO_CITIES.map((city) => {
                const cityPage = cityPages.find((c) => c.city === city);
                return cityPage ? (
                  <li key={city}>
                    <Link
                      href={`/${cityPage.slug}`}
                      className="min-h-11 inline-flex items-center gap-1.5 px-4 rounded-full border border-blue-500/60 hover:border-blue-400 hover:bg-blue-500/10 text-sm font-semibold text-white transition-colors"
                    >
                      {city}, IA <ArrowRight size={13} className="text-blue-400" />
                    </Link>
                  </li>
                ) : (
                  <li
                    key={city}
                    className="min-h-11 inline-flex items-center px-4 rounded-full border border-neutral-700 text-sm font-medium text-neutral-200"
                  >
                    {city}, IA
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Purpose: why answering first matters (sourced stats; shared with the home page) */}
      <Testimonials />

      {/* FAQ */}
      {/* Purpose: the local questions; every question in view, answers one tap away. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-3 sm:mb-10 text-balance">
            Questions Des Moines practice and firm owners ask
          </h2>
          <FAQAccordion items={LOCAL_FAQ} />
        </div>
      </section>

      {/* CTA */}
      {/* Purpose: the offer and the commitment, with the two ways to start. */}
      <section className="w-full py-12 sm:py-20 px-5 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="eyebrow eyebrow-dark mb-3 sm:mb-4">
            90-DAY PERFORMANCE COMMITMENT
          </p>
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.1] sm:leading-tight mb-4 sm:mb-6 text-balance">
            $0 to start. Nothing due until it&apos;s working.
          </h2>
          <p className="text-[15px] sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-snug sm:leading-relaxed mb-6 sm:mb-10">
            {COMMITMENT_HEADLINE}
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_des_moines"
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
    </main>
  );
}
