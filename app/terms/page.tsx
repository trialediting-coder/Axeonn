import TermsClient from './TermsClient';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/terms',
  title: 'Terms of Service | Axeon Studio',
  description:
    'The Axeon Studio Terms of Service: how our practice website and intake services work, the 12-month term, ownership, the 90-day performance commitment, and our no-health-information rule.',
});

export default function TermsPage() {
  return <TermsClient />;
}
