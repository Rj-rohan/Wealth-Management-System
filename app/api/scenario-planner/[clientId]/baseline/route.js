import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  const fp = await db.findOne("financial_profiles", { client_id: clientId });
  const income = fp ? (typeof fp.income === "string" ? JSON.parse(fp.income) : fp.income) : { total: Number(client.income || 10000) };
  const expenses = fp ? (typeof fp.expenses === "string" ? JSON.parse(fp.expenses) : fp.expenses) : { total: Number(client.expenses || 6000) };
  const monthlySurplus = Number(income.total || client.income || 10000) - Number(expenses.total || client.expenses || 6000);

  return ok({
    monthlySavings: Math.max(1000, monthlySurplus),
    monthlyIncome: Number(income.total || client.income || 10000),
    monthlyExpenses: Number(expenses.total || client.expenses || 6000),
    investmentReturn: 8,
    inflation: 3,
    retirementAge: 60,
    currentAge: client.age || 30,
    currentNetWorth: Number(client.net_worth || client.netWorth || 0),
    currentAssets: Number(client.assets || 0),
  });
}
