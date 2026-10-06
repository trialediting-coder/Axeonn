import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { AudioOrbPlayer } from '@/components/why-axeon/AudioOrbPlayer';
import {
  Eyebrow,
  ServiceHero,
  ProblemSection,
  DeliverablesSection,
  CaseStudyProof,
  ServiceFaqSection,
  ServiceFaqJsonLd,
} from '@/components/marketing-solutions/SolutionSections';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';
import { aiChatDetail as d } from '@/data/solutionDetails';

const DESCRIPTION =
  'AI chat and online scheduling that answers visitors 24/7 and books qualified leads onto your calendar. Included in AxeonCORE.';

export const metadata = buildMetadata({
  path: '/marketing-solutions/ai-chat-scheduling',
  title: 'AI Chat & Online Scheduling | Axeon Studio',
  description: DESCRIPTION,
});

const jsonLd = serviceJsonLd({
  path: '/marketing-solutions/ai-chat-scheduling',
  serviceType: 'AI Chat & Online Scheduling',
  name: 'Axeon Studio — AI Chat & Online Scheduling',
  description: DESCRIPTION,
});

export default function AIChatSchedulingPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Services', path: '/marketing-solutions' },
          { name: 'AI Chat & Online Scheduling', path: '/marketing-solutions/ai-chat-scheduling' },
        ]}
      />
      <ServiceFaqJsonLd items={d.faqs} />

      <ServiceHero
        image="/temp-scorpion-refs/ai-chat-hero.webp"
        eyebrow="Services · AI Chat & Scheduling"
        title="Never miss a lead, even after hours."
        subtitle="Answers questions and books appointments on your site 24/7, so after-hours visitors don't go to whoever answers first."
        priceLine="Included in AxeonCORE, $299/mo"
        note="AI chat, scheduling and follow-up in one build"
      />
      <ProblemSection data={d.problem} />
      <DeliverablesSection detail={d} />

      {/* Included in AxeonGROWTH, an add-on otherwise: kept below the core offer on purpose. */}
      <section className="w-full px-4 sm:px-8 lg:px-16 py-16 sm:py-24 bg-white text-neutral-950">
        <div className="max-w-5xl mx-auto rounded-3xl bg-neutral-950 text-white px-6 py-12 sm:px-12 sm:py-14 text-center">
          <Eyebrow label="Add-on" onDark className="mb-4" />
          <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-[1.15] text-balance">
            AI phone receptionist: included in AxeonGROWTH, or +$199/mo
          </h2>
          <p className="mt-4 text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Want your phone answered the same way? Hear a real recorded call from Axeon&apos;s AI receptionist next to a
            typical agency&apos;s, and judge the difference yourself.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 gap-10 sm:gap-16 justify-items-center items-center">
            <AudioOrbPlayer variant="flat" src="/audio/competitor-ai-call.mp3" label="Typical Agency AI" />
            <AudioOrbPlayer variant="orb" src="/audio/axeon-ai-call.mp3" label="Axeon's AI" />
          </div>
        </div>
      </section>

      {d.proof && <CaseStudyProof data={d.proof} />}
      <ServiceFaqSection heading="Common Questions About AI Chat" faqs={d.faqs} />
      <ServiceClosingCta trackId="service_ai_chat" />
    </main>
  );
}
