// Routes retired on 2026-10-19 (practice repositioning). Each 301s below.
const RETIRED_NICHES = [
  'hvac',
  'roofing',
  'home-remodeling',
  'landscaping',
  'auto-detailing',
  'concrete',
  'plumbing',
  'electrical',
  'handyman',
  'real-estate',
];
const RETIRED_FUNNELS = ['hvac', 'roofing', 'home-remodeling', 'real-estate', 'landscaping', 'auto-detailing'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Everything but the hosted booking page refuses to be framed. /b/* is framed by
        // public/book.js on clients' sites and sends its own CSP frame-ancestors (lib/bookingPage.ts).
        source: '/((?!b/).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
      {
        // The tracking script client sites load (public/t.js). Cached for an
        // hour so their pages never wait on us; a fix reaches every site within it.
        source: '/t.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Online booking and website chat scripts on clients' sites; same cache rule as t.js.
        source: '/:file(book|book-page|chat).js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // The service worker must update the moment a new one ships.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The admin moved from /insights/admin to /admin on 2026-10-06. Old
      // bookmarks and notification emails still land in the right place.
      { source: '/insights/admin', destination: '/admin', permanent: true },
      { source: '/insights/admin/:path*', destination: '/admin/:path*', permanent: true },
      // Retired 2026-10-19 with the practice repositioning; the build stays on /work.
      { source: '/insights/a-1-auto-detailing-website-case-study', destination: '/work', permanent: true },

      // 2026-10-19 repositioning to private practices (dental, med spa, law,
      // accounting). Retired trade industry pages go to the practice hub.
      ...RETIRED_NICHES.map((slug) => ({ source: `/solutions/${slug}`, destination: '/solutions', permanent: true })),
      // Retired paid-ad funnels go straight to the free after-hours audit.
      ...RETIRED_FUNNELS.map((slug) => ({ source: `/go/${slug}`, destination: '/audit', permanent: true })),
    ];
  },
};

export default nextConfig;
