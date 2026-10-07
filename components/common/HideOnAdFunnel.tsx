'use client';

import { usePathname, useSelectedLayoutSegments } from 'next/navigation';
import { hidesSiteChrome } from '@/lib/adFunnel';

/**
 * Renders its children everywhere except the /go ad pages, the client portal, the
 * admin and AxeonPROOF. Checks both the URL and the rendered route, because the
 * app host shows AxeonPROOF (route /proof) at the bare "/" via a middleware rewrite.
 */
export function HideOnAdFunnel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routePath = `/${useSelectedLayoutSegments().join('/')}`;
  if (hidesSiteChrome(pathname) || hidesSiteChrome(routePath)) return null;
  return <>{children}</>;
}
