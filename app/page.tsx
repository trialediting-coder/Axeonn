import { Hero } from '@/components/home/Hero';
import { IntegrationsMarquee } from '@/components/home/IntegrationsMarquee';
import { WhoWeHelp } from '@/components/home/WhoWeHelp';
import { ThreePillars } from '@/components/home/ThreePillars';
import { HomeProof } from '@/components/home/HomeProof';
import { OfficeTest } from '@/components/home/OfficeTest';
import { HomeGuides } from '@/components/home/HomeGuides';
import { PricingSection } from '@/components/PricingSection';
import { HomePricing } from '@/components/home/HomePricing';
import { FAQ } from '@/components/home/FAQ';
import { Contact } from '@/components/home/Contact';

// The guides strip reads the posts table; refresh it hourly like /insights.
export const revalidate = 3600;

export default function HomePage() {
  // No preload() for the hero photo: the hint rode in this route's RSC payload,
  // which <Link href="/"> prefetches site-wide, so every page downloaded it. The
  // hero <img fetchPriority="high"> is enough for the homepage LCP.
  return (
    // Each section fills at least one screen (owner, 2026-10-21: "this section fills
    // your entire screen, it has a purpose"); see .home-screens in globals.css.
    <main className="home-screens">
      {/* Purpose: the result we sell, for all four verticals, and the one next step. */}
      <Hero />
      {/* Purpose: the platforms Axeon is integrated with. */}
      <IntegrationsMarquee />
      {/* Layout 2026-10-22 (owner): what we do, then AxeonPROOF as the trust signal
          (no practice results yet), the free office test, who we help, pricing. */}
      <ThreePillars />
      <HomeProof />
      <OfficeTest />
      <WhoWeHelp />
      {/* Pricing: the full block on desktop (owner, 2026-10-22: "desktop is fine"),
          the compact two-card version on phones. The FAQ below already answers
          cost and the commitment, so the full block skips its own FAQ here. */}
      <div className="hidden sm:block">
        <PricingSection showFaq={false} />
      </div>
      <div className="sm:hidden">
        <HomePricing />
      </div>
      <FAQ />
      <Contact />
      <HomeGuides />
    </main>
  );
}
