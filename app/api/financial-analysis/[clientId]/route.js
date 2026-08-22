import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  let fp = await db.findOne("financial_profiles", { client_id: clientId });
  if (!fp) {
    const monthlyIncome = Number(client.income || 10000);
    const monthlyExpenses = Number(client.expenses || 6000);
    const assets = Number(client.assets || 0);
    const liabilities = Number(client.liabilities || 0);

    const salary = Math.round(monthlyIncome * 0.7);
    const businessIncome = Math.round(monthlyIncome * 0.2);
    const investmentIncome = Math.round(monthlyIncome * 0.1);

    const housing = Math.round(monthlyExpenses * 0.35);
    const food = Math.round(monthlyExpenses * 0.15);
    const transportation = Math.round(monthlyExpenses * 0.1);
    const insurance = Math.round(monthlyExpenses * 0.08);
    const entertainment = Math.round(monthlyExpenses * 0.07);
    const education = Math.round(monthlyExpenses * 0.05);
    const healthcare = Math.round(monthlyExpenses * 0.05);
    const miscellaneous = monthlyExpenses - (housing + food + transportation + insurance + entertainment + education + healthcare);

    const homeLoan = liabilities > 50000 ? Math.round(liabilities * 0.7) : 0;
    const personalLoan = liabilities - homeLoan;
    const debtRatio = assets > 0 ? Number((liabilities / assets).toFixed(2)) : 0;
    const totalEmi = Math.round(liabilities * 0.01);
    const emiBurden = monthlyIncome > 0 ? Number((totalEmi / monthlyIncome).toFixed(2)) : 0;

    const recommendedFund = monthlyExpenses * 6;
    const currentFund = Math.round(recommendedFund * 0.8);
    const coverageMonths = monthlyExpenses > 0 ? Number((currentFund / monthlyExpenses).toFixed(1)) : 0;

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const netWorthTimeline = [];
    let runningNw = Number(client.net_worth || 0) * 0.8;
    for (let m = 23; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      runningNw = Math.round(runningNw * 1.01);
      netWorthTimeline.push({
        month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        netWorth: runningNw,
        assets: Math.round(runningNw * 1.2),
        liabilities: Math.round(runningNw * 0.2),
      });
    }

    const cashFlowHistory = [];
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      cashFlowHistory.push({
        month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        savings: monthlyIncome - monthlyExpenses,
      });
    }

    fp = await db.insert("financial_profiles", {
      client_id: clientId,
      income: {
        total: monthlyIncome,
        salary,
        businessIncome,
        rentalIncome: 0,
        investmentIncome,
        otherIncome: 0,
      },
      expenses: {
        total: monthlyExpenses,
        housing,
        transportation,
        food,
        insurance,
        entertainment,
        education,
        healthcare,
        miscellaneous: Math.max(0, miscellaneous),
      },
      debts: {
        homeLoan,
        personalLoan,
        vehicleLoan: 0,
        creditCard: 0,
        educationLoan: 0,
        total: liabilities,
        debtRatio,
        totalEmi,
        emiBurden,
        debtReductionProgress: 45,
      },
      emergency_fund: {
        current: currentFund,
        recommended: recommendedFund,
        coverageMonths,
      },
      net_worth_timeline: netWorthTimeline,
      cash_flow_history: cashFlowHistory,
      healthScore: 72,
      savings_rate: Number(((monthlyIncome - monthlyExpenses) / monthlyIncome).toFixed(2)),
      monthly_surplus: monthlyIncome - monthlyExpenses,
    });
  }

  const income = typeof fp.income === "string" ? JSON.parse(fp.income) : fp.income || {};
  const expenses = typeof fp.expenses === "string" ? JSON.parse(fp.expenses) : fp.expenses || {};
  const debts = typeof fp.debts === "string" ? JSON.parse(fp.debts) : fp.debts || {};
  const emergencyFund = typeof fp.emergency_fund === "string" ? JSON.parse(fp.emergency_fund) : fp.emergency_fund || {};
  const netWorthTimeline = typeof fp.net_worth_timeline === "string" ? JSON.parse(fp.net_worth_timeline) : fp.net_worth_timeline || [];
  const cashFlowHistory = typeof fp.cash_flow_history === "string" ? JSON.parse(fp.cash_flow_history) : fp.cash_flow_history || [];

  return ok({
    clientId: client.id,
    totalAssets: Number(client.assets || 0),
    totalLiabilities: Number(client.liabilities || 0),
    netWorth: Number(client.net_worth || client.netWorth || 0),
    income,
    expenses,
    debts,
    emergencyFund,
    netWorthTimeline,
    cashFlowHistory,
    timeline: netWorthTimeline,
    history: cashFlowHistory,
    healthScore: fp.health_score || fp.healthScore || 70,
    savingsRate: Number(fp.savings_rate || fp.savingsRate || 0.3),
    monthlySurplus: Number(fp.monthly_surplus || fp.monthlySurplus || 4000),
    monthlyIncome: income.total || Number(client.income || 0),
    monthlyExpenses: expenses.total || Number(client.expenses || 0),
    debtRatio: debts.debtRatio || 0,
    emiBurden: debts.emiBurden || 0,
    emergencyCoverage: emergencyFund.coverageMonths || 6,
  });
}
