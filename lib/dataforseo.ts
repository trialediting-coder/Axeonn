// lib/dataforseo.ts
// The only file that talks to DataForSEO (https://api.dataforseo.com/v3). Basic
// auth from DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD; DATAFORSEO_BASE can point at
// the sandbox (https://sandbox.api.dataforseo.com) to build without spending.
// Every call is a POST of a one-task array; the task's `cost` is what we record.
export const NOT_CONFIGURED = "DataForSEO isn't connected — add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Vercel";

export class DataForSeoError extends Error {
  constructor(message: string, readonly code: number | null = null) {
    super(message);
    this.name = 'DataForSeoError';
  }
  /** Bad or unknown location: stop the run before any more paid calls. */
  get isLocation(): boolean {
    return /location/i.test(this.message);
  }
}

export const dataForSeoConfigured = (): boolean => Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);

export interface DfsTask {
  id?: string;
  status_code: number;
  status_message: string;
  cost: number;
  result: unknown[] | null;
}

interface DfsResponse {
  status_code?: number;
  status_message?: string;
  tasks?: DfsTask[];
}

const friendlyTaskError = (t: DfsTask): string =>
  /location/i.test(t.status_message)
    ? `DataForSEO doesn't know that location — check the city spelling, or use the nearest larger city (${t.status_message})`
    : t.status_message || 'DataForSEO task failed';

export async function dfsPost(path: string, tasks: Record<string, unknown>[], timeoutMs = 60_000): Promise<{ task: DfsTask; raw: unknown }> {
  if (!dataForSeoConfigured()) throw new DataForSeoError(NOT_CONFIGURED);
  const base = (process.env.DATAFORSEO_BASE || 'https://api.dataforseo.com').replace(/\/$/, '');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
    body: JSON.stringify(tasks),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = (await res.json().catch(() => null)) as DfsResponse | null;
  if (res.status === 401) throw new DataForSeoError('DataForSEO rejected the login — check DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD', 401);
  if (!res.ok || !json) throw new DataForSeoError(`DataForSEO HTTP ${res.status}`, res.status);
  if (json.status_code !== 20000) throw new DataForSeoError(json.status_message || 'DataForSEO error', json.status_code ?? null);
  const task = json.tasks?.[0];
  if (!task) throw new DataForSeoError('DataForSEO returned no task');
  // 20100 = "Task Created" (async endpoints such as reviews).
  if (task.status_code !== 20000 && task.status_code !== 20100) throw new DataForSeoError(friendlyTaskError(task), task.status_code);
  return { task, raw: json };
}

/** GET an async task's result. Returns the task whatever its status; callers treat 40601/40602 as "still running". */
export async function dfsGet(path: string, timeoutMs = 30_000): Promise<{ task: DfsTask; raw: unknown }> {
  if (!dataForSeoConfigured()) throw new DataForSeoError(NOT_CONFIGURED);
  const base = (process.env.DATAFORSEO_BASE || 'https://api.dataforseo.com').replace(/\/$/, '');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch(`${base}${path}`, { headers: { authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(timeoutMs) });
  const json = (await res.json().catch(() => null)) as DfsResponse | null;
  if (res.status === 401) throw new DataForSeoError('DataForSEO rejected the login — check DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD', 401);
  if (!res.ok || !json) throw new DataForSeoError(`DataForSEO HTTP ${res.status}`, res.status);
  const task = json.tasks?.[0];
  if (!task) throw new DataForSeoError('DataForSEO returned no task');
  return { task, raw: json };
}
export const DFS_PENDING_CODES = new Set([40601, 40602]);

/** What we store: the task's status and cost, and the first 20 items of its first result. */
export function trimTask(task: DfsTask): DfsTask {
  const first = (task.result?.[0] ?? null) as (Record<string, unknown> & { items?: unknown }) | null;
  const items = first && Array.isArray(first.items) ? first.items.slice(0, 20) : [];
  return { status_code: task.status_code, status_message: task.status_message, cost: task.cost, result: first ? [{ ...first, items }] : null };
}
