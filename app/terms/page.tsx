import TermsClient from './TermsClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/terms',
  title: 'Terms of Service | Axeon Studio',
  description:
    'Axeon Studio Terms of Service: how our practice website and intake services work, the 12-month term, ownership and the 90-day performance commitment.',
});

export default function TermsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Terms of Service', path: '/terms' }]} />
      <TermsClient />
    </>
  );
}
