import type { Metadata } from 'next';

// AxeonPROOF, the client dashboard. Shown at app.axeonstudio.co (middleware
// rewrites "/" to this route). Private: never indexed.
export const metadata: Metadata = {
  title: { absolute: 'AxeonPROOF' },
  robots: { index: false, follow: false, nocache: true },
  // Installable, so an iPhone can get lead notifications (iOS only pushes to Home Screen apps).
  manifest: '/proof.webmanifest',
  appleWebApp: { capable: true, title: 'AxeonPROOF', statusBarStyle: 'default' },
};

export default function ProofLayout({ children }: { children: React.ReactNode }) {
  return children;
}
