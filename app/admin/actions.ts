'use server';

import { signOut } from '@/lib/auth';

/** Sign-out for the admin top bar (components/admin/AdminNav.tsx). */
export async function signOutAction() {
  await signOut({ redirectTo: '/admin/login' });
}
