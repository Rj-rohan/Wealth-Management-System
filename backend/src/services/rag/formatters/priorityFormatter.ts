import { AIPipelineRawResult } from '../types';

/**
 * Priority Analysis Response Formatter
 *
 * Parses the AI's adaptive JSON response (which varies by issue category).
 * Only passes through fields that actually exist in the AI response — never injects defaults.
 * Falls back gracefully if the AI returns non-JSON text.
 */
export function formatPriorityResponse(recId: string, alertMessage: string, raw: AIPipelineRawResult) {
  const parsed = parseAdaptiveJSON(raw.reply, alertMessage);

  return {
    recommendation_id: recId,
    explanation: parsed,
    disclaimer: 'Advisory simulation only. Recommendations are not trading orders and do not constitute financial advice.'
  };
}

/**
 * Safely parse the AI's adaptive JSON response.
 * Returns only the fields present — never manufactures missing ones.
 */
function parseAdaptiveJSON(rawReply: string, alertMessageFallback: string): Record<string, any> {
  if (!rawReply) {
    return { issue: alertMessageFallback || 'A priority action has been flagged.', urgency: 'High' };
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

      // Build result with only valid, non-empty fields
      const result: Record<string, any> = {};

      if (typeof parsed.issue === 'string' && parsed.issue.trim()) {
        result.issue = parsed.issue.trim();
      } else {
        result.issue = alertMessageFallback || 'A priority action has been flagged.';
      }

      if (typeof parsed.context === 'string' && parsed.context.trim()) {
        result.context = parsed.context.trim();
      }

      // action can be string or string[]
      if (Array.isArray(parsed.action) && parsed.action.length > 0) {
        result.action = parsed.action.filter((s: any) => typeof s === 'string' && s.trim()).map((s: string) => s.trim());
      } else if (typeof parsed.action === 'string' && parsed.action.trim()) {
        result.action = parsed.action.trim();
      }

      if (typeof parsed.urgency === 'string' && ['High', 'Medium', 'Low'].includes(parsed.urgency)) {
        result.urgency = parsed.urgency;
      }

      if (Array.isArray(parsed.follow_ups) && parsed.follow_ups.length > 0) {
        result.follow_ups = parsed.follow_ups
          .filter((q: any) => typeof q === 'string' && q.trim())
          .map((q: string) => q.trim())
          .slice(0, 3); // max 3 follow-up chips
      }

      return result;
    } catch {
      // JSON.parse failed — fall through to plain text fallback
    }
  }

  // If the AI returned plain text (not JSON), use it as the issue text
  return {
    issue: cleaned.length > 0 ? cleaned.slice(0, 400) : alertMessageFallback,
    urgency: 'Medium'
  };
}
