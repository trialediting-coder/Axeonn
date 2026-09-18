// lib/adminAuth.ts
import { auth } from '@/lib/auth';

export async function requireAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  const token = process.env.CMS_API_TOKEN;
  if (token && authHeader === `Bearer ${token}`) return true;

  const session = await auth();
  return !!session;
}
