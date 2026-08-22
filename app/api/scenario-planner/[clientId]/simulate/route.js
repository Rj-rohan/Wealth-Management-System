import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function POST(request, { params }) {
  const { clientId } = await params;
  const client = await db.findOne("clients", { id: clientId });
  if (!client) return fail("Client not found", 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const {
    monthlySavings = 5000,
    monthlyIncome = 10000,
    monthlyExpenses = 6000,
    investmentReturn = 8,
    inflation = 3,
    retirementAge = 60,
  } = body;

  const currentAge = client.age || 30;
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  const realReturn = (investmentReturn - inflation) / 100;
  const monthlyReturn = realReturn / 12;

  let balance = Number(client.net_worth || client.netWorth || 0);
  const projections = [];
  const currentYear = new Date().getFullYear();

  for (let y = 0; y <= yearsToRetirement; y++) {
    projections.push({
      age: currentAge + y,
      year: currentYear + y,
      netWorth: Math.round(balance),
    });
    for (let m = 0; m < 12 && y < yearsToRetirement; m++) {
      balance = balance * (1 + monthlyReturn) + monthlySavings;
    }
  }

  const retirementCorpus = Math.round(balance);
  const monthlyRetirementIncome = Math.round((retirementCorpus * 0.04) / 12);

  const goals = await db.findMany("client_goals", { client_id: clientId });
  const goalImpact = goals.map((g) => {
    const targetDate = g.target_date || g.targetDate || new Date();
    const monthsToGoal = Math.max(1, Math.round((new Date(targetDate) - new Date()) / (30 * 24 * 60 * 60 * 1000)));
    const projectedSavings = Number(g.current_savings || g.currentSavings || 0) + monthlySavings * 0.3 * monthsToGoal;
    const canMeet = projectedSavings >= Number(g.target_amount || g.targetAmount || 0);
    return {
      id: g.id,
      label: g.label,
      targetAmount: Number(g.target_amount || g.targetAmount || 0),
      projectedAmount: Math.round(projectedSavings),
      canMeet,
    };
  });

  return ok({
    projections,
    retirementCorpus,
    monthlyRetirementIncome,
    goalImpact,
    futureNetWorth: retirementCorpus,
    yearsToRetirement,
  });
}
