// middleware.ts
// 1. Host routing (lib/hostRouting.ts): app.axeonstudio.co serves AxeonPROOF,
//    the admin and the onboarding portals; axeonstudio.co serves the site.
// 2. The admin is gated by the NextAuth session.
import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { decideHostRoute } from '@/lib/hostRouting';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  const decision = decideHostRoute({ host: req.headers.get('host'), pathname, search });
  if (decision.type === 'redirect') return NextResponse.redirect(decision.url, decision.permanent ? 308 : 307);
  if (decision.type === 'robots-disallow') {
    return new NextResponse('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain' } });
  }
  if (decision.type === 'rewrite') return NextResponse.rewrite(new URL(decision.path, req.url));

  const isLoginPage = pathname === '/admin/login';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdminRoute && !isLoginPage && !req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
});

export const config = {
  // Everything except Next.js build assets, so host routing sees every page.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
