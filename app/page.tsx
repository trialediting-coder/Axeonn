import { preload } from 'react-dom';
import { Hero } from '@/components/home/Hero';
import { WhoWeHelp } from '@/components/home/WhoWeHelp';
import { ThreePillars } from '@/components/home/ThreePillars';
import { Platform } from '@/components/home/Platform';
import { PlatformShowcase } from '@/components/home/PlatformShowcase';
import { Comparison } from '@/components/home/Comparison';
import { WhyAxeonTeaser } from '@/components/home/WhyAxeonTeaser';
import { PricingSection } from '@/components/PricingSection';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { FAQ } from '@/components/home/FAQ';
import { Contact } from '@/components/home/Contact';

export default function HomePage() {
  // The hero video's poster is the homepage LCP element; hint it before the
  // client bundle and the hero video start competing for bandwidth.
  preload('/hero-poster.webp', { as: 'image', fetchPriority: 'high' });

  return (
    <main>
      <Hero />
      <WhoWeHelp />
      <ThreePillars />
      <PlatformShowcase />
      <PricingSection />
      <Comparison />
      <Platform />
      <WhyAxeonTeaser />
      <WhyChooseUs />
      <FAQ />
      <Contact />
    </main>
  );
}
