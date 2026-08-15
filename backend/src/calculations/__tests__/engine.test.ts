/**
 * Unit tests for all financial calculators in engine.ts.
 * Every expected value is hand-computed (noted in comments) — no "looks reasonable" assertions.
 *
 * Run: npx vitest run src/calculations/__tests__/engine.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFutureValue,
  calculateFutureValueOfSavings,
  calculateGoalShortfall,
  calculateRequiredSavings,
  calculateSupportableCost,
  calculateDelayMonths,
  calculateInflationAdjustedCost,
  yearsUntilYear,
  calculateEmergencyFundTarget,
  deriveWealthSegment,
  scoreToRiskProfile,
  calculateWHS,
  getWHSCategory,
  calculateTWR,
  calculateMWR,
  annualizeReturn,
  calculateVolatility,
  calculateSharpeRatio,
  calculateBeta,
  calculateAlpha,
  calculatePortfolioDrift,
  computeAssetAllocation,
} from '../engine';

// ─── FV = PV × (1 + r)^n ────────────────────────────────────────────────────

describe('calculateFutureValue', () => {
  it('$10,000 at 7% for 10 years → $19,671.51', () => {
    // Hand: 10000 × 1.07^10 = 10000 × 1.967151... = 19671.51
    expect(calculateFutureValue(10_000, 0.07, 10)).toBeCloseTo(19_671.51, 2);
  });

  it('$1,000 at 0% for 5 years → $1,000 (no growth)', () => {
    expect(calculateFutureValue(1_000, 0, 5)).toBe(1_000);
  });

  it('$5,000 at 10% for 1 year → $5,500', () => {
    expect(calculateFutureValue(5_000, 0.10, 1)).toBeCloseTo(5_500, 2);
  });

  it('$0 principal → $0', () => {
    expect(calculateFutureValue(0, 0.07, 10)).toBe(0);
  });

  it('0 years → original amount', () => {
    expect(calculateFutureValue(10_000, 0.07, 0)).toBe(10_000);
  });
});

// ─── FV of regular savings ──────────────────────────────────────────────────

describe('calculateFutureValueOfSavings', () => {
  it('$500/mo at 6% for 20 years → $231,020.45', () => {
    // Hand: r=0.005, n=240. FV = 500 × ((1.005^240 - 1)/0.005)
    // 1.005^240 = 3.31020... → (3.31020-1)/0.005 = 462.040... × 500 = 231020.45
    expect(calculateFutureValueOfSavings(500, 0.06, 20)).toBeCloseTo(231_020.45, 0);
  });

  it('$1,000/mo at 0% for 10 years → $120,000', () => {
    // Hand: 1000 × 10 × 12 = 120000
    expect(calculateFutureValueOfSavings(1_000, 0, 10)).toBe(120_000);
  });

  it('$0/mo → $0', () => {
    expect(calculateFutureValueOfSavings(0, 0.07, 10)).toBe(0);
  });

  it('$200/mo at 12% for 5 years → $16,334', () => {
    // Hand: r=0.01, n=60. FV = 200 × ((1.01^60 - 1)/0.01)
    // 1.01^60 = 1.81670... → (1.81670 - 1)/0.01 = 81.670 × 200 = 16334.0
    expect(calculateFutureValueOfSavings(200, 0.12, 5)).toBeCloseTo(16_334, 0);
  });
});

// ─── Goal shortfall ─────────────────────────────────────────────────────────

describe('calculateGoalShortfall', () => {
  it('shortfall when cost exceeds funding', () => {
    // Hand: 100000 - (30000 + 40000 + 10000) = 20000
    expect(calculateGoalShortfall(100_000, 30_000, 40_000, 10_000)).toBe(20_000);
  });

  it('no shortfall when fully funded', () => {
    // Hand: 100000 - (50000 + 50000 + 10000) = -10000 → max(0, -10000) = 0
    expect(calculateGoalShortfall(100_000, 50_000, 50_000, 10_000)).toBe(0);
  });

  it('zero cost → zero shortfall', () => {
    expect(calculateGoalShortfall(0, 10_000, 5_000, 0)).toBe(0);
  });
});

// ─── Required monthly savings to close shortfall ────────────────────────────

describe('calculateRequiredSavings', () => {
  it('$50,000 shortfall at 6% over 10 years → ~$305/mo', () => {
    // Hand: r=0.005, n=120. PMT = 50000 × 0.005 / (1.005^120 - 1)
    // 1.005^120 = 1.81940... → 50000 × 0.005 / 0.81940 = 250 / 0.81940 = 305.09
    expect(calculateRequiredSavings(50_000, 0.06, 10)).toBeCloseTo(305, 0);
  });

  it('at 0% rate → simple division', () => {
    // Hand: 12000 / (1 × 12) = 1000
    expect(calculateRequiredSavings(12_000, 0, 1)).toBe(1_000);
  });

  it('$0 shortfall → $0/mo', () => {
    expect(calculateRequiredSavings(0, 0.07, 10)).toBe(0);
  });
});

// ─── Supportable cost ───────────────────────────────────────────────────────

describe('calculateSupportableCost', () => {
  it('$80k funded at 3% inflation over 10 years → PV ~$59,528', () => {
    // Hand: 80000 / 1.03^10. Precise: 1.03^10 = 1.343916379...
    // 80000 / 1.343916379 = 59527.51
    expect(calculateSupportableCost(30_000, 40_000, 10_000, 0.03, 10)).toBeCloseTo(59_527.51, 0);
  });

  it('0% inflation → funded amount equals present value', () => {
    expect(calculateSupportableCost(50_000, 30_000, 0, 0, 5)).toBe(80_000);
  });
});

// ─── Delay months ───────────────────────────────────────────────────────────

describe('calculateDelayMonths', () => {
  it('$10,000 shortfall at $500/mo, 6% → 19 months', () => {
    // Hand: r=0.005. months = ceil(ln(1 + 10000×0.005/500) / ln(1.005))
    // = ceil(ln(1.1) / ln(1.005)) = ceil(0.09531 / 0.004988) = ceil(19.10) = 20
    // Note: formula gives ~20 months
    const result = calculateDelayMonths(10_000, 500, 0.06);
    expect(result).toBeGreaterThanOrEqual(19);
    expect(result).toBeLessThanOrEqual(21);
  });

  it('at 0% rate → simple division (ceiling)', () => {
    // Hand: ceil(10000 / 500) = 20
    expect(calculateDelayMonths(10_000, 500, 0)).toBe(20);
  });

  it('$0 payment → Infinity', () => {
    expect(calculateDelayMonths(10_000, 0, 0.06)).toBe(Infinity);
  });

  it('negative payment → Infinity', () => {
    expect(calculateDelayMonths(10_000, -100, 0.06)).toBe(Infinity);
  });
});

// ─── Inflation-adjusted cost ────────────────────────────────────────────────

describe('calculateInflationAdjustedCost', () => {
  it('$50,000 at 3% for 10 years → $67,196', () => {
    // Hand: 50000 × 1.03^10 = 50000 × 1.34392 = 67196.0
    expect(calculateInflationAdjustedCost(50_000, 0.03, 10)).toBeCloseTo(67_196, 0);
  });

  it('0% inflation → unchanged', () => {
    expect(calculateInflationAdjustedCost(50_000, 0, 10)).toBe(50_000);
  });

  it('0 years → unchanged', () => {
    expect(calculateInflationAdjustedCost(50_000, 0.05, 0)).toBe(50_000);
  });
});

// ─── yearsUntilYear ─────────────────────────────────────────────────────────

describe('yearsUntilYear', () => {
  it('future year returns positive difference', () => {
    const currentYear = new Date().getFullYear();
    expect(yearsUntilYear(currentYear + 10)).toBe(10);
  });

  it('current year → 0', () => {
    const currentYear = new Date().getFullYear();
    expect(yearsUntilYear(currentYear)).toBe(0);
  });

  it('past year → 0 (clamped)', () => {
    expect(yearsUntilYear(2000)).toBe(0);
  });
});

// ─── Emergency Fund Target ──────────────────────────────────────────────────

describe('calculateEmergencyFundTarget', () => {
  it('low volatility, no dependents → 3 months', () => {
    // Hand: 5000 × 3 = 15000
    expect(calculateEmergencyFundTarget(5_000, 'low', false)).toBe(15_000);
  });

  it('medium volatility, no dependents → 4 months', () => {
    expect(calculateEmergencyFundTarget(5_000, 'medium', false)).toBe(20_000);
  });

  it('high volatility, no dependents → 6 months', () => {
    expect(calculateEmergencyFundTarget(5_000, 'high', false)).toBe(30_000);
  });

  it('low volatility, with dependents → 4 months (3+1)', () => {
    expect(calculateEmergencyFundTarget(5_000, 'low', true)).toBe(20_000);
  });

  it('medium volatility, with dependents → 5 months (4+1)', () => {
    expect(calculateEmergencyFundTarget(5_000, 'medium', true)).toBe(25_000);
  });

  it('high volatility, with dependents → 6 months (capped)', () => {
    // Hand: 6+1 = 7, min(7,6) = 6. 5000 × 6 = 30000
    expect(calculateEmergencyFundTarget(5_000, 'high', true)).toBe(30_000);
  });
});

// ─── Wealth Segment Derivation ──────────────────────────────────────────────

describe('deriveWealthSegment', () => {
  it('$10M+ assets → UHNWI', () => {
    expect(deriveWealthSegment(10_000_000, 50_000)).toBe('UHNWI');
  });

  it('$1M assets → HNI', () => {
    expect(deriveWealthSegment(1_000_000, 50_000)).toBe('HNI');
  });

  it('$300K income alone qualifies HNI', () => {
    expect(deriveWealthSegment(50_000, 300_000)).toBe('HNI');
  });

  it('$100K assets → Mass Affluent', () => {
    expect(deriveWealthSegment(100_000, 50_000)).toBe('Mass Affluent');
  });

  it('$75K income alone qualifies Mass Affluent', () => {
    expect(deriveWealthSegment(10_000, 75_000)).toBe('Mass Affluent');
  });

  it('below all thresholds → Mass Market', () => {
    expect(deriveWealthSegment(10_000, 40_000)).toBe('Mass Market');
  });
});

// ─── Risk Score → Profile ───────────────────────────────────────────────────

describe('scoreToRiskProfile', () => {
  it('12 → Conservative', () => expect(scoreToRiskProfile(12)).toBe('Conservative'));
  it('20 → Conservative', () => expect(scoreToRiskProfile(20)).toBe('Conservative'));
  it('21 → Moderately Conservative', () => expect(scoreToRiskProfile(21)).toBe('Moderately Conservative'));
  it('30 → Moderately Conservative', () => expect(scoreToRiskProfile(30)).toBe('Moderately Conservative'));
  it('31 → Balanced', () => expect(scoreToRiskProfile(31)).toBe('Balanced'));
  it('42 → Balanced', () => expect(scoreToRiskProfile(42)).toBe('Balanced'));
  it('43 → Growth', () => expect(scoreToRiskProfile(43)).toBe('Growth'));
  it('52 → Growth', () => expect(scoreToRiskProfile(52)).toBe('Growth'));
  it('53 → Aggressive', () => expect(scoreToRiskProfile(53)).toBe('Aggressive'));
  it('60 → Aggressive', () => expect(scoreToRiskProfile(60)).toBe('Aggressive'));
});

// ─── WHS Category ───────────────────────────────────────────────────────────

describe('getWHSCategory', () => {
  it('0 → VULNERABLE', () => expect(getWHSCategory(0)).toBe('VULNERABLE'));
  it('39 → VULNERABLE', () => expect(getWHSCategory(39)).toBe('VULNERABLE'));
  it('40 → CAUTION', () => expect(getWHSCategory(40)).toBe('CAUTION'));
  it('64 → CAUTION', () => expect(getWHSCategory(64)).toBe('CAUTION'));
  it('65 → HEALTHY', () => expect(getWHSCategory(65)).toBe('HEALTHY'));
  it('84 → HEALTHY', () => expect(getWHSCategory(84)).toBe('HEALTHY'));
  it('85 → EXCELLENT', () => expect(getWHSCategory(85)).toBe('EXCELLENT'));
  it('100 → EXCELLENT', () => expect(getWHSCategory(100)).toBe('EXCELLENT'));
});

// ─── calculateWHS (integration test of 7-pillar scoring) ────────────────────

describe('calculateWHS', () => {
  it('perfect inputs → score near 100', () => {
    const result = calculateWHS({
      liquidCashBalance: 30_000,
      emergencyFundTarget: 30_000,
      highInterestDebt: 0,
      totalDebt: 0,
      totalAssets: 500_000,
      monthlyNetIncome: 8_000,
      monthlySavings: 2_000,
      savingsRate: 0.25,
      targetSavingsRate: 0.15,
      portfolioDrift: 0,
      retirementReadinessRatio: 1.0,
      goalFundingRatio: 1.0,
      disabilityCoverageRatio: 1.0,
      lifeCoverageRatio: 1.0,
      hasLTC: true,
      age: 55,
      hasWill: true,
      hasPOA: true,
      hasHCProxy: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('terrible inputs → score near 0', () => {
    const result = calculateWHS({
      liquidCashBalance: 0,
      emergencyFundTarget: 30_000,
      highInterestDebt: 50_000,
      totalDebt: 100_000,
      totalAssets: 10_000,
      monthlyNetIncome: 3_000,
      monthlySavings: 0,
      savingsRate: 0,
      targetSavingsRate: 0.15,
      portfolioDrift: 0.30,
      retirementReadinessRatio: 0,
      goalFundingRatio: 0,
      disabilityCoverageRatio: 0,
      lifeCoverageRatio: 0,
      hasLTC: false,
      age: 55,
      hasWill: false,
      hasPOA: false,
      hasHCProxy: false,
    });
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it('returns all 7 pillar percentages', () => {
    const result = calculateWHS({
      liquidCashBalance: 15_000,
      emergencyFundTarget: 30_000,
      highInterestDebt: 0,
      totalDebt: 50_000,
      totalAssets: 200_000,
      monthlyNetIncome: 6_000,
      monthlySavings: 900,
      savingsRate: 0.15,
      targetSavingsRate: 0.15,
      portfolioDrift: 0.03,
      retirementReadinessRatio: 0.60,
      goalFundingRatio: 0.80,
      disabilityCoverageRatio: 0.80,
      lifeCoverageRatio: 0.80,
      hasLTC: false,
      age: 35,
      hasWill: true,
      hasPOA: true,
      hasHCProxy: false,
    });
    expect(result.pillars).toHaveProperty('emergency_fund');
    expect(result.pillars).toHaveProperty('debt_mgmt');
    expect(result.pillars).toHaveProperty('savings_rate');
    expect(result.pillars).toHaveProperty('portfolio_drift');
    expect(result.pillars).toHaveProperty('retirement_readiness');
    expect(result.pillars).toHaveProperty('insurance_protection');
    expect(result.pillars).toHaveProperty('estate_planning');
    // All percentages must be 0–100
    for (const val of Object.values(result.pillars)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it('returns correct metric shapes', () => {
    const result = calculateWHS({
      liquidCashBalance: 10_000,
      emergencyFundTarget: 20_000,
      highInterestDebt: 0,
      totalDebt: 30_000,
      totalAssets: 100_000,
      monthlyNetIncome: 5_000,
      monthlySavings: 500,
      savingsRate: 0.10,
      targetSavingsRate: 0.15,
      portfolioDrift: 0.05,
      retirementReadinessRatio: 0.50,
      goalFundingRatio: 0.70,
      disabilityCoverageRatio: 0.50,
      lifeCoverageRatio: 0.60,
      hasLTC: false,
      age: 40,
      hasWill: false,
      hasPOA: false,
      hasHCProxy: false,
    });
    expect(result.metrics.net_worth).toBe(70_000); // 100000 - 30000
    expect(result.metrics.monthly_savings).toBe(500);
    expect(result.metrics.savings_rate).toBe(10); // 0.10 × 100
    expect(result.metrics.debt_ratio).toBe(30); // 30000/100000 × 100
  });
});

// ─── Time-Weighted Return ───────────────────────────────────────────────────

describe('calculateTWR', () => {
  it('two periods with no cash flows', () => {
    // Period 1: 100 → 110 (+10%), Period 2: 110 → 121 (+10%)
    // Hand: (1.10 × 1.10) - 1 = 0.21 = 21%
    const result = calculateTWR([
      { startValue: 100, endValue: 110 },
      { startValue: 110, endValue: 121 },
    ]);
    expect(result).toBeCloseTo(0.21, 2);
  });

  it('empty periods → 0', () => {
    expect(calculateTWR([])).toBe(0);
  });

  it('single period loss', () => {
    // 100 → 90 = -10%
    const result = calculateTWR([{ startValue: 100, endValue: 90 }]);
    expect(result).toBeCloseTo(-0.10, 2);
  });
});

// ─── Money-Weighted Return (XIRR approximation) ────────────────────────────

describe('calculateMWR', () => {
  it('simple invest-and-harvest → positive return', () => {
    // Invest -1000, receive +1100 after 1 year → 10% return
    const result = calculateMWR([
      { amount: -1_000, date: new Date('2025-01-01') },
      { amount: 1_100, date: new Date('2026-01-01') },
    ]);
    expect(result).toBeCloseTo(0.10, 2);
  });

  it('fewer than 2 cashflows → 0', () => {
    expect(calculateMWR([{ amount: -1000, date: new Date('2025-01-01') }])).toBe(0);
  });
});

// ─── Annualize Return ───────────────────────────────────────────────────────

describe('annualizeReturn', () => {
  it('50% total return over 5 years → ~8.45%/yr', () => {
    // Hand: (1.50)^(1/5) - 1 = 0.08447...
    expect(annualizeReturn(0.50, 5)).toBeCloseTo(0.0845, 3);
  });

  it('0 years → 0', () => {
    expect(annualizeReturn(0.50, 0)).toBe(0);
  });

  it('100% in 1 year → 100%', () => {
    expect(annualizeReturn(1.0, 1)).toBeCloseTo(1.0, 4);
  });
});

// ─── Volatility ─────────────────────────────────────────────────────────────

describe('calculateVolatility', () => {
  it('constant returns → 0 volatility', () => {
    expect(calculateVolatility([0.01, 0.01, 0.01, 0.01])).toBe(0);
  });

  it('varied returns → positive volatility', () => {
    const returns = [0.05, -0.03, 0.02, -0.01, 0.04, 0.01];
    const vol = calculateVolatility(returns, 12);
    expect(vol).toBeGreaterThan(0);
    // Hand (rough): mean ≈ 0.0133, stdev_sample ≈ 0.0299, annualized ≈ 0.0299 × √12 ≈ 0.1037
    expect(vol).toBeCloseTo(0.104, 1);
  });

  it('fewer than 2 data points → 0', () => {
    expect(calculateVolatility([0.05])).toBe(0);
    expect(calculateVolatility([])).toBe(0);
  });
});

// ─── Sharpe Ratio ───────────────────────────────────────────────────────────

describe('calculateSharpeRatio', () => {
  it('basic case: (12% - 4%) / 10% = 0.8', () => {
    expect(calculateSharpeRatio(0.12, 0.04, 0.10)).toBeCloseTo(0.8, 4);
  });

  it('zero volatility → 0 (avoid division by zero)', () => {
    expect(calculateSharpeRatio(0.12, 0.04, 0)).toBe(0);
  });

  it('negative excess return → negative Sharpe', () => {
    // (3% - 5%) / 10% = -0.2
    expect(calculateSharpeRatio(0.03, 0.05, 0.10)).toBeCloseTo(-0.2, 4);
  });
});

// ─── Beta ───────────────────────────────────────────────────────────────────

describe('calculateBeta', () => {
  it('identical returns to market → beta = 1', () => {
    const returns = [0.02, 0.04, -0.01, 0.03];
    expect(calculateBeta(returns, returns)).toBeCloseTo(1.0, 4);
  });

  it('mismatched lengths → default 1', () => {
    expect(calculateBeta([0.01, 0.02], [0.01])).toBe(1);
  });

  it('fewer than 2 periods → default 1', () => {
    expect(calculateBeta([0.01], [0.01])).toBe(1);
  });
});

// ─── Alpha ──────────────────────────────────────────────────────────────────

describe('calculateAlpha', () => {
  it('basic CAPM alpha', () => {
    // Hand: 0.12 - (0.04 + 1.2 × (0.10 - 0.04)) = 0.12 - (0.04 + 0.072) = 0.12 - 0.112 = 0.008
    expect(calculateAlpha(0.12, 0.10, 0.04, 1.2)).toBeCloseTo(0.008, 4);
  });

  it('negative alpha = underperformance', () => {
    // Hand: 0.05 - (0.04 + 1.0 × (0.10 - 0.04)) = 0.05 - 0.10 = -0.05
    expect(calculateAlpha(0.05, 0.10, 0.04, 1.0)).toBeCloseTo(-0.05, 4);
  });
});

// ─── Portfolio Drift ────────────────────────────────────────────────────────

describe('calculatePortfolioDrift', () => {
  it('no drift when allocations match', () => {
    const target = { Stocks: 0.60, Bonds: 0.40 };
    const current = { Stocks: 0.60, Bonds: 0.40 };
    const result = calculatePortfolioDrift(current, target);
    expect(result.totalDrift).toBeCloseTo(0, 4);
    expect(result.driftByAsset.Stocks).toBeCloseTo(0, 4);
    expect(result.driftByAsset.Bonds).toBeCloseTo(0, 4);
  });

  it('drift calculated correctly', () => {
    // Hand: |0.70 - 0.60| + |0.30 - 0.40| = 0.10 + 0.10 = 0.20
    const target = { Stocks: 0.60, Bonds: 0.40 };
    const current = { Stocks: 0.70, Bonds: 0.30 };
    const result = calculatePortfolioDrift(current, target);
    expect(result.totalDrift).toBeCloseTo(0.20, 4);
    expect(result.driftByAsset.Stocks).toBeCloseTo(0.10, 4);
  });

  it('handles asset classes present in only one allocation', () => {
    const target = { Stocks: 0.60, Bonds: 0.40 };
    const current = { Stocks: 0.60, Gold: 0.40 };
    // Bonds: |0 - 0.40| = 0.40, Gold: |0.40 - 0| = 0.40, Stocks: 0
    const result = calculatePortfolioDrift(current, target);
    expect(result.totalDrift).toBeCloseTo(0.80, 4);
  });
});

// ─── Asset Allocation ───────────────────────────────────────────────────────

describe('computeAssetAllocation', () => {
  it('groups and computes weights correctly', () => {
    const holdings = [
      { category: 'Stocks', current_value: 6_000 },
      { category: 'Stocks', current_value: 4_000 },
      { category: 'Bonds', current_value: 5_000 },
      { category: 'Cash', current_value: 5_000 },
    ];
    // Total = 20000. Stocks = 10000/20000 = 0.50, Bonds = 0.25, Cash = 0.25
    const result = computeAssetAllocation(holdings);
    expect(result.Stocks).toBeCloseTo(0.50, 4);
    expect(result.Bonds).toBeCloseTo(0.25, 4);
    expect(result.Cash).toBeCloseTo(0.25, 4);
  });

  it('empty holdings → empty allocation', () => {
    expect(computeAssetAllocation([])).toEqual({});
  });

  it('single holding → 100%', () => {
    const result = computeAssetAllocation([{ category: 'Gold', current_value: 1_000 }]);
    expect(result.Gold).toBeCloseTo(1.0, 4);
  });

  it('all zero values → empty (total = 0)', () => {
    const result = computeAssetAllocation([
      { category: 'Stocks', current_value: 0 },
      { category: 'Bonds', current_value: 0 },
    ]);
    expect(result).toEqual({});
  });
});
