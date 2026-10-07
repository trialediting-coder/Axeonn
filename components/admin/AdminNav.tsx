'use client';

// components/admin/AdminNav.tsx
// The admin's own top bar: brand, section tabs, and sign out. Rendered by
// app/admin/layout.tsx on every admin page except the login screen. The site's
// marketing header and footer are hidden on /admin (lib/adFunnel.ts).

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/admin/actions';
import { btn } from '@/components/admin/ui';
import { AxeonLogo } from '@/components/brand/AxeonLogo';

const TABS = [
  { href: '/admin/onboarding', label: 'Onboarding', match: (p: string) => p.startsWith('/admin/onboarding') },
  { href: '/admin/billing', label: 'Billing', match: (p: string) => p.startsWith('/admin/billing') },
  { href: '/admin', label: 'Posts', match: (p: string) => p === '/admin' || p.startsWith('/admin/posts') },
];

export function AdminNav() {
  const pathname = usePathname() ?? '';
  if (pathname === '/admin/login') return null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-8">
        <Link href="/admin/onboarding" className="flex items-center gap-2.5 shrink-0" aria-label="Axeon Admin home">
          <AxeonLogo size="sm" />
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Admin
          </span>
        </Link>

        <nav aria-label="Admin sections" className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <a href="https://axeonstudio.co" target="_blank" rel="noreferrer" className={`${btn('ghost', 'sm')} hidden sm:inline-flex`}>
            View site <ExternalLink size={13} />
          </a>
          <form action={signOutAction}>
            <button type="submit" className={btn('secondary', 'sm')}>
              <LogOut size={13} /> Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
