'use client';

import { usePathname } from 'next/navigation';
import { hidesSiteChrome } from '@/lib/adFunnel';

/** Renders its children everywhere except the /go ad landing pages and the /welcome client portal. */
export function HideOnAdFunnel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (hidesSiteChrome(pathname)) return null;
  return <>{children}</>;
}
