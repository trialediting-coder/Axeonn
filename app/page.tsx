import { Hero } from '@/components/home/Hero';
import { IntegrationsMarquee } from '@/components/home/IntegrationsMarquee';
import { WhoWeHelp } from '@/components/home/WhoWeHelp';
import { ThreePillars } from '@/components/home/ThreePillars';
import { HomeProof } from '@/components/home/HomeProof';
import { GrowthEngine } from '@/components/common/GrowthEngine';
import { Comparison } from '@/components/home/Comparison';
import { PricingSection } from '@/components/PricingSection';
import { FAQ } from '@/components/home/FAQ';
import { Contact } from '@/components/home/Contact';

export default function HomePage() {
  // No preload() for the hero photo: the hint rode in this route's RSC payload,
  // which <Link href="/"> prefetches site-wide, so every page downloaded it. The
  // hero <img fetchPriority="high"> is enough for the homepage LCP.
  return (
    // Each section fills at least one screen (owner, 2026-10-21: "this section fills
    // your entire screen, it has a purpose"); see .home-screens in globals.css.
    <main className="home-screens">
      {/* First screen: hero plus the integrations strip, together exactly one screen tall at minimum. */}
      <div className="flex min-h-[100dvh] flex-col">
        {/* Purpose: the result we sell, for all four verticals, and the one next step. */}
        <Hero />
        {/* Purpose: the platforms Axeon is integrated with. */}
        <IntegrationsMarquee />
      </div>
      <WhoWeHelp />
      <HomeProof />
      <ThreePillars />
      {/* The homepage FAQ below already answers cost, the commitment and which plan
          to pick, so the pricing block skips its own FAQ here (it stays on /pricing). */}
      <PricingSection showFaq={false} />
      <GrowthEngine showBuilds={false} />
      <Comparison />
      <FAQ />
      <Contact />
    </main>
  );
}
