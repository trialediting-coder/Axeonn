// lib/dbRows.ts
// Helpers for turning node-postgres rows into the numbers and ISO strings the
// app's interfaces promise. Shared by the server-only data modules.

// node-postgres hands back BIGINT/SERIAL ids as strings or numbers and TIMESTAMPTZ as Date.
export type DbId = number | string;
export type DbTime = Date | string;

export const iso = (t: DbTime): string => new Date(t).toISOString();

export const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));
