import WhyAxeonClient from './WhyAxeonClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/why-axeon',
  title: 'Why Axeon: More Than a Website | Axeon Studio',
  description:
    'A typical agency builds a website. Axeon runs the intake behind it for Des Moines practices and firms: 60-second replies, online booking and review requests.',
});

export default function WhyAxeonPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Why Axeon', path: '/why-axeon' }]} />
      <WhyAxeonClient />
    </>
  );
}
