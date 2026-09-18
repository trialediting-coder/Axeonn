// lib/auth.ts
// Full NextAuth config, Node-only (bcryptjs). Used by the API route handler
// and server components — never imported by middleware.ts.
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        if (email !== process.env.ADMIN_EMAIL) return null;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!passwordHash) return null;
        const valid = await bcrypt.compare(password, passwordHash);
        if (!valid) return null;
        return { id: '1', email };
      },
    }),
  ],
});
