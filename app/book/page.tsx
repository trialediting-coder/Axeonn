import BookClient from './BookClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/book',
  title: 'Book a Strategy Session | Axeon Studio',
  description:
    'Schedule a 1-on-1 strategy session with Axeon Studio in West Des Moines, Iowa, and see how a Custom CRM Pipeline fits your business.',
});

export default function BookPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Book a Strategy Call', path: '/book' }]} />
      <BookClient />
    </>
  );
}
