// lib/emailLogShared.ts
// What each logged email is (lib/emailLog.ts, /admin/emails). Pure: no database,
// so the admin page, lib/email.ts and the tests can all import it.

/** Which group an email shows under in the admin log's filter. */
export const EMAIL_CATEGORIES = {
  onboarding: 'Onboarding',
  contracts: 'Contracts',
  reports: 'Reports',
  updates: 'Project updates',
  business_email: 'Business email',
  account: 'Codes & passwords',
  alerts: 'Alerts to you',
  leads: 'Client lead alerts',
  followups: 'Lead follow-ups',
} as const;
export type EmailCategory = keyof typeof EMAIL_CATEGORIES;

/** Every email lib/email.ts sends, by the function that sends it. */
export const EMAIL_KINDS = {
  welcome: { label: 'Welcome / setup link', category: 'onboarding' },
  dashboard_invite: { label: 'AxeonPROOF invite', category: 'onboarding' },
  onboarding_nudge: { label: 'Setup reminder', category: 'onboarding' },
  agreement_sent: { label: 'Agreement to sign', category: 'contracts' },
  agreement_signed: { label: 'Signed agreement copy', category: 'contracts' },
  agreement_signed_alert: { label: 'Agreement signed (to you)', category: 'contracts' },
  monthly_report: { label: 'Monthly report', category: 'reports' },
  report_preview: { label: 'Report preview (to you)', category: 'reports' },
  reports_digest: { label: 'Monthly reports digest', category: 'reports' },
  project_update: { label: 'Project update', category: 'updates' },
  business_email_live: { label: 'Business email is live', category: 'business_email' },
  business_email_request: { label: 'Business email request', category: 'business_email' },
  verification_code: { label: 'Setup code', category: 'account' },
  password_reset: { label: 'Password reset', category: 'account' },
  lead_alert: { label: 'New lead', category: 'alerts' },
  client_lead_alert: { label: 'Website lead (to client)', category: 'leads' },
  lead_activity_alert: { label: 'Lead text or missed call (to client)', category: 'leads' },
  onboarding_complete: { label: 'Setup finished', category: 'alerts' },
  billing_alert: { label: 'Billing', category: 'alerts' },
  feedback_alert: { label: 'Client feedback', category: 'alerts' },
  upgrade_request: { label: 'Upgrade request', category: 'alerts' },
  low_close_rate: { label: 'Low close rate', category: 'alerts' },
  tracker_quiet: { label: 'Tracker went quiet', category: 'alerts' },
  audit_failed: { label: 'Scheduled audit failed', category: 'alerts' },
  blog_draft_ready: { label: 'Blog draft ready', category: 'alerts' },
  blog_generation_failed: { label: 'Blog generation failed', category: 'alerts' },
  sequence_start_failed: { label: 'Follow-up did not start', category: 'alerts' },
  sequence_email: { label: 'Follow-up email to a lead', category: 'followups' },
} as const satisfies Record<string, { label: string; category: EmailCategory }>;
export type EmailKind = keyof typeof EMAIL_KINDS;

export const isEmailCategory = (v: unknown): v is EmailCategory => typeof v === 'string' && Object.hasOwn(EMAIL_CATEGORIES, v);

/** The kinds in one category, for the log's SQL filter. */
export function kindsInCategory(category: EmailCategory): EmailKind[] {
  return (Object.keys(EMAIL_KINDS) as EmailKind[]).filter((k) => EMAIL_KINDS[k].category === category);
}

export function emailKindLabel(kind: string): string {
  return Object.hasOwn(EMAIL_KINDS, kind) ? EMAIL_KINDS[kind as EmailKind].label : kind;
}

/** Resend takes one address or a list; the log keeps one comma-separated, lowercased string. */
export function recipientsText(to: string | string[] | undefined): string {
  const list = Array.isArray(to) ? to : to ? [to] : [];
  return list.map((a) => a.trim().toLowerCase()).filter(Boolean).join(', ');
}

/** The log is readable by anyone with admin access, so one-time codes never go in it. */
export function loggedSubject(kind: EmailKind, subject: string): string {
  return kind === 'verification_code' ? subject.replace(/\d{4,}/g, '••••••') : subject;
}
