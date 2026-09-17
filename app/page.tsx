import { Hero } from '@/components/home/Hero';
import { WhoWeHelp } from '@/components/home/WhoWeHelp';
import { Platform } from '@/components/home/Platform';
import { PlatformShowcase } from '@/components/home/PlatformShowcase';
import { Comparison } from '@/components/home/Comparison';
import { WhyAxeonTeaser } from '@/components/home/WhyAxeonTeaser';
import { PricingSection } from '@/components/PricingSection';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { FAQ } from '@/components/home/FAQ';
import { Contact } from '@/components/home/Contact';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Platform />
      <PlatformShowcase />
      <WhoWeHelp />
      <Comparison />
      <WhyAxeonTeaser />
      <PricingSection />
      <WhyChooseUs />
      <FAQ />
      <Contact />
    </main>
  );
}
