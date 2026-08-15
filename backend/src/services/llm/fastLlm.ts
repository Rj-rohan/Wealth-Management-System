/**
 * Fast LLM client for the market-intelligence modules (AI CFO, Risk Radar,
 * Treasury Autopilot, Smart Reports).
 *
 * Both teams used the same provider through different SDKs: the wealth-planning
 * RAG engine talks to Groq's OpenAI-compatible endpoint via the `openai` SDK
 * (see services/rag/grokClient.ts), while the market-intelligence routes used
 * `groq-sdk` directly. This module unifies them onto a single client and a
 * single credential so the platform has one LLM configuration.
 *
 * GROQ_API_KEY is the primary variable; GROK_API_KEY is accepted as an alias so
 * an existing single-key deployment keeps working.
 *
 * Unlike grokClient (which is tuned for sub-4s RAG turnarounds), this client
 * allows longer generations — report writing needs ~2k tokens.
 */

import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function getApiKey(): string {
  return (process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '').trim();
}

export function isFastLlmConfigured(): boolean {
  return getApiKey().length > 0;
}

function getClient(): OpenAI {
  const apiKey = getApiKey();
  // xAI keys use a different base URL; everything else defaults to GroqCloud.
  const baseURL = apiKey.startsWith('xai-')
    ? 'https://api.x.ai/v1'
    : 'https://api.groq.com/openai/v1';

  return new OpenAI({
    apiKey: apiKey || 'missing-key',
    baseURL,
    timeout: Number(process.env.FAST_LLM_TIMEOUT_MS) || 30000,
    maxRetries: 0,
  });
}

function getModel(): string {
  const apiKey = getApiKey();
  const fallback = apiKey.startsWith('xai-') ? 'grok-3' : 'llama-3.3-70b-versatile';
  return process.env.GROQ_MODEL_NAME || process.env.GROK_MODEL_NAME || fallback;
}

/**
 * Single-shot completion. Returns the raw assistant text, or null when the
 * provider is unconfigured or the call fails — callers fall back to their
 * built-in analysis in that case.
 */
export async function complete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string | null> {
  if (!isFastLlmConfigured()) return null;
  try {
    const res = await getClient().chat.completions.create({
      model: getModel(),
      messages,
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.maxTokens ?? 512,
    });
    return res.choices[0]?.message?.content || null;
  } catch (err: any) {
    console.error('[fastLlm] completion failed:', err?.message || err);
    return null;
  }
}

/**
 * Same as `complete`, but parses the response as JSON. Returns null if the
 * model is unavailable or emits anything that is not valid JSON.
 */
export async function completeJson<T = any>(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<T | null> {
  const content = await complete(messages, opts);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Streaming completion. Yields content deltas as they arrive. Throws if the
 * provider is not configured — callers check `isFastLlmConfigured()` first.
 */
export async function* stream(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): AsyncGenerator<string> {
  if (!isFastLlmConfigured()) {
    throw new Error('No LLM API key configured (set GROQ_API_KEY)');
  }
  const completion = await getClient().chat.completions.create({
    model: getModel(),
    messages,
    stream: true,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
  });

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) yield content;
  }
}
