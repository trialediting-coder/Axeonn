// middleware.ts
import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === '/insights/admin/login';
  const isAdminRoute = pathname.startsWith('/insights/admin');

  if (isAdminRoute && !isLoginPage && !req.auth) {
    const loginUrl = new URL('/insights/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/insights/admin/:path*'],
};
