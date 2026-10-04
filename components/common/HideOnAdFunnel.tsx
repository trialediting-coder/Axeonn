'use client';

import { usePathname } from 'next/navigation';
import { isAdFunnelPath } from '@/lib/adFunnel';

/** Renders its children everywhere except the /go ad landing pages. */
export function HideOnAdFunnel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAdFunnelPath(pathname)) return null;
  return <>{children}</>;
}
