import TermsClient from './TermsClient';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/terms',
  title: 'Terms of Service | Axeon Studio',
  description:
    'Review the Axeon Studio Terms of Service governing our modern web design, software development, AI systems, and automation client engagements.',
});

export default function TermsPage() {
  return <TermsClient />;
}
