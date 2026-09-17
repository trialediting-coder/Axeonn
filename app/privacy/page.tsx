import PrivacyClient from './PrivacyClient';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/privacy',
  title: 'Privacy Policy | Axeon Studio',
  description:
    'Read the official Axeon Studio Privacy Policy. Understand how we collect, handle, and protect your personal and business data.',
});

export default function PrivacyPage() {
  return <PrivacyClient />;
}
