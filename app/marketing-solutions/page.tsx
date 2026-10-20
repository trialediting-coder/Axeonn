import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, MapPin, ShieldCheck, KeyRound } from 'lucide-react';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { coreLayers, growthLayer } from '@/data/solutionDetails';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { Eyebrow } from '@/components/marketing-solutions/SolutionSections';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';

export const metadata = buildMetadata({
  path: '/marketing-solutions',
  title: 'How It Works: Patient & Client Intake | Axeon Studio',
  description:
    'Three layers for private practices: a practice website, 60-second intake and booking, and a review engine. Every missed call and web inquiry answered within 60 seconds, 24/7. From $799/mo.',
});

const howItWorksJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'How Axeon works | Axeon Studio',
  itemListElement: marketingSolutions.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Service',
      name: item.title,
      description: item.description,
      url: `https://axeonstudio.co${item.href}`,
      provider: providerRef,
      areaServed: SERVICE_AREA,
    },
  })),
};

// An example evening, clearly labeled as one. No statistics, no client data.
const EVENING = {
  without: [
    { when: '7:12 PM', what: 'A new patient calls. The office is closed, so the call goes to voicemail.' },
    { when: '7:20 PM', what: 'They fill out the contact form. It lands in a shared inbox.' },
    { when: '8:05 AM', what: 'The front desk calls back between check-ins. The patient already booked somewhere else.' },
  ],
  with: [
    { when: '7:12 PM', what: 'A new patient calls. Nobody can pick up.' },
    { when: '7:13 PM', what: 'They get a text from your practice with a link to book a consultation.' },
    { when: '7:16 PM', what: 'The consultation is on the calendar. The front desk sees the whole thread in the morning.' },
  ],
};

// What happens the moment someone reaches out.
const TIMELINE = [
  { when: 'Second 0', what: 'Someone calls, texts, or sends a form through your website.' },
  { when: 'Within 60 seconds', what: 'Nobody could pick up? They get a reply from your practice’s number with a way to book.' },
  { when: 'Same day', what: 'The consultation is booked online, or your front desk picks up the thread in the two-way text inbox.' },
  { when: 'After the visit', what: 'An automatic text asks for a review.' },
  { when: 'Every month', what: 'AxeonPROOF shows every recovered inquiry and booking, with a monthly report.' },
];

const COMMITMENT =
  'Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don’t fix it within 15 days, you can walk away and owe nothing for the rest of the term.';

export default function HowItWorksPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksJsonLd) }} />
      <BreadcrumbJsonLd items={[{ name: 'How it works', path: '/marketing-solutions' }]} />

      {/* 1. The promise */}
      <section className="bg-neutral-950 text-white pt-36 sm:pt-44 pb-20 sm:pb-28 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow label="How it works" onDark />
          <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight leading-[1.05] text-balance">
            Patient &amp; client intake, installed for you
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl mx-auto">
            Calls after hours and during busy mornings go to voicemail. Forms wait until tomorrow. Axeon answers every missed
            call and web inquiry within 60 seconds, 24/7, books the consultation, and asks every patient for a review after the
            visit.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <Link
              href="/audit"
              data-track="cta_click"
              data-track-cta="how_it_works_hero"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/30"
            >
              Get your free after-hours audit <ArrowUpRight size={16} />
            </Link>
            <Link href="/pricing" className="py-2 inline-flex items-center gap-2 font-semibold text-white/80 hover:text-white transition-colors">
              See pricing <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <ol className="mt-14 sm:mt-16 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {coreLayers.map((layer, i) => (
            <li key={layer.id} className="flex items-center gap-2 sm:gap-3">
              <a
                href={`#${layer.id}`}
                className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-sm sm:text-base font-bold transition-colors"
              >
                {layer.title}
              </a>
              {i < coreLayers.length - 1 && <ArrowRight size={16} className="text-blue-400" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </section>

      {/* 2. The problem, as one example evening */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <Eyebrow label="The problem" />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1] text-balance">
              The patient books with whoever answers first.
            </h2>
            <p className="mt-5 text-lg text-neutral-600 leading-relaxed">
              Most practices do not need more traffic first. They need every call and inquiry they already get answered before
              the person moves on. Here is one example evening.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-neutral-200 p-6 sm:p-8">
              <p className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">Example: without Axeon</p>
              <ol className="mt-6 space-y-5">
                {EVENING.without.map((e) => (
                  <li key={e.when} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                    <span className="font-mono text-sm font-bold text-neutral-400">{e.when}</span>
                    <span className="text-neutral-700 leading-relaxed">{e.what}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl bg-neutral-950 text-white p-6 sm:p-8">
              <p className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">Example: with Axeon</p>
              <ol className="mt-6 space-y-5">
                {EVENING.with.map((e) => (
                  <li key={e.when} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                    <span className="font-mono text-sm font-bold text-blue-300">{e.when}</span>
                    <span className="text-neutral-200 leading-relaxed">{e.what}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The three AxeonCORE layers */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <Eyebrow label="AxeonCORE · from $799/mo" />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
              Three layers. One team installs and runs all of them.
            </h2>
          </div>
          <div className="mt-14 flex flex-col gap-5">
            {coreLayers.map((layer) => (
              <article
                key={layer.id}
                id={layer.id}
                className="scroll-mt-28 rounded-3xl bg-white border border-neutral-200 p-7 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-10 items-start"
              >
                <div className="md:col-span-5">
                  <p className="text-sm font-semibold text-neutral-400">{layer.step}</p>
                  <h3 className="mt-1 text-3xl sm:text-4xl font-black font-display tracking-tight">{layer.title}</h3>
                  <p className="mt-3 text-lg font-semibold text-neutral-900 leading-snug">{layer.promise}</p>
                  <p className="mt-4 text-neutral-600 leading-relaxed">{layer.problem}</p>
                </div>
                <div className="md:col-span-7">
                  <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
                    {layer.includes.map((item) => (
                      <li key={item} className="flex gap-3 py-3.5 text-neutral-800">
                        <Check size={18} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {layer.note && <p className="mt-4 text-sm text-neutral-500 leading-relaxed">{layer.note}</p>}
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
                    {layer.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="py-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {link.label} <ArrowRight size={14} />
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 text-neutral-600">
            Also in AxeonCORE: the AxeonPROOF client portal, and one practice per specialty within 5 miles while your account is
            in good standing.
          </p>
        </div>
      </section>

      {/* 4. The GROWTH acquisition layer */}
      <section id={growthLayer.id} className="scroll-mt-28 py-24 sm:py-32 px-4 sm:px-8 bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <Eyebrow label={growthLayer.plan} onDark />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
              {growthLayer.title}
            </h2>
            <p className="mt-5 text-lg text-neutral-300 leading-relaxed">{growthLayer.intro}</p>
            <p className="mt-5 text-sm font-semibold text-blue-300">{growthLayer.price}</p>
            <div className="mt-6 flex flex-col items-start gap-1">
              {growthLayer.links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="py-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-blue-300"
                >
                  {link.label} <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
          <ul className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
            {growthLayer.includes.map((item) => (
              <li key={item} className="flex gap-3 py-4 text-neutral-100">
                <Check size={18} className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. What happens the moment someone reaches out */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <Eyebrow label="Minute by minute" />
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold font-display tracking-tight leading-[1.1]">
            What happens the moment someone reaches out
          </h2>
          <ol className="mt-14 border-l border-neutral-200 ml-2">
            {TIMELINE.map((t) => (
              <li key={t.when} className="relative pl-8 sm:pl-10 pb-10 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <p className="text-sm font-bold tracking-wide uppercase text-blue-600">{t.when}</p>
                <p className="mt-2 text-lg sm:text-xl text-neutral-700 leading-relaxed">{t.what}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Commitment, territory, ownership */}
      <section className="py-20 sm:py-24 px-4 sm:px-8 bg-[#F7F6F3] border-y border-neutral-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-neutral-200 p-7">
            <ShieldCheck size={26} className="text-blue-600" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-extrabold font-display tracking-tight">90-day performance commitment</h3>
            <p className="mt-3 text-neutral-600 leading-relaxed">{COMMITMENT}</p>
          </div>
          <div className="rounded-3xl bg-white border border-neutral-200 p-7">
            <MapPin size={26} className="text-blue-600" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-extrabold font-display tracking-tight">Territory exclusivity</h3>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              One practice per specialty within 5 miles, while your account is in good standing. We will not install the same
              system for the practice down the street.
            </p>
          </div>
          <div className="rounded-3xl bg-white border border-neutral-200 p-7">
            <KeyRound size={26} className="text-blue-600" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-extrabold font-display tracking-tight">What you own</h3>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Your domain, Google Business Profile and patient or client contact data are always yours. The website design and
              code become yours once the 12-month term is paid. The intake system, phone and text numbers and AxeonPROOF are a
              service and stop if you leave.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Proof we can honestly show: the audit and the portal */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href="/audit"
            data-track="cta_click"
            data-track-cta="how_it_works_audit_card"
            className="group rounded-3xl bg-blue-600 text-white p-8 sm:p-10 flex flex-col justify-between gap-8 hover:bg-blue-700 transition-colors"
          >
            <div>
              <p className="text-xs font-mono font-bold tracking-widest uppercase text-blue-100">[ SEE IT ON YOUR OWN PRACTICE ]</p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
                The free after-hours audit
              </h2>
              <p className="mt-3 text-blue-50 leading-relaxed">
                We call your practice after hours, check how fast your website answers an inquiry, and compare your reviews to
                the top 3 nearby practices. You get a short video walkthrough of what we found. No charge.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 font-semibold">
              Get your free audit <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
          <Link
            href="/axeonproof"
            className="group rounded-3xl border border-neutral-200 p-8 sm:p-10 flex flex-col justify-between gap-8 hover:border-blue-300 transition-colors"
          >
            <div>
              <Eyebrow label="AxeonPROOF" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-snug">
                The portal every client gets
              </h2>
              <p className="mt-3 text-neutral-600 leading-relaxed">
                A live counter of recovered inquiries, change requests and a monthly report. You see every reply and every
                booking, not a summary we wrote.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 font-semibold text-blue-600">
              Tour AxeonPROOF <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      <ServiceClosingCta trackId="how_it_works" />
    </main>
  );
}
