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
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
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
    ];
  },
  async redirects() {
    return [
      // The admin moved from /insights/admin to /admin on 2026-10-06. Old
      // bookmarks and notification emails still land in the right place.
      { source: '/insights/admin', destination: '/admin', permanent: true },
      { source: '/insights/admin/:path*', destination: '/admin/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
