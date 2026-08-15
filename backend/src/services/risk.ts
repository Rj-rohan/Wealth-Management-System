/**
 * Risk Radar — portfolio stress testing.
 *
 * Ported from the Next.js route handler `app/api/risk/stress-test`. The shock
 * multiplier matrix and the impact arithmetic are unchanged; only the LLM call
 * was redirected through the shared fast-LLM client.
 */

import { completeJson } from './llm/fastLlm';

export interface StressHolding {
  name: string;
  sector: string;
  value: number;
  category: string;
}

export interface StressResultHolding extends StressHolding {
  before: number;
  after: number;
  impact: number;
  impactPercent: number;
  multiplier: number;
}

export interface StressTestResult {
  scenario: string;
  holdings: StressResultHolding[];
  totalBefore: number;
  totalAfter: number;
  totalImpact: number;
  totalImpactPercent: number;
  recoveryEstimateDays: number;
  narrative: string;
  mitigations: string[];
}

const SHOCK_MULTIPLIERS: Record<string, Record<string, number>> = {
  market_crash_20: {
    equity: -0.2, bonds: 0.05, gold: 0.08, cash: 0, FDs: 0,
    'large-cap': -0.18, 'mid-cap': -0.22, 'small-cap': -0.28,
    IT: -0.2, Banking: -0.22, FMCG: -0.12, Power: -0.15,
    Tyres: -0.25, Microfinance: -0.3, default: -0.2,
  },
  rate_hike_200bps: {
    equity: -0.08, bonds: -0.12, gold: 0.02, cash: 0.02, FDs: 0.06,
    Banking: -0.05, IT: -0.08, FMCG: -0.04, Power: -0.1,
    Tyres: -0.12, Microfinance: -0.15, default: -0.08,
  },
  currency_shock_15: {
    equity: -0.03, bonds: -0.02, gold: 0.05, cash: 0, FDs: 0,
    IT: 0.1, FMCG: -0.08, Banking: -0.05, Power: -0.03,
    Tyres: -0.15, Microfinance: -0.05, default: -0.03,
  },
  liquidity_crunch: {
    equity: -0.08, bonds: -0.03, gold: 0.02, cash: 0, FDs: 0,
    'small-cap': -0.25, 'large-cap': -0.08, 'mid-cap': -0.15,
    Microfinance: -0.3, Banking: -0.12, IT: -0.05,
    FMCG: -0.03, Power: -0.08, Tyres: -0.18, default: -0.08,
  },
};

/** Reference portfolio used when the caller has no holdings of their own yet. */
const DEFAULT_HOLDINGS: StressHolding[] = [
  { name: 'TCS', sector: 'IT', value: 585000, category: 'large-cap' },
  { name: 'Infosys', sector: 'IT', value: 460000, category: 'large-cap' },
  { name: 'HDFC Bank', sector: 'Banking', value: 340000, category: 'large-cap' },
  { name: 'NTPC', sector: 'Power', value: 280000, category: 'large-cap' },
  { name: 'Apollo Tyres', sector: 'Tyres', value: 195000, category: 'mid-cap' },
  { name: 'CEAT', sector: 'Tyres', value: 175000, category: 'mid-cap' },
  { name: 'IndusInd Bank', sector: 'Banking', value: 165000, category: 'mid-cap' },
  { name: 'HUL', sector: 'FMCG', value: 250000, category: 'large-cap' },
];

export interface CustomShockParams {
  equityShock?: number;
  bondShock?: number;
  goldShock?: number;
}

export class UnknownScenarioError extends Error {}

export async function runStressTest(
  scenario: string,
  customParams?: CustomShockParams,
  userHoldings?: StressHolding[]
): Promise<StressTestResult> {
  const holdings = userHoldings && userHoldings.length > 0 ? userHoldings : DEFAULT_HOLDINGS;

  // Resolve shock multipliers
  let shocks: Record<string, number>;
  if (scenario === 'custom' && customParams) {
    shocks = {
      equity: (customParams.equityShock || 0) / 100,
      bonds: (customParams.bondShock || 0) / 100,
      gold: (customParams.goldShock || 0) / 100,
      default: (customParams.equityShock || 0) / 100,
    };
  } else {
    const preset = SHOCK_MULTIPLIERS[scenario];
    if (!preset) throw new UnknownScenarioError('Unknown scenario');
    shocks = preset;
  }

  // Compute impact per holding
  const results: StressResultHolding[] = holdings.map((h) => {
    const multiplier = shocks[h.sector] ?? shocks[h.category] ?? shocks.equity ?? shocks.default ?? 0;
    const before = h.value;
    const after = Math.round(before * (1 + multiplier));
    const impact = after - before;
    const impactPercent = ((impact / before) * 100).toFixed(1);
    return { ...h, before, after, impact, impactPercent: parseFloat(impactPercent), multiplier };
  });

  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter = results.reduce((s, r) => s + r.after, 0);
  const totalImpact = totalAfter - totalBefore;
  const totalImpactPercent = parseFloat(((totalImpact / totalBefore) * 100).toFixed(2));
  const recoveryEstimateDays = Math.round(Math.abs(totalImpactPercent) * 4);

  // AI narrative, with a deterministic analyst fallback
  let narrative = '';
  let mitigations: string[] = [];

  const parsed = await completeJson<{ narrative?: string; mitigations?: string[] }>(
    [
      { role: 'system', content: 'You are a financial risk analyst. Respond ONLY with valid JSON, no markdown.' },
      {
        role: 'user',
        content: `Portfolio stress test result: ${JSON.stringify({
          scenario, totalImpact, totalImpactPercent, recoveryEstimateDays,
          holdings: results.map((r) => ({ name: r.name, sector: r.sector, impact: r.impact, impactPercent: r.impactPercent })),
        })}. Write a 3-sentence risk narrative and exactly 3 mitigation actions. Respond in JSON: { "narrative": "string", "mitigations": ["string", "string", "string"] }`,
      },
    ],
    { temperature: 0.5, maxTokens: 512 }
  );

  if (parsed) {
    narrative = parsed.narrative || '';
    mitigations = parsed.mitigations || [];
  }
  if (!narrative) narrative = getDefaultNarrative(scenario, totalImpactPercent);
  if (!mitigations.length) mitigations = getDefaultMitigations(scenario);

  return {
    scenario,
    holdings: results,
    totalBefore,
    totalAfter,
    totalImpact,
    totalImpactPercent,
    recoveryEstimateDays,
    narrative,
    mitigations,
  };
}

function getDefaultNarrative(scenario: string, impactPct: number): string {
  const narratives: Record<string, string> = {
    market_crash_20: `A 20% market crash would reduce your portfolio by ${Math.abs(impactPct)}%, with the heaviest losses concentrated in mid-cap and small-cap positions. Your IT sector holdings in TCS and Infosys would see significant drawdowns but are well-positioned for recovery given their strong fundamentals. The estimated recovery period is ${Math.round(Math.abs(impactPct) * 4)} days based on historical crash recovery patterns.`,
    rate_hike_200bps: `A 200bps rate hike scenario would impact your portfolio by ${Math.abs(impactPct)}%, with banking stocks experiencing mixed effects and rate-sensitive sectors bearing the brunt. Your FD positions would benefit from higher rates, providing a natural hedge. Consider reallocating towards banking names that benefit from higher net interest margins.`,
    currency_shock_15: `A 15% currency depreciation would create a mixed impact of ${Math.abs(impactPct)}% on your portfolio. Export-oriented IT stocks would benefit significantly, while import-heavy sectors like tyres would face margin pressure. Your portfolio's IT-heavy allocation provides a natural hedge against rupee weakness.`,
    liquidity_crunch: `A liquidity crunch scenario would hit your portfolio by ${Math.abs(impactPct)}%, with small and mid-cap holdings facing the steepest declines due to reduced market depth. Large-cap holdings in TCS and HUL would be relatively resilient due to institutional holding support. The recovery timeline depends on RBI's liquidity intervention measures.`,
  };
  return (
    narratives[scenario] ||
    `This scenario would impact your portfolio by ${Math.abs(impactPct)}%. Diversification across sectors helps mitigate concentrated risk.`
  );
}

function getDefaultMitigations(scenario: string): string[] {
  const mitigations: Record<string, string[]> = {
    market_crash_20: [
      'Increase cash allocation to 15% to capitalize on buying opportunities during the dip',
      'Add put options on Nifty 50 to hedge tail risk — cost: ~2% of portfolio value',
      'Set limit orders at 15% below current prices for quality large-caps like TCS and HUL',
    ],
    rate_hike_200bps: [
      'Shift 10% from long-duration bonds to short-term FDs to reduce interest rate sensitivity',
      'Increase allocation to banking stocks that benefit from wider NIMs (HDFC Bank, ICICI)',
      'Review and reduce exposure to capital-intensive sectors like power and infrastructure',
    ],
    currency_shock_15: [
      'Increase IT sector weight to 40% to benefit from rupee depreciation on export earnings',
      'Reduce exposure to import-dependent sectors like tyres by 5-10%',
      'Consider adding gold (5% allocation) as an additional currency depreciation hedge',
    ],
    liquidity_crunch: [
      'Shift 15% from small/mid-cap to large-cap positions for better liquidity during stress',
      'Maintain minimum 3 months of expenses in liquid funds or cash equivalents',
      'Exit or reduce positions in illiquid microfinance stocks and move to top-10 bank stocks',
    ],
  };
  return (
    mitigations[scenario] || [
      'Diversify across asset classes to reduce concentration risk',
      'Maintain adequate cash reserves for 3-6 months of expenses',
      'Review portfolio allocation quarterly and rebalance as needed',
    ]
  );
}
