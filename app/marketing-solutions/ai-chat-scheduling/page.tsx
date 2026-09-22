import Link from 'next/link';
import { ArrowLeft, ArrowRight, MessageCircle, CalendarCheck, Mic2 } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { providerRef, SERVICE_AREA } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { AudioOrbPlayer } from '@/components/why-axeon/AudioOrbPlayer';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';

export const metadata = buildMetadata({
  path: '/marketing-solutions/ai-chat-scheduling',
  title: 'AI Chat & Online Scheduling | Axeon Studio',
  description:
    'Never miss a lead — 24/7 AI chat that books, answers, and converts clicks to customers. Listen to a real recorded call from Axeon’s AI receptionist.',
});

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Answers Instantly',
    description:
      'Every call and chat gets picked up around the clock, so a lead never sits waiting on a callback that comes too late.',
  },
  {
    icon: CalendarCheck,
    title: 'Books Real Appointments',
    description:
      'The AI checks your calendar and puts qualified leads directly on your schedule — no back-and-forth texts to lock in a time.',
  },
  {
    icon: Mic2,
    title: 'Sounds Natural',
    description:
      'Built to hold an actual conversation instead of reading a script, so callers stay on the line long enough to get booked.',
  },
];

const aiChatFaqItems = [
  {
    question: 'Will it sound like a robot?',
    answer:
      "Listen for yourself above — that's a real recorded call from Axeon's AI receptionist next to a typical agency's, so you can judge the difference directly instead of taking our word for it.",
  },
  {
    question: 'Can it actually book appointments, or just answer questions?',
    answer:
      "It checks your real calendar and books qualified leads directly onto it — it's not just a chatbot that collects an email and passes it along.",
  },
  {
    question: 'Does this replace my front desk?',
    answer:
      "It's built to catch what would otherwise go to voicemail or a missed chat — most clients use it as always-on backup and after-hours coverage, not a full front-desk replacement.",
  },
];

const aiChatSchedulingServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'AI Chat & Online Scheduling',
  name: 'Axeon Studio — AI Chat & Online Scheduling',
  url: 'https://axeonstudio.co/marketing-solutions/ai-chat-scheduling',
  description:
    'Never miss a lead — 24/7 AI chat that books, answers, and converts clicks to customers. Listen to a real recorded call from Axeon’s AI receptionist.',
  provider: providerRef,
  areaServed: SERVICE_AREA,
};

export default function AIChatSchedulingPage() {
  return (
    <main className="w-full bg-neutral-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aiChatSchedulingServiceJsonLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketing Solutions', path: '/marketing-solutions' },
          { name: 'AI Chat & Online Scheduling', path: '/marketing-solutions/ai-chat-scheduling' },
        ]}
      />
      {/* Hero */}
      <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
        {/* TEMPORARY placeholder background — replace before launch, see public/temp-scorpion-refs */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/temp-scorpion-refs/ai-chat-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <Link
            href="/marketing-solutions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Marketing Solutions
          </Link>

          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            AI Chat &amp; Online Scheduling
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Never miss a lead, even after hours.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-10">
            24/7 AI chat that books, answers, and converts clicks to customers — so every website visitor and
            missed call turns into a real conversation instead of a lost opportunity.
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
        </div>
      </section>

      {/* Real Audio Comparison */}
      <section className="relative w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white overflow-hidden border-t border-neutral-900">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
            Same Job. Listen To The Difference.
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display leading-[1.1] mb-5">
            Real recorded calls, not scripted demos.
          </h2>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Press play on each to hear how a typical agency&apos;s AI handles a call versus Axeon&apos;s AI
            receptionist — same job, two very different experiences for the caller.
          </p>

          <div className="mt-14 grid sm:grid-cols-2 gap-10 sm:gap-16 justify-items-center items-center bg-neutral-900/60 rounded-3xl border border-neutral-800 py-14 px-6 sm:px-8">
            <AudioOrbPlayer
              variant="flat"
              src="/audio/competitor-ai-call.mp3"
              label="Typical Agency AI"
            />
            <AudioOrbPlayer variant="orb" src="/audio/axeon-ai-call.mp3" label="Axeon's AI" />
          </div>
        </div>
      </section>

      {/* Mid-Page CTA */}
      <div className="text-center py-12 sm:py-16 bg-neutral-950 border-t border-neutral-900">
        <p className="text-neutral-400 mb-4">Ready to hear it answering calls for your business?</p>
        <Link href="/book" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
          Book a Strategy Call
        </Link>
      </div>

      {/* Feature Grid */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-white text-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-600 uppercase mb-3">
              What It Does
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.14]">
              One system, handling every lead
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-[32px] bg-neutral-50 border border-neutral-200/80 p-8 sm:p-10 flex flex-col"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-6">
                    <Icon size={24} strokeWidth={2.4} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-neutral-500 mt-12 sm:mt-14">
            Every conversation it handles flows into the same lead pipeline —{' '}
            <Link
              href="/marketing-solutions/lead-generation"
              className="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-semibold"
            >
              see how that works
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-white text-neutral-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-10">
            Common Questions
          </h2>
          <FAQAccordion items={[...aiChatFaqItems, ...faqItems]} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to stop missing leads?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Your Business. Your Partner.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a strategy session and we&apos;ll walk through exactly how AI chat and scheduling would work
            for your business.
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
            className="inline-flex items-center gap-1.5 mt-8 text-sm text-neutral-400 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            See exactly how we compare to a typical agency
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
