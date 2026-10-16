// instrumentation-client.ts
// PostHog product analytics, loaded by Next.js before the app hydrates.
//   axeonstudio.co      the marketing site: pageviews, clicks, session replay.
//   app.axeonstudio.co  AxeonPROOF and the onboarding portals, so we can see how
//                       clients use them. Replays mask every piece of text and
//                       every input there: the dashboard shows their customers'
//                       names and phone numbers, and those never leave the browser.
// Never: /admin (our own use and "view as client" previews), browsers sending
// Global Privacy Control (same rule as GA4, Clarity and Apollo in app/layout.tsx),
// localhost and *.vercel.app previews.
import posthog from 'posthog-js';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = window.location.hostname;
const isAppHost = host.startsWith('app.');
const isLive = host === 'axeonstudio.co' || host === 'www.axeonstudio.co' || isAppHost;
const optedOut = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
const isAdminPath = (path: string) => path === '/admin' || path.startsWith('/admin/');

if (token && isLive && !optedOut && !isAdminPath(window.location.pathname)) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-05-30',
    session_recording: isAppHost ? { maskAllInputs: true, maskTextSelector: '*' } : { maskAllInputs: true },
    // A client-side hop into the admin after load must not be recorded either.
    before_send: (event) => (event && isAdminPath(window.location.pathname) ? null : event),
  });
}
