// lib/sequenceSchedule.ts
// When a follow-up step goes out, and whether it goes out at all. Quiet hours
// (8 pm to 8 am client-local), step planning from a run's anchor, the quarterly
// check-in spread, and decideRun: the one function the cron worker asks about
// every due run. Pure and client-safe; time zones via Intl only.
import { QUIET_END_HOUR, QUIET_START_HOUR, isQuietHours } from '@/lib/leadShared';
import { DEFAULT_TIME_ZONE } from '@/lib/phoneShared';
import { STOP_LINE, clampSms, firstName, missingLinks, renderTemplate, withStopLine, type SequenceChannel, type SequenceKind, type SequenceStep, type SequenceTemplate, type StopReason, type TemplateVars } from '@/lib/sequenceShared';

/** A reminder more than this late is skipped rather than sent after the fact. */
export const REMINDER_GRACE_MINUTES = 30;
export const REACTIVATION_DAYS = 7;
export const REACTIVATION_DAILY_MAX = 50;
export const REACTIVATION_FIRST_HOUR = 10;
export const REACTIVATION_GAP_MINUTES = 5;

const MINUTE = 60_000;

export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function localParts(at: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute'), second: get('second') };
}

/** The UTC instant of a wall-clock time in a zone. Day and minute may overflow (Date.UTC rolls them). */
export function zonedTime(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const offsetAt = (t: number) => {
    const p = localParts(new Date(t), timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  };
  const first = offsetAt(wall);
  let t = wall - first;
  const second = offsetAt(t);
  if (second !== first) t = wall - second;
  return new Date(t);
}

/** 8 pm to 8 am local becomes 8 am local (the next morning when it is evening). Daytime is unchanged. */
export function holdForQuietHours(at: Date, timeZone: string): Date {
  const tz = safeTimeZone(timeZone);
  if (!isQuietHours(at, tz)) return at;
  const p = localParts(at, tz);
  const nextDay = p.hour >= QUIET_START_HOUR ? 1 : 0;
  return zonedTime(p.year, p.month, p.day + nextDay, QUIET_END_HOUR, 0, tz);
}

export function nextSendAt(from: Date, offsetMinutes: number, timeZone: string): Date {
  return holdForQuietHours(new Date(from.getTime() + offsetMinutes * MINUTE), timeZone);
}

export interface PlanInput {
  kind: SequenceKind;
  steps: SequenceStep[];
  fromStep: number;
  anchorAt: Date;
  now: Date;
  /** Nothing before this (a missed call waits 30 minutes for a reply). */
  notBefore?: Date;
  timeZone: string;
  canSms: boolean;
  canEmail: boolean;
}

/**
 * The next step at or after fromStep that this contact can receive, and when.
 * A text step is skipped without a phone or approved texting, an email step
 * without an address. A late step goes now, not in the past. Reminders that are
 * already well past, or that quiet hours would push onto the appointment, are skipped.
 */
export function planSend(p: PlanInput): { step: number; at: Date } | null {
  const floor = p.notBefore && p.notBefore.getTime() > p.now.getTime() ? p.notBefore : p.now;
  for (let i = Math.max(0, p.fromStep); i < p.steps.length; i++) {
    const s = p.steps[i];
    if (s.channel === 'sms' ? !p.canSms : !p.canEmail) continue;
    const due = new Date(p.anchorAt.getTime() + s.offsetMinutes * MINUTE);
    if (p.kind === 'reminder' && due.getTime() < p.now.getTime() - REMINDER_GRACE_MINUTES * MINUTE) continue;
    const at = nextSendAt(due.getTime() > floor.getTime() ? due : floor, 0, p.timeZone);
    if (p.kind === 'reminder' && at.getTime() >= p.anchorAt.getTime()) continue;
    return { step: i, at };
  }
  return null;
}

/**
 * Send times for a quarter's check-in texts: from 10 am local, 5 minutes apart,
 * spread evenly over 7 days, never more than 50 in one local day (a list over
 * 350 runs past the first week at 50 a day). Day one is the first 10 am at or after start.
 */
export function scheduleReactivation(count: number, start: Date, timeZone: string): Date[] {
  if (count <= 0) return [];
  const tz = safeTimeZone(timeZone);
  const perDay = Math.min(REACTIVATION_DAILY_MAX, Math.max(1, Math.ceil(count / REACTIVATION_DAYS)));
  const p = localParts(start, tz);
  const firstDay = zonedTime(p.year, p.month, p.day, REACTIVATION_FIRST_HOUR, 0, tz).getTime() < start.getTime() ? 1 : 0;
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const day = firstDay + Math.floor(i / perDay);
    const slot = i % perDay;
    out.push(zonedTime(p.year, p.month, p.day + day, REACTIVATION_FIRST_HOUR, slot * REACTIVATION_GAP_MINUTES, tz));
  }
  return out;
}

/** 'YYYY-MM' of the quarter while it is the first 7 local days of January, April, July or October; else null. */
export function reactivationWindow(now: Date, timeZone: string): string | null {
  const p = localParts(now, safeTimeZone(timeZone));
  if (![1, 4, 7, 10].includes(p.month) || p.day > REACTIVATION_DAYS) return null;
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}

export interface RunState {
  kind: SequenceKind;
  step: number;
  anchorAt: Date;
  contactPhone: string | null;
  contactEmail: string | null;
  contactName: string;
  /** True once any text of this run has gone out; the first text delivered must carry the STOP line. */
  priorSmsSent: boolean;
}

export interface RunContext {
  /** The client's template for this kind; null when none could be loaded. */
  template: SequenceTemplate | null;
  /** AxeonCORE and up, and the client is not closed. */
  tierAllowed: boolean;
  optedOut: boolean;
  /** The contact texted in or was talked to since the run began (lib/sequences.ts contactRepliedSince). */
  replied: boolean;
  smsReady: boolean;
  emailReady: boolean;
  timeZone: string;
  /** Business-level blanks; the contact's {name} is filled from the run. */
  vars: TemplateVars;
  now: Date;
}

export type RunDecision =
  | { type: 'stop'; reason: StopReason }
  | { type: 'done' }
  | { type: 'hold'; step: number; until: Date }
  | { type: 'send'; step: number; channel: SequenceChannel; to: string; subject: string | null; body: string; next: { step: number; at: Date } | null };

/** Follow-ups that exist to get a response; a response ends them. Review and reminders are not. */
const REPLY_STOPS: readonly SequenceKind[] = ['new_lead', 'quote'];

export function decideRun(run: RunState, ctx: RunContext): RunDecision {
  if (!ctx.tierAllowed) return { type: 'stop', reason: 'plan' };
  if (!ctx.template || !ctx.template.enabled) return { type: 'stop', reason: 'template_off' };
  if (run.contactPhone && ctx.optedOut) return { type: 'stop', reason: 'opted_out' };
  if (ctx.replied && REPLY_STOPS.includes(run.kind)) return { type: 'stop', reason: 'replied' };

  const steps = ctx.template.steps;
  const base = {
    kind: run.kind,
    steps,
    anchorAt: run.anchorAt,
    now: ctx.now,
    timeZone: ctx.timeZone,
    canSms: Boolean(run.contactPhone) && ctx.smsReady,
    canEmail: Boolean(run.contactEmail) && ctx.emailReady,
  };
  const plan = planSend({ ...base, fromStep: run.step });
  if (!plan) return { type: 'done' };
  if (plan.at.getTime() > ctx.now.getTime()) return { type: 'hold', step: plan.step, until: plan.at };

  const step = steps[plan.step];
  const vars: TemplateVars = { ...ctx.vars, name: firstName(run.contactName) };
  if (missingLinks([step], vars).length) return { type: 'stop', reason: 'missing_link' };
  const to = step.channel === 'sms' ? run.contactPhone : run.contactEmail;
  if (!to) return { type: 'done' }; // unreachable: planSend only picks a step the contact can receive
  let body = renderTemplate(step.body, vars);
  if (step.channel === 'sms') {
    if (!run.priorSmsSent && !body.endsWith(STOP_LINE)) body = withStopLine(body);
    body = clampSms(body).body;
  }
  return {
    type: 'send',
    step: plan.step,
    channel: step.channel,
    to,
    subject: step.subject === null ? null : renderTemplate(step.subject, vars),
    body,
    next: planSend({ ...base, fromStep: plan.step + 1 }),
  };
}
