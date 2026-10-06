// lib/airtable.ts
// Minimal Airtable REST client for the "Axeon Client Onboarding" base, so the
// site writes leads and onboarding progress straight to Airtable (replacing the
// n8n workflows "Axeon Website Lead Form" and "Axeon Portal Sync").
//
// Needs AIRTABLE_TOKEN: a personal access token with data.records:read and
// data.records:write on that one base (airtable.com/create/tokens). Base and
// table ids are the real ones and can be overridden by env for a test base.
//
// Every caller treats Airtable as a mirror: failures are logged and swallowed by
// the caller, never shown to a client and never allowed to break a save.

const API = 'https://api.airtable.com/v0';
const TIMEOUT_MS = 8000;

export const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appGn1rVWh6XB8eVo';
export const AIRTABLE_CLIENTS_TABLE_ID = process.env.AIRTABLE_CLIENTS_TABLE_ID || 'tblB9FsjDCjDc695r';

export type AirtableFields = Record<string, unknown>;

export interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields: AirtableFields;
}

export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_TOKEN);
}

async function request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN is not set');
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Airtable error bodies carry a type and message, never the token.
    throw new Error(`Airtable ${method} ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

const tablePath = () => `${AIRTABLE_BASE_ID}/${AIRTABLE_CLIENTS_TABLE_ID}`;

/** Escapes a value for use inside a single-quoted Airtable formula string. */
export function formulaString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The client row for an email, matched case- and whitespace-insensitively, or null. */
export async function findClientByEmail(email: string): Promise<AirtableRecord | null> {
  const formula = `LOWER(TRIM({Email}))='${formulaString(normalizeEmail(email))}'`;
  const qs = new URLSearchParams({ filterByFormula: formula, maxRecords: '1' });
  const data = await request<{ records: AirtableRecord[] }>('GET', `${tablePath()}?${qs.toString()}`);
  return data.records[0] ?? null;
}

export async function createClient(fields: AirtableFields): Promise<AirtableRecord> {
  const data = await request<{ records: AirtableRecord[] }>('POST', tablePath(), {
    records: [{ fields }],
    typecast: true,
  });
  return data.records[0];
}

export async function updateClient(id: string, fields: AirtableFields): Promise<AirtableRecord> {
  const data = await request<{ records: AirtableRecord[] }>('PATCH', tablePath(), {
    records: [{ id, fields }],
    typecast: true,
  });
  return data.records[0];
}

/** Drops undefined, null and empty-string values so a sync never blanks a field someone typed. */
export function compactFields(fields: AirtableFields): AirtableFields {
  const out: AirtableFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}
