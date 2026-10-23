'use client';

import { usePathname } from 'next/navigation';

// usePathname() for the public site. On the prerendered production homepage
// Next reports "/index" instead of "/" (the RSC payload carries ["", "index"]),
// so "is this the homepage?" checks failed there while working in dev: the
// header opened in its light-page colors over the dark hero (2026-10-23).
export function useSitePathname(): string {
  const pathname = usePathname() ?? '/';
  return pathname === '/index' ? '/' : pathname;
}
