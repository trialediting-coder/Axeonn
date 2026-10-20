import LineIcon from '@/components/common/LineIcon';
import Link from 'next/link';
import { ArrowRight, MapPin, PhoneCall, Check } from 'lucide-react';
import { niches } from '@/data/nichesData';
import { cityPages, cityPricingFaq, METRO_SYSTEM, type CityPage } from '@/data/cityPages';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { Testimonials } from '@/components/home/Testimonials';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { BUSINESS, cityAreaServed, serviceJsonLd } from '@/lib/seo';

const TEL_HREF = `tel:${BUSINESS.telephone.replace(/-/g, '')}`;
const EYEBROW = 'text-xs font-mono font-bold tracking-widest text-blue-600 uppercase';

// One suburb landing page. Same look and building blocks as /des-moines-web-design,
// with the copy, FAQ and featured practice types coming from data/cityPages.ts.
export function CityLanding({ page }: { page: CityPage }) {
  const path = `/${page.slug}`;
  const faqs = [...page.faq, cityPricingFaq(page.city)];
  const featured = page.featuredNiches
    .map((slug) => niches.find((n) => n.slug === slug))
    .filter((n): n is (typeof niches)[number] => Boolean(n));
  const otherCities = cityPages.filter((c) => c.slug !== page.slug);

  const serviceLd = serviceJsonLd({
    path,
    serviceType: 'Patient & Client Intake for Practices and Firms',
    name: `Axeon Studio — ${page.city} Patient & Client Intake for Practices and Firms`,
    description: page.description,
    areaServed: cityAreaServed(page.city),
  });

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={serviceLd} />
      <JsonLd data={faqLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Des Moines Web Design', path: '/des-moines-web-design' },
          { name: page.linkLabel, path },
        ]}
      />

      {/* Hero */}
      {/* Purpose: the result for practices in this city, and the two ways to start. */}
      <section className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-12 sm:pt-44 sm:pb-28 bg-neutral-950 text-white overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-xs sm:text-sm font-mono uppercase tracking-wider text-blue-400 mb-3 sm:mb-4 inline-flex items-center gap-2">
            <MapPin size={15} /> {page.eyebrow}
          </p>
          <h1 className="text-[32px] sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08] sm:leading-[1.05] font-display mb-4 sm:mb-6 text-balance">
            {page.h1}
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 leading-relaxed max-w-3xl mb-6 sm:mb-10">{page.intro}</p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_city"
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

      {/* Local context: why this city, in this city's terms */}
      {/* Purpose: why answering first matters here (left), and what we do about it (right; its own phone screen). */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <p className={`${EYEBROW} mb-3`}>[ {page.city.toUpperCase()} ]</p>
            <h2 className="text-[28px] sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] sm:leading-[1.05] text-balance">
              {page.localHeading}
            </h2>
            {page.localBody.map((para) => (
              <p key={para.slice(0, 32)} className="mt-3 sm:mt-5 text-[15px] sm:text-lg text-neutral-600 leading-snug sm:leading-relaxed">
                {para}
              </p>
            ))}

            {/* Proof we can honestly offer: what we find on their own practice, shown after an area check. */}
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_city_card"
              data-spot="dark"
              className="group ix-card relative mt-5 sm:mt-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 rounded-3xl bg-neutral-950 text-white p-5 sm:p-8"
            >
              <span className="text-4xl sm:text-6xl font-black font-display tracking-tighter text-blue-500 leading-none whitespace-nowrap">
                60 sec
              </span>
              <span className="block">
                <span className="block text-base sm:text-xl font-bold leading-snug">
                  How fast does your practice or firm answer after hours? Check your area and we&apos;ll show you: a test call,
                  your website&apos;s reply time, and your reviews next to the top 3 nearby.
                </span>
                <span className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 group-hover:text-white">
                  Check if your area is open <ArrowRight size={14} />
                </span>
              </span>
            </Link>
          </div>

          <div className="lg:col-span-5">
            <p className={`${EYEBROW} mb-2 sm:mb-3`}>[ WHAT WE DO FOR YOU ]</p>
            <h2 className="mb-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight text-balance">
              Answered first, in {page.city}.
            </h2>
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {page.focusPoints.map((point) => (
                <li key={point.title} className="flex gap-3 sm:gap-4 py-3.5 sm:py-5">
                  <LineIcon className="text-base sm:text-lg leading-snug">
                    <Check size={20} className="text-blue-600" />
                  </LineIcon>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug">{point.title}</h3>
                    <p className="mt-1 text-[15px] sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a
              href={TEL_HREF}
              className="mt-3 sm:mt-6 min-h-11 inline-flex items-center gap-2 text-base font-bold text-blue-600 hover:text-blue-700"
            >
              <PhoneCall size={18} /> Talk to our team: {BUSINESS.telephoneDisplay}
            </a>
          </div>
        </div>
      </section>
      {/* The system, as one slim strip */}
      {/* Purpose: the three layers every practice gets, and the price. */}
      <section className="w-full py-8 sm:py-12 px-4 sm:px-10 lg:px-16 xl:px-24 bg-[#F7F6F3] border-y border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
            <div className="lg:w-72 shrink-0">
              <p className={EYEBROW}>[ THE SYSTEM ]</p>
              <h2 className="mt-2 text-2xl font-extrabold font-display tracking-tight leading-tight">
                What every {page.city} practice and firm gets
              </h2>
            </div>
            <ol className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
              {METRO_SYSTEM.map((item, idx) => (
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
                    <ArrowRight size={16} className="shrink-0 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-neutral-700">
            AxeonCORE from $799/mo. AxeonGROWTH from $1,999/mo plus ad spend.{' '}
            <Link href="/pricing" className="font-semibold text-blue-600 hover:underline">
              See pricing &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* Industries: this city's likely fits first, then a link to all */}
      {/* Purpose: route each practice type to its own page. */}
      <section className="w-full py-10 sm:py-28 px-4 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <p className={`${EYEBROW} mb-3`}>[ WHO WE HELP ]</p>
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.1] mb-3 sm:mb-4 text-balance">
            Practices and firms we serve in {page.city}
          </h2>
          <p className="text-[15px] sm:text-lg text-neutral-600 max-w-3xl mb-5 sm:mb-10 leading-snug sm:leading-relaxed">
            Pick yours to see where new patients and clients slip away, and how we answer them within 60 seconds.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 sm:gap-3">
            {featured.map((niche) => (
              <li key={niche.slug}>
                <Link
                  href={`/solutions/${niche.slug}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 sm:px-5 sm:py-4 hover:border-blue-400 hover:bg-blue-50/40 transition-colors font-semibold"
                >
                  {niche.name} in {page.city}
                  <ArrowRight size={16} className="text-blue-600" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 sm:mt-8 text-[15px] sm:text-base text-neutral-600">
            A different kind of practice or firm?{' '}
            <Link href="/solutions" className="whitespace-nowrap text-blue-600 font-semibold hover:underline">
              See who we work with.
            </Link>
          </p>
        </div>
      </section>

      {/* Serving the metro: links between the local pages */}
      {/* Purpose: where we are and the nearby metro pages. */}
      <section className="w-full py-10 sm:py-16 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-5 sm:gap-10 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-4">Serving the metro</h2>
            <p className="text-neutral-300 leading-relaxed">
              Based in West Des Moines, IA 50266. In-person kickoffs and front-desk training anywhere in the Des Moines
              metro, including {page.city}.
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
            </address>
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-xs sm:text-sm font-mono uppercase tracking-wider text-blue-400 mb-2.5 sm:mb-4">Nearby</h3>
            <ul className="flex flex-wrap gap-2 sm:gap-2.5">
              <li>
                <Link
                  href="/des-moines-web-design"
                  className="min-h-11 inline-flex items-center px-4 rounded-full border border-neutral-700 hover:border-blue-400 text-sm font-medium text-neutral-200"
                >
                  Des Moines Web Design
                </Link>
              </li>
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${c.slug}`}
                    className="min-h-11 inline-flex items-center px-4 rounded-full border border-neutral-700 hover:border-blue-400 text-sm font-medium text-neutral-200"
                  >
                    {c.linkLabel}
                  </Link>
                </li>
              ))}
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
          <p className={`${EYEBROW} mb-3`}>[ FAQ ]</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-3 sm:mb-10 text-balance">
            Questions {page.city} practice and firm owners ask
          </h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* CTA */}
      {/* Purpose: the offer and the commitment, with the two ways to start. */}
      <section className="w-full py-12 sm:py-20 px-5 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase mb-3 sm:mb-4">
            [ 90-DAY PERFORMANCE COMMITMENT ]
          </p>
          <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.1] sm:leading-tight mb-4 sm:mb-6 text-balance">
            $0 to start. Nothing due until it&apos;s working.
          </h2>
          <p className="text-[15px] sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-snug sm:leading-relaxed mb-6 sm:mb-10">
            Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don&apos;t fix it within 15 days, you can walk away and owe nothing for the rest of the term.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-4">
            <Link
              href="/check-your-area"
              data-track="cta_click"
              data-track-cta="area_check_city"
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
          <p className="mt-4 sm:mt-6 text-xs text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Included with AxeonCORE and AxeonGROWTH. We commit to speed, replies and review requests, never to a number of
            patients, clients or rankings.
          </p>
        </div>
      </section>
    </main>
  );
}
