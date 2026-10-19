import BookClient from './BookClient';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata = buildMetadata({
  path: '/book',
  title: 'Book a Call | Axeon Studio',
  description:
    'Book a free 30-minute call with Axeon Studio. We look at how your practice answers calls and web inquiries today, where patients and clients slip away, and what AxeonCORE would change.',
});

export default function BookPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Book a Call', path: '/book' }]} />
      <BookClient />
    </>
  );
}
