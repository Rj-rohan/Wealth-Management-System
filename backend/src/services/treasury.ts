/**
 * Treasury Autopilot — cash-flow forecasting and idle-cash deployment.
 *
 * Ported from the Next.js route handlers `app/api/treasury/forecast` and
 * `app/api/treasury/groq-narrative`. The projection model (trend + seasonality
 * + noise), the shortfall detection and the FD ladder split are unchanged.
 */

import { completeJson } from './llm/fastLlm';

export interface CashProjection {
  date: string;
  projectedCash: number;
  confidence: number;
}

export interface FdLadderRung {
  tenor: string;
  amount: number;
  rate: number;
  estimatedReturn: number;
}

export interface TreasuryForecast {
  projections: CashProjection[];
  shortfallDates: string[];
  idleCashAmount: number;
  currentCash: number;
  projectedCash90d: number;
  fdLadderSuggestion: FdLadderRung[];
  monthlyAvgInflow: number;
  monthlyAvgOutflow: number;
}

/** Trailing six months of aggregated cash movements. */
const MONTHLY_HISTORY = [
  { month: 'Jan', inflows: 5200000, outflows: 4100000 },
  { month: 'Feb', inflows: 4800000, outflows: 4300000 },
  { month: 'Mar', inflows: 5500000, outflows: 4600000 },
  { month: 'Apr', inflows: 5100000, outflows: 4200000 },
  { month: 'May', inflows: 5800000, outflows: 4500000 },
  { month: 'Jun', inflows: 5300000, outflows: 4800000 },
];

const OPENING_CASH = 8500000; // ₹85 lakhs

export function buildForecast(days: number): TreasuryForecast {
  const avgInflow = MONTHLY_HISTORY.reduce((s, m) => s + m.inflows, 0) / MONTHLY_HISTORY.length;
  const avgOutflow = MONTHLY_HISTORY.reduce((s, m) => s + m.outflows, 0) / MONTHLY_HISTORY.length;
  const dailyInflow = avgInflow / 30;
  const dailyOutflow = avgOutflow / 30;

  // Trend slope (slight upward on expenses)
  const inflowTrend = 0.0008; // 0.08% daily increase
  const outflowTrend = 0.0012; // 0.12% daily increase

  // Seasonal factors (end of quarter dip, mid-month peaks)
  function getSeasonalFactor(dayOfMonth: number): number {
    if (dayOfMonth <= 5) return 1.15; // Salary credits
    if (dayOfMonth >= 25) return 0.85; // End of month payments
    if (dayOfMonth >= 28) return 0.75; // Rent, EMI
    return 1.0;
  }

  let currentCash = OPENING_CASH;
  const projections: CashProjection[] = [];
  const shortfallDates: string[] = [];
  const dangerThreshold = (avgOutflow / 30) * 3; // ~3 days of expenses

  const startDate = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dayOfMonth = date.getDate();

    const seasonal = getSeasonalFactor(dayOfMonth);
    const trendMultiplierIn = 1 + inflowTrend * d;
    const trendMultiplierOut = 1 + outflowTrend * d;

    const noise = 0.9 + Math.random() * 0.2;
    const dayInflow = dailyInflow * trendMultiplierIn * seasonal * noise;
    const dayOutflow = dailyOutflow * trendMultiplierOut * noise;

    currentCash += dayInflow - dayOutflow;

    // Confidence decreases over time
    const confidence = Math.max(0.5, 1 - d * 0.004);

    const dateStr = date.toISOString().split('T')[0];
    projections.push({
      date: dateStr,
      projectedCash: Math.round(currentCash),
      confidence: parseFloat(confidence.toFixed(2)),
    });

    if (currentCash < dangerThreshold) {
      shortfallDates.push(dateStr);
    }
  }

  // Idle cash = anything above two months of operating expenses
  const operatingCash = avgOutflow * 2;
  const idleCashAmount = Math.max(0, Math.round(currentCash - operatingCash));

  const fdLadderSuggestion: FdLadderRung[] = [
    {
      tenor: '30d',
      amount: Math.round(idleCashAmount * 0.3),
      rate: 6.5,
      estimatedReturn: Math.round(idleCashAmount * 0.3 * 0.065 * (30 / 365)),
    },
    {
      tenor: '60d',
      amount: Math.round(idleCashAmount * 0.35),
      rate: 7.0,
      estimatedReturn: Math.round(idleCashAmount * 0.35 * 0.07 * (60 / 365)),
    },
    {
      tenor: '90d',
      amount: Math.round(idleCashAmount * 0.35),
      rate: 7.25,
      estimatedReturn: Math.round(idleCashAmount * 0.35 * 0.0725 * (90 / 365)),
    },
  ];

  return {
    projections,
    shortfallDates,
    idleCashAmount,
    currentCash: OPENING_CASH,
    projectedCash90d: projections[projections.length - 1]?.projectedCash || 0,
    fdLadderSuggestion,
    monthlyAvgInflow: Math.round(avgInflow),
    monthlyAvgOutflow: Math.round(avgOutflow),
  };
}

export interface TreasuryNarrative {
  summary: string;
  actions: string[];
}

export async function buildNarrative(forecastData: Partial<TreasuryForecast> | undefined): Promise<TreasuryNarrative> {
  const parsed = await completeJson<TreasuryNarrative>(
    [
      { role: 'system', content: 'You are a treasury management expert. Respond ONLY with valid JSON, no markdown.' },
      {
        role: 'user',
        content: `Given treasury forecast data: ${JSON.stringify(forecastData)}. Write a 4-sentence executive summary of cash health and 3 specific actions. Respond in JSON: { "summary": "string", "actions": ["string", "string", "string"] }`,
      },
    ],
    { temperature: 0.5, maxTokens: 512 }
  );

  if (parsed?.summary && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
    return parsed;
  }
  return getDefaultNarrative(forecastData);
}

function getDefaultNarrative(data: Partial<TreasuryForecast> | undefined): TreasuryNarrative {
  const currentCash = data?.currentCash || 8500000;
  const avgInflow = data?.monthlyAvgInflow || 5200000;
  const avgOutflow = data?.monthlyAvgOutflow || 4400000;
  const idleCash = data?.idleCashAmount || 2000000;
  const shortfalls = data?.shortfallDates?.length || 0;

  return {
    summary: `The treasury position remains stable with a current cash balance of ₹${(currentCash / 100000).toFixed(1)} lakhs. Over the next 90 days, cash flow projections indicate a gradual build-up driven by consistent monthly inflows averaging ₹${(avgInflow / 100000).toFixed(0)}L against outflows of ₹${(avgOutflow / 100000).toFixed(0)}L. ${
      shortfalls > 0
        ? `There are ${shortfalls} potential shortfall dates that require attention around end-of-quarter payment cycles.`
        : 'No shortfall periods are anticipated in the projection window.'
    } The idle cash of ₹${(idleCash / 100000).toFixed(1)}L presents an opportunity to earn additional returns through a structured FD ladder.`,
    actions: [
      `Deploy ₹${(idleCash / 100000).toFixed(0)}L idle cash into a 30-60-90 day FD ladder to earn an estimated ₹${Math.round((idleCash * 0.07 * 60) / 36500).toLocaleString('en-IN')} additional returns`,
      `Set up automated alerts for cash balance dropping below ₹${Math.round((avgOutflow * 0.3) / 100000)}L to trigger contingency protocols`,
      'Negotiate 15-day payment term extensions with top 3 vendors to improve working capital cycle by an estimated 8-10 days',
    ],
  };
}
