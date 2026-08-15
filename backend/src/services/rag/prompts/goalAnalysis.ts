import { UnifiedAIContext } from '../types';

/**
 * Builds the goal analysis prompt with:
 * 1. Pre-calculated verified numbers injected as ground truth (AI must NOT recalculate)
 * 2. Financial Calculation Constraint — hard prohibition at system prompt level
 * 3. Adaptive JSON schema — AI returns only the fields meaningful for this goal's situation
 */
export function buildGoalAnalysisPrompt(context: UnifiedAIContext, contextText: string): { systemPrompt: string; fullPrompt: string } {
  const goal = context.selectedGoal;

  // Pre-calculated numbers from Edelman Solver calculation engine
  const verifiedData = goal ? buildVerifiedGoalNumbers(goal) : 'Goal data not available.';
  const situation = goal ? detectSituation(goal) : 'missing_data';

  const systemPrompt = `You are Weallth's AI Goal Coach — an Indian wealth management application (INR ₹ only).

Your task: Explain a client's financial goal situation in plain language using ONLY the pre-calculated verified numbers below. Suggest what they should do next based on the situation.

FINANCIAL CALCULATION CONSTRAINT (MANDATORY — NON-NEGOTIABLE):
The AI must NEVER calculate, modify, estimate, or invent any financial numbers.
All monetary values, percentages, ratios, and contribution figures in the VERIFIED GOAL DATA section below were pre-calculated by the deterministic Edelman Solver calculation engine from the user's actual database records.
Do NOT recalculate, derive, modify, or guess any financial figure.
Reference ONLY the numbers provided. Explain them — do not recompute them.
If required data shows "Not provided", you MUST emit a "missing" field stating what is absent — NEVER substitute an estimated value.

FINANCIAL ACCURACY RULE (MANDATORY):
This is an Indian-context application. Do NOT reference foreign account types, tax wrappers, or financial products such as 401(k), Roth IRA, HSA, 403(b), ISA, TFSA, or any US/UK/foreign equivalent.
Use only instruments present in the user's data or the retrieved knowledge (EPF, VPF, NPS, ELSS, SIP, PPF).
If information is unavailable, state so explicitly — never guess.

RESPONSE FORMAT RULE:
Return a JSON object with ONLY the fields that are meaningful for this specific goal situation: "${situation}".
Do not pad the response with irrelevant sections. Different situations need different depths and concise word counts:

Word Count Targets:
- Simple / On-Track / Fully-Funded / Missing Data: 60–120 words
- Moderate Shortfall: 100–180 words
- Large Shortfall: Up to 250 words

Situation → Fields to include:
- "on_track" or "fully_funded":    summary, situation, action OR optimization (not both unless genuinely applicable)
- "small_shortfall" (< 20% gap):   summary, situation, strategies (1–2 items), action
- "large_shortfall" (≥ 20% gap):   summary, situation, context, strategies (2–3 items), tradeoffs, action
- "missing_data":                   summary, situation, missing (list what data is absent)

Available fields (all optional except "summary" and "situation"):
{
  "summary": "REQUIRED. 1–2 sentences explaining the goal's current state using ONLY the verified numbers. Be specific — include the goal name, funded %, and shortfall or surplus.",
  "situation": "REQUIRED. Exactly one of: on_track | small_shortfall | large_shortfall | fully_funded | missing_data",
  "context": "Optional. Why this gap matters for THIS goal specifically based on its category (e.g., retirement compounding, education horizon, emergency buffer). Never generic. Include ONLY for large_shortfall or retirement goals.",
  "strategies": "Optional. Array of 1–3 concise strategy strings (1 sentence each). Reference the verified Option A/B/C figures provided when relevant. Include only when there is an actionable shortfall.",
  "tradeoffs": "Optional. Array of 2–3 strings — exactly 1 concise sentence per option explaining the trade-off. Include ONLY for large_shortfall situations.",
  "action": "Optional. The single most important next step — specific to the available options (e.g. Option A/B/C) and naming the verified amount. One direct sentence.",
  "optimization": "Optional. For fully_funded or on_track goals only — suggest how to put surplus funds to work. Skip for all shortfall situations.",
  "missing": "Optional. Array of strings describing exactly what data is missing. Include ONLY when situation is missing_data. Never guess values that are missing."
}

Return ONLY valid JSON. No markdown fences, no explanations outside the JSON object.`;

  const fullPrompt = `${systemPrompt}

VERIFIED GOAL DATA (pre-calculated by Edelman Solver engine — do NOT recalculate):
${verifiedData}

DETECTED SITUATION: ${situation}

RETRIEVED KNOWLEDGE (Ric Edelman principles — use for context and explanation only, not for financial calculations):
${contextText}

Respond with a JSON object containing only the fields appropriate for a "${situation}" goal situation:`;

  return { systemPrompt, fullPrompt };
}

/**
 * Formats pre-calculated goal data for injection into the prompt.
 * All values come from the Edelman Solver calculation engine — never computed here.
 * Missing/zero fields are marked as "Not provided" so the LLM emits `missing`, not guesses.
 */
function buildVerifiedGoalNumbers(goal: NonNullable<UnifiedAIContext['selectedGoal']>): string {
  const lines: string[] = [];
  const options = goal.options;

  lines.push(`- Goal Name: ${goal.name}`);
  lines.push(`- Category: ${goal.category}`);
  lines.push(`- Priority: ${goal.priority}`);
  lines.push(`- Target Amount: ₹${goal.targetAmount.toLocaleString('en-IN')} by ${goal.targetYear}`);
  lines.push(`- Already Saved: ₹${goal.alreadySaved.toLocaleString('en-IN')}`);
  lines.push(`- Funded: ${goal.fundedPercentage}% of target`);

  if (goal.monthlyContribution > 0) {
    lines.push(`- Current Monthly Contribution: ₹${goal.monthlyContribution.toLocaleString('en-IN')}/month`);
  } else {
    lines.push(`- Current Monthly Contribution: Not provided`);
  }

  if (goal.shortfall > 0) {
    lines.push(`- Projected Shortfall: ₹${goal.shortfall.toLocaleString('en-IN')} (funding gap)`);
  } else {
    lines.push(`- Projected Shortfall: None — goal is on track or fully funded`);
  }

  // Edelman Solver Options (pre-calculated by engine)
  if (options) {
    lines.push('');
    lines.push('Edelman Solver Options (pre-calculated):');
    if (options.optionA_monthlySavings > 0) {
      lines.push(`  - Option A (Boost Savings): Increase monthly contribution to ₹${options.optionA_monthlySavings.toLocaleString('en-IN')}/month`);
    } else {
      lines.push(`  - Option A (Boost Savings): Not provided`);
    }
    if (options.optionB_presentCost > 0) {
      lines.push(`  - Option B (Reduce Target): Reduce goal target to ₹${options.optionB_presentCost.toLocaleString('en-IN')} (present value)`);
    } else {
      lines.push(`  - Option B (Reduce Target): Not provided`);
    }
    if (options.optionC_delayMonths > 0) {
      lines.push(`  - Option C (Extend Timeline): Delay goal by ${options.optionC_delayMonths} months`);
    } else {
      lines.push(`  - Option C (Extend Timeline): Not provided`);
    }
  } else {
    lines.push('');
    lines.push('Edelman Solver Options: Not provided (goal may be fully funded or data unavailable)');
  }

  return lines.join('\n');
}

/**
 * Detects the goal situation for adaptive prompt targeting.
 * Used to tell the LLM which JSON fields to emit.
 * Decision is made from pre-calculated values only — no arithmetic here.
 */
function detectSituation(goal: NonNullable<UnifiedAIContext['selectedGoal']>): string {
  // Missing data: no contribution and no options (can't assess)
  if (goal.monthlyContribution === 0 && !goal.options) {
    return 'missing_data';
  }
  // Fully funded or no shortfall
  if (goal.shortfall <= 0) {
    return goal.fundedPercentage >= 100 ? 'fully_funded' : 'on_track';
  }
  // Shortfall present — classify by severity (% of target)
  const shortfallPct = goal.targetAmount > 0 ? (goal.shortfall / goal.targetAmount) * 100 : 0;
  if (shortfallPct >= 20) return 'large_shortfall';
  return 'small_shortfall';
}

/**
 * Local fallback — used when all LLM tiers (Grok → Gemini) fail.
 *
 * FINANCIAL CALCULATION CONSTRAINT:
 * This function reads ONLY from the pre-calculated context.selectedGoal object.
 * It performs NO arithmetic. If a field is missing, it emits a "missing" entry.
 * It never substitutes an estimated or computed value.
 *
 * Returns a valid JSON string matching the adaptive schema so the formatter
 * can parse it consistently regardless of whether it came from an LLM or this fallback.
 */
export function generateGoalAnalysisFallback(context: UnifiedAIContext): string {
  const goal = context.selectedGoal;

  if (!goal) {
    return JSON.stringify({
      summary: 'Select a financial goal to view your personalised AI Goal Coach strategy.',
      situation: 'missing_data',
      missing: ['No goal selected.']
    });
  }

  const situation = detectSituation(goal);
  const options = goal.options;

  // Base: summary always uses ONLY verified values
  const targetStr = `₹${goal.targetAmount.toLocaleString('en-IN')}`;
  const savedStr = `₹${goal.alreadySaved.toLocaleString('en-IN')}`;
  const shortfallStr = goal.shortfall > 0 ? `₹${goal.shortfall.toLocaleString('en-IN')}` : null;
  const pct = goal.fundedPercentage;

  const result: Record<string, any> = { situation };

  if (situation === 'missing_data') {
    const missing: string[] = [];
    if (goal.monthlyContribution === 0) missing.push('Monthly contribution amount is not set.');
    if (!options) missing.push('Edelman Solver options are not available.');
    result.summary = `Your ${goal.name} goal is ${pct}% funded. Some data needed for a full strategy is missing.`;
    result.missing = missing;
    return JSON.stringify(result);
  }

  if (situation === 'fully_funded' || situation === 'on_track') {
    result.summary = `Your ${goal.name} goal is ${pct}% funded — you have saved ${savedStr} towards a target of ${targetStr}. No funding shortfall detected.`;
    result.optimization = 'Consider directing any surplus savings into higher-yield instruments to accelerate wealth accumulation.';
    return JSON.stringify(result);
  }

  // Shortfall situations — use only pre-calculated solver option values
  result.summary = `Your ${goal.name} goal is ${pct}% funded. You have saved ${savedStr} towards ${targetStr}, with a projected shortfall of ${shortfallStr}.`;

  const strategies: string[] = [];
  if (options?.optionA_monthlySavings && options.optionA_monthlySavings > 0) {
    strategies.push(`Increase your monthly savings to ₹${options.optionA_monthlySavings.toLocaleString('en-IN')}/month (Option A) to close the gap by ${goal.targetYear}.`);
  }
  if (options?.optionB_presentCost && options.optionB_presentCost > 0) {
    strategies.push(`Reduce your goal target to ₹${options.optionB_presentCost.toLocaleString('en-IN')} (Option B) to align with your current savings trajectory.`);
  }
  if (options?.optionC_delayMonths && options.optionC_delayMonths > 0) {
    strategies.push(`Extend the goal timeline by ${options.optionC_delayMonths} months (Option C) to allow compound growth to cover the shortfall.`);
  }
  if (strategies.length > 0) result.strategies = strategies;

  if (situation === 'large_shortfall') {
    result.context = `A shortfall of ${shortfallStr} on your ${goal.category} goal (${goal.name}) requires early course-correction before compounding costs increase.`;
    if (strategies.length >= 2) {
      result.tradeoffs = [
        `Option A: Increases monthly cash flow commitment by ${options?.optionA_monthlySavings ? '₹' + options.optionA_monthlySavings.toLocaleString('en-IN') : 'required amount'}, but guarantees reaching target on time.`,
        `Option B: Reduces present target cost to ₹${(options?.optionB_presentCost || 0).toLocaleString('en-IN')}, lowering required savings without extending timeline.`,
        `Option C: Delays horizon by ${options?.optionC_delayMonths || 0} months to let compound growth close the gap with lower monthly strain.`
      ];
    }
  }

  if (options?.optionA_monthlySavings && options.optionA_monthlySavings > 0) {
    result.action = `Prioritize Option A: Automate an additional contribution to reach ₹${options.optionA_monthlySavings.toLocaleString('en-IN')}/month to close the gap on schedule.`;
  }

  return JSON.stringify(result);
}
