// lib/leadHealth.ts
// A client whose own marks say few leads turn into jobs is the one to call
// before it turns into a cancellation. The daily tracker-health cron runs this:
// once per 30 days per client, when at least OBSERVED_MIN_MARKED leads are
// marked in the window and the booked share is under LOW_CLOSE_RATE, the owner
// gets one email. Nothing is shown to the client.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { sendLowCloseRateNotification } from '@/lib/email';
import { OBSERVED_MIN_MARKED } from '@/lib/projectsShared';
import { observedCloseRate } from '@/lib/siteStats';

export const LOW_CLOSE_RATE = 25;
const REPEAT_DAYS = 30;

interface Row {
  id: number;
  token: string;
  business_name: string | null;
  client_email: string;
  low_close_alerted_at: string | Date | null;
}

export interface CloseRateCheck {
  low: Array<{ token: string; rate: number; marked: number }>;
  alerted: string[];
  skipped: Array<{ token: string; reason: string }>;
}

export async function checkCloseRates(now: Date = new Date()): Promise<CloseRateCheck> {
  const out: CloseRateCheck = { low: [], alerted: [], skipped: [] };
  if (!isDatabaseConfigured()) return out;
  await ensureSchema();
  const res = await sql<Row>`
    SELECT id, token, business_name, client_email, low_close_alerted_at FROM onboardings
    WHERE site_key IS NOT NULL AND status <> 'closed';
  `;
  for (const o of res.rows) {
    const observed = await observedCloseRate(o.id);
    if (!observed) continue;
    const marked = observed.won + observed.lost;
    if (marked < OBSERVED_MIN_MARKED || observed.rate >= LOW_CLOSE_RATE) continue;
    out.low.push({ token: o.token.slice(0, 4), rate: observed.rate, marked });
    const last = o.low_close_alerted_at ? new Date(o.low_close_alerted_at).getTime() : 0;
    if (now.getTime() - last < REPEAT_DAYS * 86_400_000) continue;
    try {
      const sent = await sendLowCloseRateNotification({
        businessName: o.business_name || o.client_email,
        token: o.token,
        rate: observed.rate,
        won: observed.won,
        marked,
        months: observed.months,
      });
      if (!sent) {
        out.skipped.push({ token: o.token.slice(0, 4), reason: 'email not configured' });
        continue;
      }
      await sql`UPDATE onboardings SET low_close_alerted_at = ${now.toISOString()} WHERE id = ${o.id};`;
      out.alerted.push(o.token.slice(0, 4));
    } catch (err) {
      out.skipped.push({ token: o.token.slice(0, 4), reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return out;
}
