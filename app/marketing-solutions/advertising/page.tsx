import Link from 'next/link';
import { ServiceHeroActions } from '@/components/common/ServiceHeroActions';
import { ArrowLeft, Search, Megaphone } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { TrustBadges } from '@/components/common/TrustBadges';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { withGeneralFaqs } from '@/data/faqData';
import {
  ProblemSection,
  DeliverablesSection,
  TimelineSection,
  ComparisonSection,
  ServiceFaqJsonLd,
} from '@/components/marketing-solutions/SolutionSections';
import { advertisingDetail } from '@/data/solutionDetails';

export const metadata = buildMetadata({
  path: '/marketing-solutions/advertising',
  title: 'Google Ads & Meta Ads Management | Axeon Studio',
  description:
    'Google Ads and Meta Ads management for local businesses, sent to pages built to convert, with every call, form, and booking tracked to the customer.',
});

const channels = [
  {
    tag: 'Google Ads',
    icon: Search,
    title: 'Catch Them While They’re Searching',
    description:
      'Search campaigns put you at the top of Google when someone nearby types in exactly what you do. These are the highest-intent clicks you can buy.',
  },
  {
    tag: 'Meta Ads',
    icon: Megaphone,
    title: 'Get in Front of Them Before They Search',
    description:
      'Facebook and Instagram campaigns build demand in your service area and retarget people who visited your site but didn’t book yet.',
  },
];

const advertisingServiceJsonLd = serviceJsonLd({
  path: '/marketing-solutions/advertising',
  serviceType: 'Pay-Per-Click Advertising Management',
  name: 'Axeon Studio — Google Ads & Meta Ads',
  description:
    'Google Ads (Search) and Meta Ads (Facebook & Instagram) campaign management for Des Moines-area businesses, with service-specific landing pages and conversion tracking for calls, forms, and bookings.',
});

export default function AdvertisingMarketingSolutionPage() {
  return (
    <main className="w-full bg-neutral-950 text-white">
      <JsonLd data={advertisingServiceJsonLd} />
      <ServiceFaqJsonLd items={advertisingDetail.faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketing Solutions', path: '/marketing-solutions' },
          { name: 'Advertising', path: '/marketing-solutions/advertising' },
        ]}
      />
      {/* Hero */}
      <section className="relative w-full min-h-screen min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 pb-16 bg-neutral-950 text-white overflow-hidden">
        {/* No hero photo yet; a soft brand glow stands in until one is shot. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(37,99,235,0.28), transparent 70%)' }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <Link
            href="/marketing-solutions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft size={15} />
            Back to Marketing Solutions
          </Link>

          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Marketing Solutions — Advertising
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Ads That Turn Into Booked Jobs, Not Just Clicks.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Google Ads and Meta Ads, built around the services you want more of, sent to pages made
            to convert, and tracked all the way to a call or a booking.
          </p>

          <div className="flex justify-center mb-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-blue-950/60 border border-blue-800">
              {['Google Ads', 'Meta Ads'].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  {tag}
                </span>
              ))}
              <span className="text-xs text-blue-300 font-medium ml-1">
                One team for your ads and your website
              </span>
            </div>
          </div>

          <ServiceHeroActions priceLine="Campaigns scoped to your market and goals" note="quoted on a free strategy call" showPricingLink={false} />

          <div className="flex justify-center">
            <TrustBadges variant="dark" />
          </div>
        </div>
      </section>

      <ProblemSection tone="dark" data={advertisingDetail.problem} />

      {/* Channel split: Google vs. Meta */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white border-t border-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase mb-4">
              Two Channels, One Strategy
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Catch buyers searching now. Reach them before they search.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.tag}
                  className="rounded-[32px] bg-neutral-900/60 border border-neutral-800 p-8 sm:p-10 flex flex-col hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                      {channel.tag}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
                    {channel.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    {channel.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-neutral-500 mt-10">
            Every paid lead is only worth it if someone answers it —{' '}
            <Link
              href="/marketing-solutions/lead-generation"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              see how we follow up automatically
            </Link>
            .
          </p>
        </div>
      </section>

      <DeliverablesSection tone="dark" alt data={advertisingDetail.deliverables} />
      <TimelineSection tone="dark" data={advertisingDetail.timeline} />
      <ComparisonSection tone="dark" alt data={advertisingDetail.comparison} />

      {/* FAQ */}
      <section className="w-full py-20 sm:py-28 px-6 sm:px-10 lg:px-16 xl:px-24 bg-white text-neutral-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-blue-600 uppercase mb-3">
              Questions
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950">
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={withGeneralFaqs(advertisingDetail.faqs)} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-950 text-white border-t border-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">
            Ready to make your ad spend count?
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
        </div>
      </section>
    </main>
  );
}
