import { dataset } from "@/lib/mock/dataset";
import { clone, delay } from "./mockUtil";

const REPORT_TYPES = [
  { type: "financial_health", title: "Financial Health Report", description: "Comprehensive overview of client's financial wellbeing", icon: "Activity" },
  { type: "net_worth", title: "Net Worth Report", description: "Detailed assets, liabilities, and net worth analysis", icon: "TrendingUp" },
  { type: "cash_flow", title: "Cash Flow Report", description: "Income, expenses, and savings analysis", icon: "ArrowLeftRight" },
  { type: "goal_progress", title: "Goal Progress Report", description: "Status and progress of all financial goals", icon: "Target" },
  { type: "investment_summary", title: "Investment Summary", description: "Overview of investment holdings and performance", icon: "LineChart" },
  { type: "portfolio_review", title: "Portfolio Review", description: "Detailed portfolio analysis with recommendations", icon: "PieChart" },
  { type: "risk_assessment", title: "Risk Assessment Report", description: "Client risk profile and suitability analysis", icon: "Shield" },
  { type: "retirement_planning", title: "Retirement Planning Report", description: "Retirement readiness and projection analysis", icon: "Sunset" },
];

export const reportsService = {
  async getAvailableReports() {
    await delay(200);
    return clone(REPORT_TYPES);
  },

  async getReportData(clientId, reportType) {
    await delay(350);
    const client = dataset.clients.find((c) => c.id === clientId);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    const portfolio = dataset.portfolios.find((p) => p.clientId === clientId);
    const riskProfile = dataset.riskProfiles.find((r) => r.clientId === clientId);
    const goals = dataset.goals.filter((g) => g.clientId === clientId);
    const recs = dataset.recommendations.filter((r) => r.clientId === clientId);

    if (!client || !fp) return null;

    const meta = REPORT_TYPES.find((r) => r.type === reportType);

    return clone({
      reportType,
      title: meta?.title || "Financial Report",
      generatedAt: new Date().toISOString(),
      client: { name: client.name, email: client.email, phone: client.phone, location: client.location, occupation: client.occupation },
      advisor: { name: "James Mitchell, CFP®", firm: "Meridian Wealth Advisory", email: "james.mitchell@meridian.com" },
      financial: fp,
      portfolio,
      riskProfile,
      goals,
      recommendations: recs,
      netWorth: client.netWorth,
      assets: client.assets,
      liabilities: client.liabilities,
    });
  },
};
