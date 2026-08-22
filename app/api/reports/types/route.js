import { ok } from "@/lib/api/response";

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

export async function GET() {
  return ok(REPORT_TYPES);
}
