// lib/chat.ts
// The website chat, the server half: settings, the saved site pages, sessions and
// messages, the database limits (30 visitor messages a session, 200 a site an
// hour, 600 a site a day, 2,000 an hour across every site), and one turn: build
// the guarded prompt, run the tool loop (lib/chatLoop.ts) against the tools
// (lib/chatTools.ts), check the reply, store everything. Non-streaming in v1: one
// JSON reply per turn. Server-only.
import Anthropic from '@anthropic-ai/sdk';
import { randomBytes } from 'node:crypto';
import { ensureSchema, sql } from '@/lib/db';
import { errText, iso, type DbTime } from '@/lib/dbRows';
import { getItemStates, type Onboarding } from '@/lib/onboarding';
import { getLine } from '@/lib/phoneLines';
import { formatPhone, normalizePhone } from '@/lib/phoneShared';
import { getTrackingSettings } from '@/lib/siteStats';
import { bookingRateLimited } from '@/lib/welcomeApi';
import { afterBooking, bookingTimeZone, createBooking, getBookingSettings, openSlots } from '@/lib/bookings';
import { alertOwner, logContactEvent, submitChatLead } from '@/lib/leadHooks';
import { messageParams, runToolLoop, type ContentBlock, type CreateMessage } from '@/lib/chatLoop';
import { chatToolExecutor, initialToolState } from '@/lib/chatTools';
import {
  CHAT_CALL_TIMEOUT_MS, CHAT_MODEL, CHAT_TOOLS, CHAT_TURN_BUDGET_MS, DEFAULT_GREETING, MAX_PAGES_IN_PROMPT, MAX_SESSION_MESSAGES,
  buildSystemPrompt, clampHistory, fallbackReply, finalizeReply, findPhone, isSessionId, sessionToolFlags, todayLine, toolNotes, toolRow, toolSucceeded, turnCapReason,
  type ChatAdminData, type ChatContext, type ChatRole, type ChatRow, type ChatSettings, type ChatTranscript, type SitePageText, type ToolCall,
} from '@/lib/chatShared';

export const chatConfigured = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

/**
 * The real Messages API call, shaped for runToolLoop. Built the way lib/anthropic.ts
 * builds its client (ANTHROPIC_API_KEY from the environment; that module exports
 * no shared client). No SDK retries; each call's timeout is the one runToolLoop
 * sized to the turn's time left. The body (messageParams) caches the tools and
 * the system prompt. A failure throws and handleChatTurn answers with a fallback.
 */
export const anthropicCreate: CreateMessage = async (req) => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
  const res = await client.messages.create(messageParams(req) as unknown as Anthropic.MessageCreateParamsNonStreaming, { timeout: req.timeout_ms });
  return { content: res.content as unknown as ContentBlock[], stop_reason: res.stop_reason };
};

// ───────────────────────── Settings and pages ─────────────────────────

export async function getChatSettings(onboardingId: number): Promise<ChatSettings> {
  await ensureSchema();
  const { rows } = await sql<{ enabled: boolean; greeting: string | null; trained_at: DbTime | null }>`
    SELECT enabled, greeting, trained_at FROM chat_settings WHERE onboarding_id = ${onboardingId} LIMIT 1;
  `;
  const r = rows[0];
  return r ? { enabled: r.enabled, greeting: r.greeting, trainedAt: r.trained_at ? iso(r.trained_at) : null } : { enabled: false, greeting: null, trainedAt: null };
}

export async function saveChatSettings(onboardingId: number, s: { enabled: boolean; greeting: string | null }): Promise<ChatSettings> {
  await ensureSchema();
  await sql`
    INSERT INTO chat_settings (onboarding_id, enabled, greeting, updated_at) VALUES (${onboardingId}, ${s.enabled}, ${s.greeting}, now())
    ON CONFLICT (onboarding_id) DO UPDATE SET enabled = EXCLUDED.enabled, greeting = EXCLUDED.greeting, updated_at = now();
  `;
  return getChatSettings(onboardingId);
}

/** The pages the prompt reads: shortest paths first (the homepage leads), at most 20. */
async function pageTexts(onboardingId: number): Promise<SitePageText[]> {
  const { rows } = await sql<SitePageText>`
    SELECT url, title, text FROM site_pages WHERE onboarding_id = ${onboardingId}
    ORDER BY length(url) ASC, url ASC LIMIT ${MAX_PAGES_IN_PROMPT};
  `;
  return rows;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** The business name the chat uses: the portal's confirmed name, else the account's. */
async function businessName(onboarding: Onboarding): Promise<string> {
  const states = await getItemStates(onboarding.id);
  return str(states['business-basics']?.data?.businessName) || onboarding.businessName?.trim() || 'this business';
}

/**
 * What the prompt knows. Deliberately leaves out the portal's price answers
 * (services.priceRange, receptionist.quotablePricing) and the escalation contact:
 * prices may only come from the site's own pages.
 */
async function chatContext(onboarding: Onboarding, input: { bookingOpen: boolean; timeZone: string; pages: SitePageText[]; notes: string[] }): Promise<ChatContext> {
  const states = await getItemStates(onboarding.id);
  const a = (item: string, field: string) => str(states[item]?.data?.[field]);
  return {
    business: a('business-basics', 'businessName') || onboarding.businessName?.trim() || 'this business',
    services: a('services', 'services'),
    hours: a('business-basics', 'hours'),
    area: a('business-basics', 'address'),
    answers: [
      { label: 'Why customers pick them', value: a('sales-process', 'pitch') },
      { label: 'Not a good fit', value: a('sales-process', 'dealKillers') },
      { label: 'Common questions and answers', value: a('receptionist', 'faqs') },
      { label: 'Never promise', value: a('receptionist', 'neverPromise') },
    ].filter((x) => x.value),
    pages: input.pages,
    bookingOpen: input.bookingOpen,
    today: todayLine(Date.now(), input.timeZone),
    timeZone: input.timeZone,
    notes: input.notes,
  };
}

/** What chat.js asks before it draws the bubble. Off unless the toggle is on and the API key exists. */
export async function chatPublicConfig(onboarding: Onboarding): Promise<{ enabled: boolean; greeting: string; business: string }> {
  const settings = await getChatSettings(onboarding.id);
  return { enabled: settings.enabled && chatConfigured(), greeting: settings.greeting || DEFAULT_GREETING, business: await businessName(onboarding) };
}

/** The reply once a session has used its 30 messages: a number to call instead. */
export async function limitReply(onboarding: Onboarding): Promise<string> {
  const line = await getLine(onboarding.id);
  const states = await getItemStates(onboarding.id);
  const listed = normalizePhone(states['business-basics']?.data?.phone);
  const number = line ? formatPhone(line.phoneNumber) : listed ? formatPhone(listed) : null;
  return number ? `This chat has reached its limit. Call or text ${number} and we'll pick it up from there.` : 'This chat has reached its limit. Please call us and we’ll pick it up from there.';
}

// ───────────────────────── Sessions and messages ─────────────────────────

interface SessionState {
  id: string;
  phone: string | null;
  name: string | null;
  contactLogged: boolean;
}

/** An existing session of this client, or null (missing, malformed, or another client's id). */
async function findSession(onboardingId: number, sessionId: string | null): Promise<SessionState | null> {
  if (!isSessionId(sessionId)) return null;
  const { rows } = await sql<{ id: string; phone: string | null; name: string | null; contact_logged_at: DbTime | null }>`
    SELECT id, phone, name, contact_logged_at FROM chat_sessions WHERE id = ${sessionId} AND onboarding_id = ${onboardingId} LIMIT 1;
  `;
  const r = rows[0];
  return r ? { id: r.id, phone: r.phone, name: r.name, contactLogged: r.contact_logged_at !== null } : null;
}

async function newSession(onboardingId: number, visitor: string, page: string | null): Promise<SessionState> {
  const id = randomBytes(18).toString('base64url'); // 24 characters
  await sql`INSERT INTO chat_sessions (id, onboarding_id, visitor, page) VALUES (${id}, ${onboardingId}, ${visitor}, ${page});`;
  return { id, phone: null, name: null, contactLogged: false };
}

/**
 * The flood and spend caps (turnCapReason), counted before anything is written:
 * this site's visitor messages in the last hour and day, and every site's in the
 * last hour. Each stored visitor message is one model turn.
 */
async function capReached(onboardingId: number): Promise<null | 'limit_site' | 'limit_spend'> {
  const { rows } = await sql<{ site_hour: string; site_day: string; all_hour: string }>`
    SELECT
      count(*) FILTER (WHERE onboarding_id = ${onboardingId} AND created_at > now() - interval '1 hour')::text AS site_hour,
      count(*) FILTER (WHERE onboarding_id = ${onboardingId})::text AS site_day,
      count(*) FILTER (WHERE created_at > now() - interval '1 hour')::text AS all_hour
    FROM chat_messages
    WHERE role = 'user' AND created_at > now() - interval '1 day'
      AND (onboarding_id = ${onboardingId} OR created_at > now() - interval '1 hour');
  `;
  const r = rows[0];
  return turnCapReason({ siteHour: Number(r?.site_hour ?? 0), siteDay: Number(r?.site_day ?? 0), allHour: Number(r?.all_hour ?? 0) });
}

/** 30 visitor messages a session. */
async function sessionFull(sessionId: string): Promise<boolean> {
  const { rows } = await sql<{ n: string }>`SELECT count(*)::text AS n FROM chat_messages WHERE session_id = ${sessionId} AND role = 'user';`;
  return Number(rows[0]?.n ?? 0) >= MAX_SESSION_MESSAGES;
}

async function addMessage(onboardingId: number, sessionId: string, role: ChatRole, content: string): Promise<void> {
  await sql`INSERT INTO chat_messages (session_id, onboarding_id, role, content) VALUES (${sessionId}, ${onboardingId}, ${role}, ${content});`;
}

async function sessionRows(sessionId: string, limit = 80): Promise<ChatRow[]> {
  const { rows } = await sql<ChatRow>`
    SELECT role, content FROM (
      SELECT id, role, content FROM chat_messages WHERE session_id = ${sessionId} ORDER BY id DESC LIMIT ${limit}
    ) t ORDER BY id ASC;
  `;
  return rows;
}

/** Every tool row of the session (not just the recent window), for the once-per-session rules. */
async function sessionToolRows(sessionId: string): Promise<ChatRow[]> {
  const { rows } = await sql<ChatRow>`SELECT role, content FROM chat_messages WHERE session_id = ${sessionId} AND role = 'tool' ORDER BY id ASC;`;
  return rows;
}

/** Once a chat has a phone number, its transcript goes on that contact's timeline in the leads inbox (once per session). */
async function logChatTranscript(onboardingId: number, sessionId: string): Promise<void> {
  const { rows } = await sql<{ phone: string | null; name: string | null }>`
    UPDATE chat_sessions SET contact_logged_at = now() WHERE id = ${sessionId} AND contact_logged_at IS NULL RETURNING phone, name;
  `;
  const row = rows[0];
  if (!row?.phone) return;
  const transcript = (await sessionRows(sessionId, 60)).filter((r) => r.role !== 'tool');
  const first = transcript.find((r) => r.role === 'user')?.content ?? 'Website chat';
  await logContactEvent({
    onboardingId,
    phone: row.phone,
    email: null,
    name: row.name,
    kind: 'chat',
    refTable: 'chat_sessions',
    refId: null,
    summary: first.slice(0, 80),
    payload: { session: sessionId, transcript },
    createdAt: new Date().toISOString(),
  });
}

/** Deferred work never throws into after(): it logs and stops. */
const safely = (label: string, task: () => Promise<void>) => async (): Promise<void> => {
  try {
    await task();
  } catch (err) {
    console.error(`chat: ${label} failed`, errText(err));
  }
};

// ───────────────────────── One turn ─────────────────────────

export type ChatTurnResult =
  | { ok: true; session: string; reply: string; choices: string[] }
  | { ok: false; session: string | null; reason: 'off' | 'limit_session' | 'limit_site' | 'limit_spend' };

/**
 * One visitor message in, one reply out. Tools run through chatToolExecutor
 * (lib/chatTools.ts) against the real booking module (book_slot can only book
 * what openSlots offers right now, through the same createBooking/afterBooking
 * path as the booking widget, source 'chat', inside the widget's per-IP booking
 * budget) and the lead hooks; booking, message and handoff each happen at most
 * once a session. The reply passes finalizeReply before anyone sees it.
 *
 * Time: the turn has CHAT_TURN_BUDGET_MS from its start. runToolLoop starts no
 * round it cannot finish and sizes each call's timeout to the time left, so the
 * reply goes out well inside the route's maxDuration. A committed booking's
 * follow-through starts at once (not after the reply), and after() keeps the
 * function alive until it ends. Once a booking commits, nothing later in the turn
 * can become an error for the visitor: they always hear that they are booked.
 */
export async function handleChatTurn(input: {
  onboarding: Onboarding;
  siteKey: string;
  sessionId: string | null;
  message: string;
  visitor: string;
  /** The visitor's IP, for the booking budget shared with the booking widget. */
  ip: string;
  page: string | null;
  defer: (task: () => Promise<void>) => void;
  create?: CreateMessage;
  now?: () => number;
}): Promise<ChatTurnResult> {
  const now = input.now ?? Date.now;
  const deadline = now() + CHAT_TURN_BUDGET_MS;
  await ensureSchema();
  const { onboarding } = input;
  const settings = await getChatSettings(onboarding.id);
  if (!settings.enabled || !chatConfigured()) return { ok: false, session: null, reason: 'off' };

  // The flood and spend caps are checked before a new session row is written, so a flood writes nothing.
  const existing = await findSession(onboarding.id, input.sessionId);
  const cap = await capReached(onboarding.id);
  if (cap) return { ok: false, session: existing?.id ?? null, reason: cap };
  if (existing && (await sessionFull(existing.id))) return { ok: false, session: existing.id, reason: 'limit_session' };
  const session = existing ?? (await newSession(onboarding.id, input.visitor, input.page));
  await addMessage(onboarding.id, session.id, 'user', input.message);

  const [rows, toolRows, booking, pages, timeZone] = await Promise.all([
    sessionRows(session.id),
    sessionToolRows(session.id),
    getBookingSettings(onboarding.id),
    pageTexts(onboarding.id),
    bookingTimeZone(onboarding.id),
  ]);
  const flags = sessionToolFlags(toolRows);
  const ctx = await chatContext(onboarding, { bookingOpen: booking.enabled, timeZone, pages, notes: toolNotes(rows) });
  const state = initialToolState(session, flags);
  let contactLogged = session.contactLogged;

  const knowPhone = async (phone: string, name: string | null) => {
    state.phone = state.phone ?? phone;
    state.name = state.name ?? name;
    await sql`UPDATE chat_sessions SET phone = COALESCE(phone, ${phone}), name = COALESCE(name, ${name}) WHERE id = ${session.id};`;
    if (!contactLogged) {
      contactLogged = true;
      input.defer(safely('inbox transcript', () => logChatTranscript(onboarding.id, session.id)));
    }
  };

  const execute = chatToolExecutor(
    {
      booking,
      timeZone,
      openSlots: (range) => openSlots(onboarding.id, range),
      createBooking: (parsed) => createBooking(onboarding.id, parsed, 'chat'),
      bookingRateLimited: () => bookingRateLimited(input.ip),
      followThrough: (made, tz) => {
        // Started now, so the rest of the turn cannot delay or cut it; after() waits for it.
        const running = safely(`booking ${made.id} follow-through`, () => afterBooking(onboarding, input.siteKey, made, tz))();
        input.defer(() => running);
      },
      submitLead: async (lead) => {
        await submitChatLead(onboarding, { ...lead, email: null, page: input.page, session: session.id }, input.defer);
      },
      alertOwner: (subject, body) => alertOwner(onboarding, subject, body),
      knowPhone,
      now,
    },
    state
  );

  // Every call that ran, so a model failure after a tool ran (a booking above all) is not lost.
  const ran: ToolCall[] = [];
  const recording = async (name: string, raw: unknown): Promise<unknown> => {
    try {
      const result = await execute(name, raw);
      ran.push({ name, input: raw, result, isError: false });
      return result;
    } catch (err) {
      ran.push({ name, input: raw, result: { ok: false }, isError: true });
      throw err;
    }
  };

  let loop: { text: string; calls: ToolCall[] };
  try {
    loop = await runToolLoop({
      create: input.create ?? anthropicCreate,
      model: CHAT_MODEL,
      system: buildSystemPrompt(ctx),
      tools: CHAT_TOOLS,
      messages: clampHistory(rows),
      execute: recording,
      maxRounds: 4,
      maxTokens: 600,
      deadline,
      now,
      callTimeoutMs: CHAT_CALL_TIMEOUT_MS,
    });
  } catch (err) {
    console.error('chat: model call failed', errText(err));
    // The calls that ran still count: finalizeReply turns an empty text after a
    // booking or a taken message into "you're booked" / "we have your number".
    loop = { text: '', calls: ran };
    const captured = ran.some((c) => ['book_slot', 'take_message', 'handoff'].some((n) => toolSucceeded(c, n)));
    // The model is down, but a number typed into the chat is still a lead, once:
    // not when this chat already has their number or their message.
    const phone = captured || state.phone || state.messaged ? null : findPhone(input.message);
    if (phone) {
      try {
        await submitChatLead(onboarding, { name: state.name ?? 'Website chat visitor', phone, email: null, message: input.message, page: input.page, session: session.id }, input.defer);
        state.messaged = true;
        loop.text = fallbackReply(ctx.business, 'captured');
        await knowPhone(phone, state.name);
      } catch (leadErr) {
        console.error('chat: fallback lead not saved', errText(leadErr));
      }
    }
  }

  const { reply } = finalizeReply({
    text: loop.text,
    calls: loop.calls,
    pageTexts: pages.map((p) => p.text),
    business: ctx.business,
    // A booking from an earlier turn of this chat (its stored book_slot row) makes a later "you're booked" true.
    bookedEarlier: flags.booked,
  });
  // Storage once the reply is decided is best-effort: the visitor still gets the reply.
  try {
    for (const c of loop.calls) await addMessage(onboarding.id, session.id, 'tool', toolRow(c));
    await addMessage(onboarding.id, session.id, 'assistant', reply);
    await sql`UPDATE chat_sessions SET last_at = now() WHERE id = ${session.id};`;
  } catch (err) {
    console.error('chat: turn not fully saved', errText(err));
  }
  return { ok: true, session: session.id, reply, choices: state.choices };
}

// ───────────────────────── Admin ─────────────────────────

async function recentTranscripts(onboardingId: number, limit = 20): Promise<ChatTranscript[]> {
  const { rows } = await sql<{ id: string; created_at: DbTime; last_at: DbTime; phone: string | null; name: string | null; page: string | null }>`
    SELECT id, created_at, last_at, phone, name, page FROM chat_sessions
    WHERE onboarding_id = ${onboardingId} ORDER BY last_at DESC LIMIT ${limit};
  `;
  return Promise.all(
    rows.map(async (s) => {
      const msgs = await sql<{ role: ChatRole; content: string; created_at: DbTime }>`
        SELECT role, content, created_at FROM chat_messages WHERE session_id = ${s.id} ORDER BY id ASC LIMIT 120;
      `;
      return {
        id: s.id,
        startedAt: iso(s.created_at),
        lastAt: iso(s.last_at),
        phone: s.phone,
        name: s.name,
        page: s.page,
        messages: msgs.rows.map((m) => ({ role: m.role, content: m.content, at: iso(m.created_at) })),
      };
    })
  );
}

/** Everything the admin Chat card shows. */
export async function adminChatData(onboardingId: number): Promise<ChatAdminData> {
  await ensureSchema();
  const [settings, pages, transcripts, tracking] = await Promise.all([
    getChatSettings(onboardingId),
    sql<{ url: string; title: string; chars: number; fetched_at: DbTime }>`
      SELECT url, title, length(text) AS chars, fetched_at FROM site_pages WHERE onboarding_id = ${onboardingId} ORDER BY length(url) ASC, url ASC;
    `,
    recentTranscripts(onboardingId),
    getTrackingSettings(onboardingId),
  ]);
  return {
    settings,
    pages: pages.rows.map((p) => ({ url: p.url, title: p.title, chars: Number(p.chars), fetchedAt: iso(p.fetched_at) })),
    transcripts,
    siteKey: tracking.siteKey,
    siteUrl: tracking.siteUrl,
    configured: chatConfigured(),
  };
}
