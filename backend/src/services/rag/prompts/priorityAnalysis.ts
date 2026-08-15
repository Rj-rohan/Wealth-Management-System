import { UnifiedAIContext } from '../types';

/**
 * Builds the priority analysis prompt with:
 * 1. Pre-calculated verified numbers injected as ground truth (AI must NOT recalculate)
 * 2. Dual guardrails: Verified Numbers Rule + Financial Accuracy Rule
 * 3. Adaptive JSON schema — AI returns only the fields meaningful for this category
 */
export function buildPriorityAnalysisPrompt(context: UnifiedAIContext, contextText: string): { systemPrompt: string; fullPrompt: string } {
  const rec = context.selectedRecommendation;
  const profile = context.clientProfile;

  // Pre-calculated numbers from calculations/engine.ts (already computed before this call)
  const verifiedData = rec ? buildVerifiedNumbers(rec, profile) : '';

  const category = rec?.category || 'General';

  const systemPrompt = `You are Weallth's Priority Action Advisor — an Indian wealth management application (INR ₹ only).

Your task: Explain a specific financial rule violation to the client in plain language and suggest what they should do about it.

VERIFIED NUMBERS RULE (MANDATORY):
All monetary values, percentages, and ratios in the VERIFIED FINANCIAL DATA section below were
pre-calculated by a deterministic engine from the user's actual database records. Do NOT
recalculate, modify, estimate, or invent any financial figures. Reference only the numbers
provided. Explain them — do not derive them.

FINANCIAL ACCURACY RULE (MANDATORY):
This is an Indian-context application. Do NOT reference foreign account types, tax wrappers,
or financial products such as 401(k), Roth IRA, HSA, 403(b), ISA, TFSA, or any US/UK/foreign
equivalent. Use only instruments present in the user's data or the retrieved knowledge.
If information is unavailable, say so explicitly — never guess.

RESPONSE FORMAT RULE:
Return a JSON object with ONLY the fields that are meaningful for this specific issue type.
Do not pad the response with fields that add no value. Different issues need different depths:
- A simple debt issue: 3–4 fields (issue, action, urgency, and optionally context)
- A retirement or insurance gap: up to 6 fields (issue, context, action, urgency, follow_ups)
- Estate planning: 2–3 fields (issue, action, urgency)

Available fields (all optional except "issue"):
{
  "issue": "REQUIRED. Client-specific explanation of the violation using the verified numbers. 1–2 sentences.",
  "context": "Optional. Why this matters long-term. Include only for complex or compounding issues (retirement, savings rate). Skip for simple debt/emergency fund issues.",
  "action": "Optional. String for a single clear action, OR array of strings for multi-step situations. Include only if actionable steps are clear.",
  "urgency": "Optional. One of: High | Medium | Low. Include for all issues.",
  "follow_ups": "Optional. Array of 2–3 question strings. Include only for complex issues where the user is likely to have follow-up questions (retirement, portfolio, savings rate). Skip for simple debt or emergency fund issues."
}

Return ONLY valid JSON. No markdown fences, no explanations outside the JSON object.`;

  const fullPrompt = `${systemPrompt}

VERIFIED FINANCIAL DATA (do not recalculate — pre-computed from user's database):
${verifiedData}

RECOMMENDATION DETAILS:
- Category: ${category}
- Priority Level: ${rec?.priority || 'High'}
- Rule Violation: ${rec?.alertMessage || 'No alert message available'}
- System Reason: ${rec?.reason || 'Not provided'}
- Pre-calculated Benefit: ${rec?.expectedBenefit || 'Not provided'}

RETRIEVED KNOWLEDGE (Ric Edelman principles — use for context and explanation only):
${contextText}

Respond with a JSON object containing only the fields meaningful for a "${category}" issue:`;

  return { systemPrompt, fullPrompt };
}

/**
 * Formats pre-calculated financial context for injection into the prompt.
 * These numbers come from calculations/engine.ts — the AI must treat them as ground truth.
 */
function buildVerifiedNumbers(rec: NonNullable<UnifiedAIContext['selectedRecommendation']>, profile: UnifiedAIContext['clientProfile']): string {
  const lines: string[] = [];

  if (profile?.netWorth !== undefined)
    lines.push(`- Net Worth: ₹${profile.netWorth.toLocaleString('en-IN')}`);

  if (profile?.income)
    lines.push(`- Monthly Net Income: ₹${profile.income.toLocaleString('en-IN')}`);

  if (profile?.expenses)
    lines.push(`- Monthly Expenses: ₹${profile.expenses.toLocaleString('en-IN')}`);

  if (profile?.savingsRate !== undefined)
    lines.push(`- Current Savings Rate: ${Math.round(profile.savingsRate * 100)}% (target: 15%+)`);

  if (profile?.emergencyFundMonths !== undefined)
    lines.push(`- Emergency Fund Coverage: ${profile.emergencyFundMonths.toFixed(1)} months (target: 6 months)`);

  if (profile?.debts && profile.debts.length > 0) {
    profile.debts.forEach(d => {
      const annualInterest = Math.round(d.amount * (d.apr / 100));
      lines.push(`- Debt: ${d.title} — ₹${d.amount.toLocaleString('en-IN')} at ${d.apr}% APR (annual interest cost: ₹${annualInterest.toLocaleString('en-IN')})`);
    });
  }

  if (profile?.retirementReadiness !== undefined)
    lines.push(`- Retirement Readiness: ${Math.round(profile.retirementReadiness * 100)}% of target`);

  if (profile?.whsScore !== undefined)
    lines.push(`- Wealth Health Score: ${profile.whsScore}/100 (${profile.whsCategory || 'Caution'})`);

  return lines.length > 0 ? lines.join('\n') : 'Profile data not available for this user.';
}

/**
 * Local fallback — used when all LLM tiers fail.
 * Returns a minimal structured JSON string instead of plain text.
 */
export function generatePriorityAnalysisFallback(context: UnifiedAIContext): string {
  const rec = context.selectedRecommendation;

  if (!rec) {
    return JSON.stringify({
      issue: 'A priority action has been flagged on your profile. Please review your dashboard recommendations.',
      urgency: 'High'
    });
  }

  const fallbackAction = rec.action || 'Review your profile and follow the recommended action steps.';
  const result: Record<string, any> = {
    issue: rec.alertMessage || `A ${rec.category} rule violation has been detected.`,
    urgency: rec.priority === 'Critical' ? 'High' : rec.priority || 'Medium'
  };

  if (rec.reason) result.context = rec.reason;
  if (fallbackAction) result.action = fallbackAction;

  return JSON.stringify(result);
}
