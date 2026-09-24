// lib/billingApi.ts
// Small shared helpers for the admin billing route handlers.
import { NextResponse } from 'next/server';

export type JsonBody = Record<string, unknown>;

export async function readBody(req: Request): Promise<JsonBody> {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object');
  }
  return body as JsonBody;
}

export function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function requireEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid client email is required');
  return email;
}

/** Validation and Stripe errors both come back as 400 with the message; nothing else leaks. */
export function jsonError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : 'Unexpected error';
  console.error('[billing-api]', message);
  return NextResponse.json({ error: message }, { status: 400 });
}
