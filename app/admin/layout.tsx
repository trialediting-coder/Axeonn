import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/AdminNav';
import { VersionTag } from '@/components/common/VersionTag';
import { DASHBOARD_VERSIONS } from '@/data/dashboardVersions';

// The admin dashboard, editor, and login screen must never be indexed.
// middleware.ts already redirects unauthenticated hits on everything except
// /admin/login, so this is what keeps the login page itself out of
// search results.
export const metadata: Metadata = {
  title: { absolute: 'Axeon Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      {children}
      <footer className="mx-auto max-w-6xl px-4 pb-6 sm:px-8">
        <VersionTag version={DASHBOARD_VERSIONS.admin} />
      </footer>
    </>
  );
}
