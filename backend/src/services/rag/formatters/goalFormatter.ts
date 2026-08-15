import { AIPipelineRawResult } from '../types';

/**
 * Goal Analysis Response Formatter
 *
 * Parses the AI's adaptive JSON response (which varies by goal situation).
 * Only passes through fields that actually exist in the AI response — never injects defaults.
 * Falls back gracefully if the AI returns non-JSON text.
 *
 * Financial Calculation Constraint:
 * This formatter does NOT compute, derive, or validate financial values.
 * It only structures the AI's explanation for the frontend to render.
 * The verified financial numbers live in the pre-calculated context — not here.
 */
export function formatGoalResponse(goalId: string, raw: AIPipelineRawResult, goalName?: string) {
  const parsed = parseAdaptiveGoalJSON(raw.reply, goalName);

  return {
    goal_id: goalId,
    explanation: parsed,
    disclaimer: 'Advisory simulation only. Recommendations are not trading orders and do not constitute financial advice.'
  };
}

/**
 * Valid situation values the AI/fallback can emit.
 */
const VALID_SITUATIONS = new Set(['on_track', 'small_shortfall', 'large_shortfall', 'fully_funded', 'missing_data']);

/**
 * Safely parse the AI's adaptive JSON goal response.
 * Returns only the fields present — never manufactures missing ones.
 */
function parseAdaptiveGoalJSON(rawReply: string, goalNameFallback?: string): Record<string, any> {
  const defaultSummary = goalNameFallback
    ? `AI Goal Coach analysis for ${goalNameFallback}.`
    : 'AI Goal Coach analysis is unavailable. Please review your goal data and try again.';

  if (!rawReply) {
    return { summary: defaultSummary, situation: 'missing_data' };
  }

  // Strip markdown code fences if the model wrapped the JSON anyway
  const cleaned = rawReply
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Attempt to extract JSON object from response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const result: Record<string, any> = {};

      // summary — always required
      if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
        result.summary = parsed.summary.trim();
      } else {
        result.summary = defaultSummary;
      }

      // situation — must be one of the valid values
      if (typeof parsed.situation === 'string' && VALID_SITUATIONS.has(parsed.situation)) {
        result.situation = parsed.situation;
      }

      // context — optional string
      if (typeof parsed.context === 'string' && parsed.context.trim()) {
        result.context = parsed.context.trim();
      }

      // strategies — optional array of strings (max 3)
      if (Array.isArray(parsed.strategies) && parsed.strategies.length > 0) {
        const valid = parsed.strategies
          .filter((s: any) => typeof s === 'string' && s.trim())
          .map((s: string) => s.trim())
          .slice(0, 3);
        if (valid.length > 0) result.strategies = valid;
      }

      // tradeoffs — optional array of strings (max 3)
      if (Array.isArray(parsed.tradeoffs) && parsed.tradeoffs.length > 0) {
        const valid = parsed.tradeoffs
          .filter((s: any) => typeof s === 'string' && s.trim())
          .map((s: string) => s.trim())
          .slice(0, 3);
        if (valid.length > 0) result.tradeoffs = valid;
      }

      // action — optional string
      if (typeof parsed.action === 'string' && parsed.action.trim()) {
        result.action = parsed.action.trim();
      }

      // optimization — optional string (only meaningful for on_track / fully_funded)
      if (typeof parsed.optimization === 'string' && parsed.optimization.trim()) {
        result.optimization = parsed.optimization.trim();
      }

      // missing — optional array of strings
      if (Array.isArray(parsed.missing) && parsed.missing.length > 0) {
        const valid = parsed.missing
          .filter((s: any) => typeof s === 'string' && s.trim())
          .map((s: string) => s.trim());
        if (valid.length > 0) result.missing = valid;
      }

      return result;
    } catch {
      // JSON.parse failed — fall through to plain text fallback
    }
  }

  // If the AI returned plain text (not JSON), surface it as the summary
  return {
    summary: cleaned.length > 0 ? cleaned.slice(0, 500) : defaultSummary,
    situation: 'missing_data'
  };
}
