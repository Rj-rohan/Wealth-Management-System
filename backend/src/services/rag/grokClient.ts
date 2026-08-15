/**
 * Fast LLM Client — Supports both Groq (gsk_...) and xAI Grok (xai-...)
 *
 * Design:
 * - Automatically detects provider from API key prefix:
 *   - 'gsk_...': GroqCloud (baseURL: https://api.groq.com/openai/v1, model: llama-3.3-70b-versatile) — Free Tier Ready!
 *   - 'xai-...': xAI Grok (baseURL: https://api.x.ai/v1, model: grok-3)
 * - Single configured model with hard SDK-level timeout.
 * - maxRetries: 0 — any failure immediately throws GrokUnavailableError
 *   so engine.ts can escalate to Gemini/Local without delay.
 */

import OpenAI from 'openai';

export class GrokUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GrokUnavailableError';
  }
}

class GrokClient {
  private client: OpenAI;
  readonly isConfigured: boolean;
  readonly provider: 'Groq' | 'xAI Grok' | 'None';
  private model: string;

  constructor() {
    const apiKey = (process.env.GROK_API_KEY || '').trim();
    this.isConfigured = apiKey.length > 0;

    let baseURL = 'https://api.x.ai/v1';
    let defaultModel = 'grok-3';

    if (apiKey.startsWith('gsk_')) {
      this.provider = 'Groq';
      baseURL = 'https://api.groq.com/openai/v1';
      defaultModel = 'llama-3.3-70b-versatile';
    } else if (apiKey.startsWith('xai-')) {
      this.provider = 'xAI Grok';
      baseURL = 'https://api.x.ai/v1';
      defaultModel = 'grok-3';
    } else {
      this.provider = this.isConfigured ? 'xAI Grok' : 'None';
    }

    this.model = process.env.GROK_MODEL_NAME || defaultModel;
    const timeoutMs = Number(process.env.GROK_TIMEOUT_MS) || 4000;

    this.client = new OpenAI({
      apiKey: apiKey || 'missing-key',
      baseURL,
      timeout: timeoutMs,
      maxRetries: 0,
    });
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.isConfigured) {
      throw new GrokUnavailableError('GROK_API_KEY is not configured');
    }
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (!text) throw new GrokUnavailableError(`Empty response from ${this.provider}`);
      return text;
    } catch (err: any) {
      if (err instanceof GrokUnavailableError) throw err;
      throw new GrokUnavailableError(err?.message || `${this.provider} API error`);
    }
  }

  async chat(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    if (!this.isConfigured) {
      throw new GrokUnavailableError('GROK_API_KEY is not configured');
    }
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.4,
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (!text) throw new GrokUnavailableError(`Empty response from ${this.provider}`);
      return text;
    } catch (err: any) {
      if (err instanceof GrokUnavailableError) throw err;
      throw new GrokUnavailableError(err?.message || `${this.provider} API error`);
    }
  }
}

export const grokClient = new GrokClient();
