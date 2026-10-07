// lib/hostRouting.ts
// Which host serves what. Pure and edge-safe (no Node imports) so middleware.ts
// can use it and lib/hostRouting.test.ts can test it.
//
//   app.axeonstudio.co  -> the app. "/" is AxeonPROOF: the client welcome and
//                          sign-in page, or their dashboard once signed in
//                          (served by app/proof, shown at the bare address).
//                          /admin is the team admin, /welcome/<token> are the
//                          onboarding portals. Marketing paths go back to the
//                          main site, and robots.txt disallows everything.
//   axeonstudio.co      -> the marketing site. /admin, /welcome and /proof
//                          links (old bookmarks, sent emails) forward to the app.
//   anything else       -> untouched (localhost, *.vercel.app previews).
//
// /api is served on both hosts: Stripe's webhook and the crons call the main
// domain, the admin, portal and AxeonPROOF call their own host.

export const SITE_ORIGIN = 'https://axeonstudio.co';

/** Origin of the app host, e.g. https://app.axeonstudio.co. Falls back to the main site when APP_URL is unset. */
export const APP_ORIGIN = (process.env.APP_URL || SITE_ORIGIN).replace(/\/$/, '');

/** AxeonPROOF lives at this internal path and is shown at the app host's "/". */
export const PROOF_PATH = '/proof';

const APP_SECTIONS = ['/admin', '/welcome', PROOF_PATH];

const inSection = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Paths every host must serve as-is: API routes, Next.js assets, and public files like /icon.png. */
export function isSharedPath(pathname: string): boolean {
  if (inSection(pathname, '/api') || inSection(pathname, '/_next')) return true;
  const last = pathname.split('/').pop() ?? '';
  return last.includes('.') && pathname !== '/robots.txt' && pathname !== '/sitemap.xml';
}

export const isAppPath = (pathname: string) => APP_SECTIONS.some((p) => inSection(pathname, p));

export type HostDecision =
  | { type: 'next' }
  | { type: 'redirect'; url: string; permanent: boolean }
  | { type: 'rewrite'; path: string }
  | { type: 'robots-disallow' };

export function decideHostRoute(input: {
  host: string | null;
  pathname: string;
  search: string;
  siteOrigin?: string;
  appOrigin?: string;
}): HostDecision {
  const siteOrigin = input.siteOrigin ?? SITE_ORIGIN;
  const appOrigin = input.appOrigin ?? APP_ORIGIN;
  const host = (input.host ?? '').toLowerCase().split(':')[0];
  const siteHost = new URL(siteOrigin).hostname;
  const appHost = new URL(appOrigin).hostname;
  if (!host || appHost === siteHost) return { type: 'next' };

  const { pathname, search } = input;

  if (host === appHost) {
    // AxeonPROOF is the front door at the bare address.
    if (pathname === '/') return { type: 'rewrite', path: PROOF_PATH };
    // Keep the URL people see clean: /proof itself goes back to "/".
    if (pathname === PROOF_PATH) return { type: 'redirect', url: `${appOrigin}/${search}`, permanent: false };
    if (pathname === '/robots.txt') return { type: 'robots-disallow' };
    if (isAppPath(pathname) || isSharedPath(pathname)) return { type: 'next' };
    return { type: 'redirect', url: `${siteOrigin}${pathname}${search}`, permanent: true };
  }

  if (host === siteHost && isAppPath(pathname)) {
    const target = pathname === PROOF_PATH ? '/' : pathname;
    return { type: 'redirect', url: `${appOrigin}${target}${search}`, permanent: true };
  }

  return { type: 'next' };
}
