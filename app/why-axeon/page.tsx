import WhyAxeonClient from './WhyAxeonClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/why-axeon',
  title: 'Why Axeon: Intake vs. a Typical Practice Website | Axeon Studio',
  description:
    'A typical agency builds your practice a website. Axeon installs the intake behind it: 60-second replies, consultation booking and review requests, with a 90-day performance commitment.',
});

export default function WhyAxeonPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Why Axeon', path: '/why-axeon' }]} />
      <WhyAxeonClient />
    </>
  );
}
