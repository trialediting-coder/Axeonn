import AboutClient from './AboutClient';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/about',
  title: "Iowa's First AI-Forward Digital Agency | Axeon Studio",
  description:
    'Meet Axeon Studio, founded by Hayder Hatem in West Des Moines, Iowa. Direct builders, 7-14 day delivery timeline, zero agency fluff.',
});

export default function AboutPage() {
  return <AboutClient />;
}
