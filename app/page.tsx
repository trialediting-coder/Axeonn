import { preload } from 'react-dom';
import { Hero } from '@/components/home/Hero';
import { IowaClientsMarquee } from '@/components/home/IowaClientsMarquee';
import { WhoWeHelp } from '@/components/home/WhoWeHelp';
import { ThreePillars } from '@/components/home/ThreePillars';
import { FeaturedWork } from '@/components/work/FeaturedWork';
import { GrowthEngine } from '@/components/common/GrowthEngine';
import { Comparison } from '@/components/home/Comparison';
import { PricingSection } from '@/components/PricingSection';
import { FAQ } from '@/components/home/FAQ';
import { Contact } from '@/components/home/Contact';

export default function HomePage() {
  // The hero video's poster is the homepage LCP element; hint it before the
  // client bundle and the hero video start competing for bandwidth.
  preload('/hero-poster.webp', { as: 'image', fetchPriority: 'high' });

  return (
    <main>
      <Hero />
      <IowaClientsMarquee />
      <FeaturedWork />
      <WhoWeHelp />
      <ThreePillars />
      <PricingSection />
      <GrowthEngine showBuilds={false} />
      <Comparison />
      <FAQ />
      <Contact />
    </main>
  );
}
