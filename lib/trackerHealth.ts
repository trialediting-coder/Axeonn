// lib/trackerHealth.ts
// A client's site that reported for a while and then stopped usually lost its
// tracking line in a site edit. Nobody notices until the monthly report says
// zero, so a daily cron (app/api/cron/tracker-health) emails the owner once per
// quiet spell: the alert is remembered in onboardings.tracker_alerted_at and
// fires again only after the site reports in and goes quiet a second time.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { sendTrackerQuietNotification } from '@/lib/email';

/** Days without any event before a tracker counts as quiet. */
export const QUIET_DAYS = 7;

export interface QuietTracker {
  onboardingId: number;
  token: string;
  businessName: string;
  lastEventAt: string;
}

interface Row {
  onboarding_id: number;
  token: string;
  business_name: string | null;
  client_email: string;
  last_at: string | Date;
}

/** Keyed sites that have reported before, sent nothing for QUIET_DAYS, and have not been alerted for this spell. */
export async function quietTrackers(now: Date = new Date()): Promise<QuietTracker[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<Row>`
    SELECT o.id AS onboarding_id, o.token, o.business_name, o.client_email, e.last_at
    FROM onboardings o
    JOIN LATERAL (SELECT max(created_at) AS last_at FROM site_events s WHERE s.onboarding_id = o.id) e ON true
    WHERE o.site_key IS NOT NULL AND o.status <> 'closed' AND e.last_at IS NOT NULL
      AND e.last_at < ${now.toISOString()}::timestamptz - make_interval(days => ${QUIET_DAYS})
      AND (o.tracker_alerted_at IS NULL OR o.tracker_alerted_at < e.last_at)
    ORDER BY e.last_at;
  `;
  return res.rows.map((r) => ({
    onboardingId: r.onboarding_id,
    token: r.token,
    businessName: r.business_name || r.client_email,
    lastEventAt: new Date(r.last_at).toISOString(),
  }));
}

export interface TrackerCheck {
  quiet: QuietTracker[];
  alerted: string[];
  /** Mail not configured, or a send failed: the alert stays pending for the next run. */
  skipped: Array<{ token: string; reason: string }>;
}

/** The daily run: email the owner about each newly quiet site and remember that we did. */
export async function checkTrackers(now: Date = new Date()): Promise<TrackerCheck> {
  const quiet = await quietTrackers(now);
  const out: TrackerCheck = { quiet, alerted: [], skipped: [] };
  for (const q of quiet) {
    try {
      const sent = await sendTrackerQuietNotification({ businessName: q.businessName, token: q.token, lastEventAt: q.lastEventAt, days: QUIET_DAYS });
      if (!sent) {
        out.skipped.push({ token: q.token.slice(0, 4), reason: 'email not configured' });
        continue;
      }
      await sql`UPDATE onboardings SET tracker_alerted_at = ${now.toISOString()} WHERE id = ${q.onboardingId};`;
      out.alerted.push(q.token.slice(0, 4));
    } catch (err) {
      out.skipped.push({ token: q.token.slice(0, 4), reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return out;
}
