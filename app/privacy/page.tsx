import PrivacyClient from './PrivacyClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/privacy',
  title: 'Privacy Policy | Axeon Studio',
  description:
    'How Axeon Studio collects, uses and protects personal and business data on axeonstudio.co and in our intake services, and the privacy choices you have.',
});

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Privacy Policy', path: '/privacy' }]} />
      <PrivacyClient />
    </>
  );
}
