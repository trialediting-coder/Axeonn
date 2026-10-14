// lib/chatLoop.ts
// One chat turn's tool loop over the Messages API, with the API call injected
// (lib/chat.ts passes the real SDK; tests pass a fake). Runs tools the model asks
// for, feeds results back, stops at a reply without tool calls or after
// maxRounds. A tool that throws becomes a generic error result: the model sees
// that it failed, never the internal message. No Node imports, no SDK at runtime.
import type { ApiMessage, ChatToolDef, ToolCall } from '@/lib/chatShared';

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: string; [key: string]: unknown };

export interface ModelReply {
  content: ContentBlock[];
  stop_reason: string | null;
}

export type CreateMessage = (req: { model: string; max_tokens: number; system: string; tools: readonly ChatToolDef[]; messages: ApiMessage[] }) => Promise<ModelReply>;

export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

const isText = (b: ContentBlock): b is { type: 'text'; text: string } => b.type === 'text' && typeof (b as { text?: unknown }).text === 'string';
const isToolUse = (b: ContentBlock): b is { type: 'tool_use'; id: string; name: string; input: unknown } =>
  b.type === 'tool_use' && typeof (b as { id?: unknown }).id === 'string' && typeof (b as { name?: unknown }).name === 'string';

export async function runToolLoop(opts: {
  create: CreateMessage;
  model: string;
  system: string;
  tools: readonly ChatToolDef[];
  messages: ApiMessage[];
  execute: ToolExecutor;
  maxRounds?: number;
  maxTokens?: number;
}): Promise<{ text: string; calls: ToolCall[] }> {
  const messages: ApiMessage[] = [...opts.messages];
  const calls: ToolCall[] = [];
  for (let round = 0; round < (opts.maxRounds ?? 4); round += 1) {
    const reply = await opts.create({ model: opts.model, max_tokens: opts.maxTokens ?? 600, system: opts.system, tools: opts.tools, messages });
    const text = reply.content.filter(isText).map((b) => b.text).join('\n').trim();
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
  return { text: '', calls };
}
