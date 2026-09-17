import WhyAxeonClient from './WhyAxeonClient';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/why-axeon',
  title: 'Axeon vs. a Typical Agency | Axeon Studio',
  description:
    'See how Axeon compares to a typical agency across web design, AI receptionist, data infrastructure, SEO/AEO/GEO, and automation.',
});

export default function WhyAxeonPage() {
  return <WhyAxeonClient />;
}
