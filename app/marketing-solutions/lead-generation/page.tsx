import Link from 'next/link';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import {
  ArrowLeft,
  ArrowRight,
  Inbox,
  Zap,
  ShieldCheck,
  Users2,
  PhoneCall,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
} from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { TrustBadges } from '@/components/common/TrustBadges';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';

export const metadata = buildMetadata({
  path: '/marketing-solutions/lead-generation',
  title: 'Lead Generation & Follow-Up Automation | Axeon Studio',
  description:
    'Every lead captured and followed up automatically. One unified pipeline replaces the disconnected apps and logins of a typical agency stack, so no inquiry falls through the cracks.',
});

const FEATURES = [
  {
    icon: Inbox,
    title: 'One Unified Pipeline',
    description:
      'Calls, form fills, chats, and texts all land in the same system instead of being scattered across a dozen separate apps, inboxes, and logins.',
  },
  {
    icon: Zap,
    title: 'Automatic Follow-Up',
    description:
      'The moment someone reaches out, follow-up starts. No lead sits waiting on a callback that gets pushed to the bottom of the pile.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing Falls Through the Cracks',
    description:
      'Every inquiry is tracked from first contact through to a booked appointment, so a lead never quietly goes cold because a browser tab got closed.',
  },
  {
    icon: Users2,
    title: 'One Team, Not a Vendor Stack',
    description:
      'Instead of ten apps, ten subscriptions, and ten logins, every one of those workflows is absorbed into one Custom CRM Pipeline. You only ever deal with us.',
  },
];

const SCATTERED_SOURCES = [
  { icon: PhoneCall, label: 'Calls' },
  { icon: Mail, label: 'Email' },
  { icon: MessageSquare, label: 'Chat' },
  { icon: Calendar, label: 'Bookings' },
  { icon: FileText, label: 'Forms' },
];

const leadGenFaqItems = [
  {
    question: 'Does this replace my existing CRM?',
    answer:
      "It replaces the need for a separate per-seat CRM subscription — your Custom CRM Pipeline is built into your site and run by us, so you're not paying for and managing another piece of software.",
  },
  {
    question: "What counts as a 'lead' in this system?",
    answer:
      'Every call, form fill, chat, and text — anything that comes in through your site or listed number funnels into the same pipeline instead of being scattered across different tools.',
  },
  {
    question: 'Do I still have to check it manually?',
    answer:
      'No — follow-up starts automatically the moment someone reaches out, so nothing waits on you to notice it.',
  },
];

const leadGenerationServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Lead Generation & Follow-Up Automation',
  name: 'Axeon Studio — Lead Generation & Follow-Up Automation',
  url: 'https://axeonstudio.co/marketing-solutions/lead-generation',
  description:
    'Every lead captured and followed up automatically. One unified pipeline replaces the disconnected apps and logins of a typical agency stack, so no inquiry falls through the cracks.',
  provider: providerRef,
  areaServed: SERVICE_AREA,
};

export default function LeadGenerationPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leadGenerationServiceJsonLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketing Solutions', path: '/marketing-solutions' },
          { name: 'Lead Generation', path: '/marketing-solutions/lead-generation' },
        ]}
      />
      {/* Hero */}
      <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
        {/* TEMPORARY placeholder background — replace before launch, see public/temp-scorpion-refs */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/temp-scorpion-refs/lead-generation-hero-v2.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <Link
            href="/marketing-solutions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
            Back to Marketing Solutions
          </Link>
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Lead Generation
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Every lead captured. Every lead followed up. Automatically.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-10">
            Most agencies hand you a pile of disconnected tools and hope you keep up with all of
            them. We built one pipeline that catches every call, form, and chat the moment it
            comes in, and follows up automatically before the lead has time to go cold.
          </p>
          <ServiceHeroActions priceLine="Included in AxeonCORE, $5,800 flat" note="a Custom CRM Pipeline built around your workflow" />
          <div className="flex justify-center">
            <TrustBadges variant="dark" />
          </div>
        </div>
      </section>

      {/* Scattered tools vs. unified pipeline visual */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-mono font-semibold tracking-widest text-blue-600 uppercase mb-4">
              The Problem With Most Setups
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 leading-[1.1]">
              A dozen tools. A dozen logins. One overwhelmed inbox.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-10">
            {/* Scattered */}
            <div>
              <div className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase mb-3 text-center">
                Typical Lead Intake
              </div>
              <div
                className="relative h-72 rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden"
                style={{
                  backgroundImage: 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              >
                <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-4 sm:gap-8 p-5 sm:p-8">
                  {SCATTERED_SOURCES.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="w-16 h-16 rounded-2xl bg-white border border-neutral-300 shadow-sm flex flex-col items-center justify-center gap-1"
                    >
                      <Icon size={20} className="text-neutral-500" />
                      <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
                Every channel lives in its own app. Someone has to manually check each one, and a
                lead that comes in overnight can sit untouched until morning.
              </p>
            </div>

            {/* Unified */}
            <div>
              <div className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase mb-3 text-center">
                Axeon Lead Pipeline
              </div>
              <div className="relative h-72 rounded-3xl bg-neutral-950 overflow-hidden border border-neutral-800">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #1e3a8a 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                />
                <svg viewBox="0 0 100 65" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden="true">
                  {SCATTERED_SOURCES.map((_, i) => {
                    const angle = (i / SCATTERED_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
                    const x = 50 + 30 * Math.cos(angle);
                    const y = 32.5 + 24 * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={50}
                        y1={32.5}
                        x2={x}
                        y2={y}
                        stroke="#2563EB"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                </svg>
                {SCATTERED_SOURCES.map(({ icon: Icon, label }, i) => {
                  const angle = (i / SCATTERED_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 50 + 30 * Math.cos(angle);
                  const y = 32.5 + 24 * Math.sin(angle);
                  return (
                    <div
                      key={label}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/95 border border-blue-400/50 flex items-center justify-center"
                      style={{ left: `${x}%`, top: `${(y / 65) * 100}%` }}
                    >
                      <Icon size={17} className="text-neutral-700" />
                    </div>
                  );
                })}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                  <Zap size={26} className="text-white" strokeWidth={2.2} />
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
                Every channel feeds into one custom-developed platform. One place to see every
                lead, and one system that follows up the instant they arrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* In-content CTA */}
      <div className="text-center py-12 sm:py-16">
        <p className="text-neutral-600 mb-4">See what one unified pipeline would look like for your leads.</p>
        <Link href="/book" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
          Book a Strategy Call
        </Link>
      </div>

      {/* Feature grid */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-mono font-semibold tracking-widest text-blue-600 uppercase mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 leading-[1.1]">
              Built so no lead is ever left waiting.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-neutral-200/80 p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-blue-400/80 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                  <Icon size={22} className="text-blue-600" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight mb-3">
                  {title}
                </h3>
                <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed font-normal">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-neutral-500 mt-10">
            Every call your AI receptionist answers flows into this same pipeline —{' '}
            <Link
              href="/marketing-solutions/ai-chat-scheduling"
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-semibold"
            >
              see how that works together
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 mb-12 sm:mb-14 text-center">
            Common Questions
          </h2>
          <FAQAccordion items={[...leadGenFaqItems, ...faqItems]} defaultOpenCount={1} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to stop chasing scattered leads?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we&apos;ll walk through exactly how the lead pipeline and
            follow-up automation would work for your business.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-semibold text-sm transition-colors"
            >
              View Pricing
            </Link>
          </div>
          <Link
            href="/why-axeon"
            className="inline-flex items-center gap-2 mt-8 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            See exactly how we compare to a typical agency
            <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </section>
    </main>
  );
}
