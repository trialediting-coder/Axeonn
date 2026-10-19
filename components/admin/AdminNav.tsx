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
import { ActiveTabIntoView } from '@/components/proof/ActiveTabIntoView';

const TABS = [
  { href: '/admin/calls', label: 'Calls', match: (p: string) => p.startsWith('/admin/calls') },
  { href: '/admin/audits', label: 'Audits', match: (p: string) => p.startsWith('/admin/audits') },
  { href: '/admin/agreements', label: 'Agreements', match: (p: string) => p.startsWith('/admin/agreements') },
  { href: '/admin/partners', label: 'Partners', match: (p: string) => p.startsWith('/admin/partners') },
  { href: '/admin/onboarding', label: 'Onboarding', match: (p: string) => p.startsWith('/admin/onboarding') },
  { href: '/admin/data', label: 'Data', match: (p: string) => p.startsWith('/admin/data') },
  { href: '/admin/billing', label: 'Billing', match: (p: string) => p.startsWith('/admin/billing') },
  { href: '/admin/emails', label: 'Emails', match: (p: string) => p.startsWith('/admin/emails') },
  { href: '/admin', label: 'Posts', match: (p: string) => p === '/admin' || p.startsWith('/admin/posts') },
];

export function AdminNav() {
  const pathname = usePathname() ?? '';
  if (pathname === '/admin/login') return null;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      {/* Phone: brand + sign out on one row, the section tabs scroll sideways on
          a second. From sm up the tabs sit inline between them. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-4 sm:h-14 sm:flex-nowrap sm:px-8">
        <Link href="/admin/onboarding" className="flex h-12 items-center gap-2.5 shrink-0 sm:h-auto" aria-label="Axeon Admin home">
          <AxeonLogo size="sm" />
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Admin
          </span>
        </Link>

        <nav
          aria-label="Admin sections"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] min-w-0 items-center gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:order-none sm:mx-0 sm:ml-2 sm:w-auto sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
          <ActiveTabIntoView key={pathname} />
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Wrapped: btn() sets inline-flex, which would beat a bare `hidden`. */}
          <span className="hidden sm:contents">
            <a href="https://axeonstudio.co" target="_blank" rel="noreferrer" className={btn('ghost', 'sm')}>
              View site <ExternalLink size={13} />
            </a>
          </span>
          <form action={signOutAction}>
            <button type="submit" className={btn('secondary', 'sm')} aria-label="Sign out">
              <LogOut size={13} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
