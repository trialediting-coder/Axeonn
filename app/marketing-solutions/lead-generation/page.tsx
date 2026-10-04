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
import { withGeneralFaqs } from '@/data/faqData';
import {
  ProblemSection,
  DeliverablesSection,
  TimelineSection,
  ComparisonSection,
  CaseStudyProof,
  ServiceFaqJsonLd,
} from '@/components/marketing-solutions/SolutionSections';
import { leadGenDetail } from '@/data/solutionDetails';

export const metadata = buildMetadata({
  path: '/marketing-solutions/lead-generation',
  title: 'Lead Capture & Follow-Up Automation | Axeon Studio',
  description:
    'Lead capture and follow-up automation for local businesses: every call, form, and chat answered and followed up automatically, so no customer slips away.',
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

const leadGenerationServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Lead Capture & Follow-Up Automation',
  name: 'Axeon Studio — Lead Capture & Follow-Up Automation',
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
          { name: 'Lead Capture & Follow-Up', path: '/marketing-solutions/lead-generation' },
        ]}
      />
      <ServiceFaqJsonLd items={leadGenDetail.faqs} />
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
            Lead Capture & Follow-Up
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Every lead captured. Every lead followed up. Automatically.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-10">
            Most agencies hand you a pile of disconnected tools and hope you keep up with all of
            them. We built one pipeline that catches every call, form, and chat the moment it
            comes in, and follows up automatically before the lead has time to go cold.
          </p>
          <ServiceHeroActions priceLine="Included in AxeonCORE, from $5,800 setup" note="a Custom CRM Pipeline built around your workflow" />
          <div className="flex justify-center">
            <TrustBadges variant="dark" />
          </div>
        </div>
      </section>

      <ProblemSection data={leadGenDetail.problem} />

      {/* In-content CTA */}
      <div className="text-center py-12 sm:py-16">
        <p className="text-neutral-600 mb-4">See what one unified pipeline would look like for your leads.</p>
        <Link href="/book" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
          Book a Strategy Call
        </Link>
      </div>

      <DeliverablesSection data={leadGenDetail.deliverables} />
      <TimelineSection data={leadGenDetail.timeline} />
      <ComparisonSection data={leadGenDetail.comparison} />
      {leadGenDetail.proof && <CaseStudyProof data={leadGenDetail.proof} />}

      {/* FAQ */}
      <section id="faq" className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50/70">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 mb-12 sm:mb-14 text-center">
            Common Questions
          </h2>
          <FAQAccordion items={withGeneralFaqs(leadGenDetail.faqs)} defaultOpenCount={1} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to stop chasing scattered leads?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            More calls and leads in 90 days, or we keep working free.
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Book a free strategy call. You walk away with a custom homepage mockup and an AI visibility report for your business, whether or not you hire us.
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
