/**
 * Warren Buffett Secret Sauce Scoring Engine
 *
 * Criteria based on Buffett's published methodology:
 * 1. High ROE (> 15% = strong, > 20% = excellent)
 * 2. Low Debt (D/E < 0.5 preferred, banks excluded)
 * 3. Consistent Earnings Growth (> 10% CAGR)
 * 4. Reasonable P/E (not overvalued relative to growth)
 * 5. Economic Moat (qualitative)
 * 6. High Promoter Holding (skin in the game)
 * 7. Revenue Growth (business expansion)
 *
 * Max score: 100 points
 */

export function calcBuffettScore(stock) {
  let score = 0;
  const breakdown = [];

  // 1. ROE — 25 pts
  const isBankingSector = ["Banking", "Microfinance"].includes(stock.sector);
  const roeThreshold = isBankingSector ? 12 : 15;
  if (stock.roe >= 25) { score += 25; breakdown.push({ label: "ROE", pts: 25, max: 25, note: "Excellent (≥25%)" }); }
  else if (stock.roe >= roeThreshold) { score += 15; breakdown.push({ label: "ROE", pts: 15, max: 25, note: `Good (≥${roeThreshold}%)` }); }
  else { score += 5; breakdown.push({ label: "ROE", pts: 5, max: 25, note: "Below threshold" }); }

  // 2. Debt/Equity — 20 pts (skip strict check for banks/NBFC)
  if (isBankingSector) {
    score += 15;
    breakdown.push({ label: "Debt/Equity", pts: 15, max: 20, note: "Banking sector (normal leverage)" });
  } else if (stock.debtToEquity <= 0.3) { score += 20; breakdown.push({ label: "Debt/Equity", pts: 20, max: 20, note: "Debt-free or minimal" }); }
  else if (stock.debtToEquity <= 0.7) { score += 13; breakdown.push({ label: "Debt/Equity", pts: 13, max: 20, note: "Low debt" }); }
  else if (stock.debtToEquity <= 1.5) { score += 7; breakdown.push({ label: "Debt/Equity", pts: 7, max: 20, note: "Moderate debt" }); }
  else { score += 2; breakdown.push({ label: "Debt/Equity", pts: 2, max: 20, note: "High debt — caution" }); }

  // 3. Earnings Growth (5yr CAGR) — 20 pts
  if (stock.earningsGrowth >= 20) { score += 20; breakdown.push({ label: "Earnings Growth", pts: 20, max: 20, note: "Exceptional (≥20%)" }); }
  else if (stock.earningsGrowth >= 12) { score += 13; breakdown.push({ label: "Earnings Growth", pts: 13, max: 20, note: "Strong (≥12%)" }); }
  else if (stock.earningsGrowth >= 7) { score += 7; breakdown.push({ label: "Earnings Growth", pts: 7, max: 20, note: "Moderate (≥7%)" }); }
  else { score += 2; breakdown.push({ label: "Earnings Growth", pts: 2, max: 20, note: "Weak" }); }

  // 4. PEG-like check (P/E vs growth) — 15 pts
  const peg = stock.earningsGrowth > 0 ? stock.pe / stock.earningsGrowth : 99;
  if (peg <= 1) { score += 15; breakdown.push({ label: "Valuation (PEG)", pts: 15, max: 15, note: "Undervalued (PEG ≤ 1)" }); }
  else if (peg <= 1.5) { score += 10; breakdown.push({ label: "Valuation (PEG)", pts: 10, max: 15, note: "Fair value (PEG ≤ 1.5)" }); }
  else if (peg <= 2.5) { score += 6; breakdown.push({ label: "Valuation (PEG)", pts: 6, max: 15, note: "Slightly expensive" }); }
  else { score += 2; breakdown.push({ label: "Valuation (PEG)", pts: 2, max: 15, note: "Overvalued" }); }

  // 5. Promoter Holding — 10 pts
  if (stock.promoterHolding >= 50) { score += 10; breakdown.push({ label: "Promoter Holding", pts: 10, max: 10, note: `${stock.promoterHolding}% — strong conviction` }); }
  else if (stock.promoterHolding >= 30) { score += 6; breakdown.push({ label: "Promoter Holding", pts: 6, max: 10, note: `${stock.promoterHolding}% — moderate` }); }
  else { score += 3; breakdown.push({ label: "Promoter Holding", pts: 3, max: 10, note: `${stock.promoterHolding}% — low` }); }

  // 6. Revenue Growth — 10 pts
  if (stock.revenueGrowth >= 15) { score += 10; breakdown.push({ label: "Revenue Growth", pts: 10, max: 10, note: "Strong (≥15%)" }); }
  else if (stock.revenueGrowth >= 8) { score += 6; breakdown.push({ label: "Revenue Growth", pts: 6, max: 10, note: "Decent (≥8%)" }); }
  else { score += 3; breakdown.push({ label: "Revenue Growth", pts: 3, max: 10, note: "Slow" }); }

  const rating = score >= 80 ? "Strong Buy" : score >= 65 ? "Buy" : score >= 50 ? "Hold" : "Avoid";
  const ratingColor = score >= 80 ? "text-green-600" : score >= 65 ? "text-blue-600" : score >= 50 ? "text-yellow-600" : "text-red-500";

  return { score, breakdown, rating, ratingColor };
}
