// Paid-ad landing pages live under /go/<industry>. They are not linked from the
// site, are noindexed, and hide the site chrome (header, footer, popups, side
// tabs) so the only action on the page is booking a call.
export const AD_FUNNEL_PREFIX = '/go';

export const isAdFunnelPath = (pathname: string | null | undefined) =>
  !!pathname && (pathname === AD_FUNNEL_PREFIX || pathname.startsWith(`${AD_FUNNEL_PREFIX}/`));
