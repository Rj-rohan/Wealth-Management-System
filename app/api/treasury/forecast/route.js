export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "90", 10);

    // Mock historical transaction data (last 6 months)
    const monthlyData = [
      { month: "Jan", inflows: 5200000, outflows: 4100000 },
      { month: "Feb", inflows: 4800000, outflows: 4300000 },
      { month: "Mar", inflows: 5500000, outflows: 4600000 },
      { month: "Apr", inflows: 5100000, outflows: 4200000 },
      { month: "May", inflows: 5800000, outflows: 4500000 },
      { month: "Jun", inflows: 5300000, outflows: 4800000 },
    ];

    const avgInflow = monthlyData.reduce((s, m) => s + m.inflows, 0) / monthlyData.length;
    const avgOutflow = monthlyData.reduce((s, m) => s + m.outflows, 0) / monthlyData.length;
    const dailyInflow = avgInflow / 30;
    const dailyOutflow = avgOutflow / 30;

    // Trend slope (slight upward on expenses)
    const inflowTrend = 0.0008;   // 0.08% daily increase
    const outflowTrend = 0.0012;  // 0.12% daily increase

    // Seasonal factors (end of quarter dip, mid-month peaks)
    function getSeasonalFactor(dayOfMonth) {
      if (dayOfMonth <= 5) return 1.15;    // Salary credits
      if (dayOfMonth >= 25) return 0.85;   // End of month payments
      if (dayOfMonth >= 28) return 0.75;   // Rent, EMI
      return 1.0;
    }

    let currentCash = 8500000; // ₹85 lakhs starting cash
    const projections = [];
    const shortfallDates = [];
    const dangerThreshold = (avgOutflow / 30) * 3; // 10% of monthly = ~3 days of expenses

    const startDate = new Date();

    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dayOfMonth = date.getDate();

      const seasonal = getSeasonalFactor(dayOfMonth);
      const trendMultiplierIn = 1 + inflowTrend * d;
      const trendMultiplierOut = 1 + outflowTrend * d;

      // Add some randomness
      const noise = 0.9 + Math.random() * 0.2;
      const dayInflow = dailyInflow * trendMultiplierIn * seasonal * noise;
      const dayOutflow = dailyOutflow * trendMultiplierOut * noise;

      currentCash += dayInflow - dayOutflow;

      // Confidence decreases over time
      const confidence = Math.max(0.5, 1 - d * 0.004);

      const dateStr = date.toISOString().split("T")[0];
      projections.push({
        date: dateStr,
        projectedCash: Math.round(currentCash),
        confidence: parseFloat(confidence.toFixed(2)),
      });

      if (currentCash < dangerThreshold) {
        shortfallDates.push(dateStr);
      }
    }

    // Calculate idle cash (cash above 2x monthly expenses)
    const minCash = Math.min(...projections.map((p) => p.projectedCash));
    const operatingCash = avgOutflow * 2; // Keep 2 months as operating cash
    const idleCashAmount = Math.max(0, Math.round(currentCash - operatingCash));

    // FD ladder suggestion
    const fdLadderSuggestion = [
      {
        tenor: "30d",
        amount: Math.round(idleCashAmount * 0.3),
        rate: 6.5,
        estimatedReturn: Math.round(idleCashAmount * 0.3 * 0.065 * (30 / 365)),
      },
      {
        tenor: "60d",
        amount: Math.round(idleCashAmount * 0.35),
        rate: 7.0,
        estimatedReturn: Math.round(idleCashAmount * 0.35 * 0.07 * (60 / 365)),
      },
      {
        tenor: "90d",
        amount: Math.round(idleCashAmount * 0.35),
        rate: 7.25,
        estimatedReturn: Math.round(idleCashAmount * 0.35 * 0.0725 * (90 / 365)),
      },
    ];

    return Response.json({
      projections,
      shortfallDates,
      idleCashAmount,
      currentCash: 8500000,
      projectedCash90d: projections[projections.length - 1]?.projectedCash || 0,
      fdLadderSuggestion,
      monthlyAvgInflow: Math.round(avgInflow),
      monthlyAvgOutflow: Math.round(avgOutflow),
    });
  } catch (error) {
    console.error("Treasury forecast error:", error);
    return Response.json({ error: "Failed to generate forecast" }, { status: 500 });
  }
}
