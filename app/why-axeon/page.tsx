import WhyAxeonClient from './WhyAxeonClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/why-axeon',
  title: 'Des Moines Marketing Agency vs. Typical Agency | Axeon Studio',
  description:
    'Typical agency vs. Axeon, side by side: who gets your Des Moines business found, chosen and booked. Backed by the 90-Day Customer Guarantee.',
});

export default function WhyAxeonPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Why Axeon', path: '/why-axeon' }]} />
      <WhyAxeonClient />
    </>
  );
}
