// lib/leadSubmit.ts
// Browser side of /api/get-started/lead, shared by every public form that saves a
// lead (the area check, the partner brief request). A lead must never be lost
// silently (friction audit F1, 2026-10-19): one retry, then the caller shows an
// error with click-to-call and a pre-written email instead of a fake "Got it".

export const LEAD_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 1_200;

export const OWNER_EMAIL = 'hello@axeonstudio.co';
export const OWNER_PHONE_DISPLAY = '(515) 493-8017';
export const OWNER_PHONE_HREF = 'tel:+15154938017';

/** POSTs the lead, retrying once. True only on a 2xx. */
export async function saveLead(payload: Record<string, unknown>, tag = 'lead'): Promise<boolean> {
  const body = JSON.stringify(payload);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/get-started/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        signal: AbortSignal.timeout(LEAD_TIMEOUT_MS),
      });
      if (res.ok) return true;
      console.error(`[${tag}] lead submit failed`, res.status);
    } catch (err) {
      console.error(`[${tag}] lead submit failed`, err);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  return false;
}

/** A mailto: to the owner holding the visitor's answers, for when the save failed. */
export function leadMailto(subject: string, intro: string, lines: string[]): string {
  const body = `${intro}\n\n${lines.join('\n')}`;
  return `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
