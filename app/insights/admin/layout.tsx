import type { Metadata } from 'next';

// The admin dashboard, editor, and login screen must never be indexed.
// middleware.ts already redirects unauthenticated hits on everything except
// /insights/admin/login, so this is what keeps the login page itself out of
// search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function InsightsAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
