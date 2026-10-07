// Paid-ad landing pages live under /go/<industry>. They are not linked from the
// site, are noindexed, and hide the site chrome (header, footer, popups, side
// tabs) so the only action on the page is booking a call.
export const AD_FUNNEL_PREFIX = '/go';

export const isAdFunnelPath = (pathname: string | null | undefined) =>
  !!pathname && (pathname === AD_FUNNEL_PREFIX || pathname.startsWith(`${AD_FUNNEL_PREFIX}/`));

// The client onboarding portal (/welcome/<token>) is for people who already
// paid: no "Book My Free Call", no popups, no footer pitch. Same treatment.
export const CLIENT_PORTAL_PREFIX = '/welcome';

export const isClientPortalPath = (pathname: string | null | undefined) =>
  !!pathname && pathname.startsWith(`${CLIENT_PORTAL_PREFIX}/`);

// The admin has its own top bar (components/admin/AdminNav.tsx); the site's
// header, footer and sales popups never belong on it.
export const ADMIN_PREFIX = '/admin';

export const isAdminPath = (pathname: string | null | undefined) =>
  !!pathname && (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`));

// AxeonPROOF, the client dashboard at app.axeonstudio.co. Served from /proof but
// shown at "/" on the app host, so HideOnAdFunnel also checks the rendered route.
export const isProofPath = (pathname: string | null | undefined) =>
  !!pathname && (pathname === '/proof' || pathname.startsWith('/proof/'));

/** True on any page that shows none of the marketing chrome. */
export const hidesSiteChrome = (pathname: string | null | undefined) =>
  isAdFunnelPath(pathname) || isClientPortalPath(pathname) || isAdminPath(pathname) || isProofPath(pathname);
