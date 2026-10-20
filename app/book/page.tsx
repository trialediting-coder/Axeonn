import BookClient from './BookClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/book',
  title: 'Book a Call With Axeon Studio | West Des Moines',
  description:
    'Book a free 30-minute call with Axeon Studio. We look at how your practice or firm answers calls and inquiries today and what would change. Des Moines, Iowa.',
});

export default function BookPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Book a Call', path: '/book' }]} />
      <BookClient />
    </>
  );
}
