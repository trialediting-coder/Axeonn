// lib/chatLoop.ts
// One chat turn's tool loop over the Messages API, with the API call injected
// (lib/chat.ts passes the real SDK; tests pass a fake). Runs tools the model asks
// for, feeds results back, stops at a reply without tool calls; when the rounds
// or the turn's time run out, one closing call with tools off writes the reply
// (only if it fits in the time left). Every call's timeout is the smaller of the
// per-call cap and the time left, so no call runs past the turn's deadline. A
// tool that throws becomes a generic error result: the model sees that it
// failed, never the internal message. No Node imports, no SDK at runtime.
import {
  CHAT_CALL_TIMEOUT_MS, CHAT_MIN_CLOSING_MS, CHAT_MIN_ROUND_MS,
  type ApiMessage, type ChatToolDef, type ToolCall,
} from '@/lib/chatShared';

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: string; [key: string]: unknown };

export interface ModelReply {
  content: ContentBlock[];
  stop_reason: string | null;
}

export type CreateMessage = (req: {
  model: string;
  max_tokens: number;
  system: string;
  tools: readonly ChatToolDef[];
  messages: ApiMessage[];
  /** { type: 'none' } on the closing call: the model must answer in words. */
  tool_choice?: { type: 'auto' } | { type: 'none' };
  /** The most this call may take; the implementation must abort it after this. */
  timeout_ms: number;
}) => Promise<ModelReply>;

export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

const EPHEMERAL = { type: 'ephemeral' } as const;

/**
 * The Messages API body for one call. Prompt caching marks the parts every round
 * of a turn (and every turn within minutes) repeats: the tools block (a
 * breakpoint on the last tool) and the system prompt.
 */
export function messageParams(req: Parameters<CreateMessage>[0]) {
  const last = req.tools.length - 1;
  return {
    model: req.model,
    max_tokens: req.max_tokens,
    system: [{ type: 'text' as const, text: req.system, cache_control: EPHEMERAL }],
    tools: req.tools.map((t, i) => (i === last ? { ...t, cache_control: EPHEMERAL } : { ...t })),
    messages: req.messages,
    ...(req.tool_choice ? { tool_choice: req.tool_choice } : {}),
  };
}

const isText = (b: ContentBlock): b is { type: 'text'; text: string } => b.type === 'text' && typeof (b as { text?: unknown }).text === 'string';
const isToolUse = (b: ContentBlock): b is { type: 'tool_use'; id: string; name: string; input: unknown } =>
  b.type === 'tool_use' && typeof (b as { id?: unknown }).id === 'string' && typeof (b as { name?: unknown }).name === 'string';
const textOf = (reply: ModelReply) => reply.content.filter(isText).map((b) => b.text).join('\n').trim();

export async function runToolLoop(opts: {
  create: CreateMessage;
  model: string;
  system: string;
  tools: readonly ChatToolDef[];
  messages: ApiMessage[];
  execute: ToolExecutor;
  maxRounds?: number;
  maxTokens?: number;
  /** Epoch ms by which every model call must be over. Default: no deadline. */
  deadline?: number;
  now?: () => number;
  callTimeoutMs?: number;
}): Promise<{ text: string; calls: ToolCall[] }> {
  const now = opts.now ?? Date.now;
  const deadline = opts.deadline ?? Number.POSITIVE_INFINITY;
  const callCap = opts.callTimeoutMs ?? CHAT_CALL_TIMEOUT_MS;
  const left = () => deadline - now();
  const timeoutFor = () => Math.max(1, Math.min(callCap, left()));
  const base = { model: opts.model, max_tokens: opts.maxTokens ?? 600, system: opts.system, tools: opts.tools };

  const messages: ApiMessage[] = [...opts.messages];
  const calls: ToolCall[] = [];
  for (let round = 0; round < (opts.maxRounds ?? 4); round += 1) {
    // A round can call tools and then needs another call to answer: never start one without room for both.
    if (left() < CHAT_MIN_ROUND_MS) break;
    const reply = await opts.create({ ...base, messages, timeout_ms: timeoutFor() });
    const text = textOf(reply);
    const uses = reply.content.filter(isToolUse);
    if (uses.length === 0 || reply.stop_reason !== 'tool_use') return { text, calls };

    messages.push({ role: 'assistant', content: reply.content as Array<Record<string, unknown>> });
    const results: Array<Record<string, unknown>> = [];
    for (const use of uses) {
      let result: unknown;
      let isError = false;
      try {
        result = await opts.execute(use.name, use.input);
      } catch (err) {
        console.error('chat: tool failed', use.name, err instanceof Error ? err.message : err);
        isError = true;
        result = { ok: false, error: 'That did not work. Offer to take their name and number instead.' };
      }
      calls.push({ name: use.name, input: use.input, result, isError });
      results.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(result), ...(isError ? { is_error: true } : {}) });
    }
    messages.push({ role: 'user', content: results });
  }
  // Rounds or time ran out (a booking may have gone through): one closing call
  // with tools switched off, so the visitor hears what happened, but only when it
  // fits. Otherwise, or if it fails, the calls go back and finalizeReply's fixed
  // text speaks ("You're booked for ...", "has your number").
  if (left() < CHAT_MIN_CLOSING_MS) return { text: '', calls };
  try {
    const closing = await opts.create({ ...base, messages, tool_choice: { type: 'none' }, timeout_ms: timeoutFor() });
    return { text: textOf(closing), calls };
  } catch (err) {
    console.error('chat: closing reply failed', err instanceof Error ? err.message : err);
    return { text: '', calls };
  }
}
