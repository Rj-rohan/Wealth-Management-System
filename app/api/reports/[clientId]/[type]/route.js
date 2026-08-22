import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

const REPORT_TYPES = [
  { type: "financial_health", title: "Financial Health Report" },
  { type: "net_worth", title: "Net Worth Report" },
  { type: "cash_flow", title: "Cash Flow Report" },
  { type: "goal_progress", title: "Goal Progress Report" },
  { type: "investment_summary", title: "Investment Summary" },
  { type: "portfolio_review", title: "Portfolio Review" },
  { type: "risk_assessment", title: "Risk Assessment Report" },
  { type: "retirement_planning", title: "Retirement Planning Report" },
];

export async function GET(request, { params }) {
  const { clientId, type } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  const fp = await db.findOne("financial_profiles", { client_id: clientId });
  const portfolio = await db.findOne("portfolio_data", { client_id: clientId });
  const riskProfile = await db.findOne("risk_profiles", { client_id: clientId });
  const goals = await db.findMany("client_goals", { client_id: clientId });
  const recommendations = await db.findMany("recommendations", { client_id: clientId });

  const meta = REPORT_TYPES.find((r) => r.type === type);

  return ok({
    reportType: type,
    title: meta?.title || "Financial Report",
    generatedAt: new Date().toISOString(),
    client: {
      name: client.name || `${client.first_name || ""} ${client.last_name || ""}`.trim(),
      email: client.email,
      phone: client.phone,
      location: client.location,
      occupation: client.occupation,
    },
    advisor: {
      name: "Meridian Wealth Advisor",
      firm: "Meridian Wealth Management",
      email: "advisor@meridian.com",
    },
    financial: fp ? {
      ...fp,
      income: typeof fp.income === "string" ? JSON.parse(fp.income) : fp.income,
      expenses: typeof fp.expenses === "string" ? JSON.parse(fp.expenses) : fp.expenses,
      debts: typeof fp.debts === "string" ? JSON.parse(fp.debts) : fp.debts,
      emergencyFund: typeof fp.emergency_fund === "string" ? JSON.parse(fp.emergency_fund) : fp.emergency_fund,
    } : null,
    portfolio: portfolio ? {
      ...portfolio,
      holdings: typeof portfolio.holdings === "string" ? JSON.parse(portfolio.holdings) : portfolio.holdings,
      performanceHistory: typeof portfolio.performance_history === "string" ? JSON.parse(portfolio.performance_history) : portfolio.performance_history,
      analysis: typeof portfolio.analysis === "string" ? JSON.parse(portfolio.analysis) : portfolio.analysis,
    } : null,
    riskProfile: riskProfile ? {
      ...riskProfile,
      recommendedAllocation: typeof riskProfile.recommended_allocation === "string" ? JSON.parse(riskProfile.recommended_allocation) : riskProfile.recommended_allocation,
      suitableCategories: typeof riskProfile.suitable_categories === "string" ? JSON.parse(riskProfile.suitable_categories) : riskProfile.suitable_categories,
    } : null,
    goals,
    recommendations,
    netWorth: Number(client.net_worth || client.netWorth || 0),
    assets: Number(client.assets || 0),
    liabilities: Number(client.liabilities || 0),
  });
}
