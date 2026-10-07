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
