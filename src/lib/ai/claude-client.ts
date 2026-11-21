import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { OutputConfig, StopReason } from '@anthropic-ai/sdk/resources/messages/messages';
import { CLAUDE_TIMEOUT_MS, getAiModel } from './ai-config';

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';
export type ClaudeImage = { mediaType: ImageMediaType; base64: string };

/** Failure kinds the routes translate to HTTP statuses and the UI to microcopy. */
export type AiFailureKind = 'timeout' | 'aborted' | 'busy' | 'upstream' | 'bad_output';

export class AiCallError extends Error {
  constructor(
    readonly kind: AiFailureKind,
    message: string,
  ) {
    super(message);
    this.name = 'AiCallError';
  }
}

/** A JSON Schema for an object, sent to the model as text in the system prompt. */
export type JsonObjectSchema = { type: 'object'; properties: Record<string, unknown>; required?: readonly string[] };

export type ClaudeJsonCall = {
  system: string;
  /** Large, rarely changing context (the pose catalog). Marked cacheable so repeat calls are cheaper. */
  cachedContext?: string;
  userText: string;
  images: ClaudeImage[];
  /** The answer must be one JSON object matching this schema (told to the model, validated by the caller). */
  schema: JsonObjectSchema;
  /** Thinking is always on for current models and counts toward this, so leave room. */
  maxTokens: number;
  effort: NonNullable<OutputConfig['effort']>;
  /** Abort when the user cancels (pass the request's signal). */
  signal?: AbortSignal;
};

export type ClaudeUsage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };

/**
 * Return the JSON object in the model's text answer (tolerates a ```json fence or stray words
 * around it). Throws `bad_output` when it is missing, cut off, refused or not valid JSON.
 * Field-level validation is the caller's job (parse-ai-output.ts drops invalid fields).
 */
export function readJsonAnswer(message: { stop_reason: StopReason | null; content: Array<{ type: string; text?: string }> }): unknown {
  if (message.stop_reason === 'max_tokens') throw new AiCallError('bad_output', 'response cut off at max_tokens');
  if (message.stop_reason === 'refusal') throw new AiCallError('bad_output', 'model refused');
  const text = message.content.map((b) => (b.type === 'text' ? (b.text ?? '') : '')).join('');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new AiCallError('bad_output', 'no JSON object in response');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AiCallError('bad_output', 'response is not valid JSON');
  }
}

/** Instruction telling the model the exact JSON shape (sent as text: the schema is too complex for structured outputs). */
export function jsonAnswerInstruction(schema: JsonObjectSchema): string {
  return `Chỉ trả lời bằng MỘT đối tượng JSON hợp lệ, không kèm chữ nào khác và không dùng markdown. Tên khóa, kiểu dữ liệu và giá trị cho phép theo JSON Schema sau; khóa nào không chắc thì bỏ hẳn khóa đó:\n${JSON.stringify(schema)}`;
}

export function mapSdkError(e: unknown): AiCallError {
  if (e instanceof AiCallError) return e;
  if (e instanceof Anthropic.APIUserAbortError) return new AiCallError('aborted', 'request aborted');
  if (e instanceof Anthropic.APIConnectionTimeoutError) return new AiCallError('timeout', 'claude timeout');
  if (e instanceof Anthropic.APIError) {
    const busy = e.status === 429 || e.status === 529 || e.status === 503;
    // Anthropic's own explanation (never contains the key) so server logs show why a call failed.
    const detail = [e.type, e.errorCode, e.apiMessage?.slice(0, 300), e.requestID && `request ${e.requestID}`]
      .filter(Boolean)
      .join(' | ');
    return new AiCallError(busy ? 'busy' : 'upstream', `claude api status ${e.status ?? 'none'}${detail ? `: ${detail}` : ''}`);
  }
  return new AiCallError('upstream', e instanceof Error ? e.message : 'unknown claude error');
}

/**
 * One Claude call whose answer is a JSON object shaped by `schema`. The schema goes in the system
 * prompt as text: forced `tool_choice` is rejected by current models, and structured outputs
 * (`output_config.format`) rejected this schema as "too complex" after ~56s (measured).
 */
export async function callClaudeJson(call: ClaudeJsonCall): Promise<{ output: unknown; usage: ClaudeUsage }> {
  // Created per call so a key added to the environment is picked up without a rebuild.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
  try {
    const message = await client.messages.create(
      {
        model: getAiModel(),
        max_tokens: call.maxTokens,
        output_config: { effort: call.effort },
        system: [
          { type: 'text', text: call.system },
          { type: 'text', text: jsonAnswerInstruction(call.schema) },
          ...(call.cachedContext
            ? [{ type: 'text' as const, text: call.cachedContext, cache_control: { type: 'ephemeral' as const } }]
            : []),
        ],
        messages: [
          {
            role: 'user',
            content: [
              ...call.images.map((img) => ({
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
              })),
              { type: 'text' as const, text: call.userText },
            ],
          },
        ],
      },
      { signal: call.signal, timeout: CLAUDE_TIMEOUT_MS },
    );
    const output = readJsonAnswer(message);
    const u = message.usage;
    return {
      output,
      usage: {
        inputTokens: u.input_tokens,
        outputTokens: u.output_tokens,
        cacheReadTokens: u.cache_read_input_tokens ?? 0,
        cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
      },
    };
  } catch (e) {
    throw mapSdkError(e);
  }
}
