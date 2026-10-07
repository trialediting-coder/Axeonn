// app/api/proof/logout/route.ts
// AxeonPROOF sign-out: clears the session cookie and returns to the welcome page.
import { NextResponse } from 'next/server';
import { withoutProofSession } from '@/lib/proofServer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return withoutProofSession(NextResponse.redirect(new URL('/', req.url), 303));
}
