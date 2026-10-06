import BookClient from './BookClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/book',
  title: 'Book a Strategy Session | Axeon Studio',
  description:
    'Schedule a free 1-on-1 strategy session with Axeon Studio in West Des Moines, Iowa, and see exactly how we would get your business more customers.',
});

export default function BookPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Book a Free Call', path: '/book' }]} />
      <BookClient />
    </>
  );
}
