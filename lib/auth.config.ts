// lib/auth.config.ts
// Edge-safe NextAuth config — no Credentials provider, no bcryptjs.
// Used by middleware.ts, which runs on the Edge Runtime.
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  pages: { signIn: '/insights/admin/login' },
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig;
