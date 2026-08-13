import { dataset } from "@/lib/mock/dataset";
import { clone, delay } from "./mockUtil";

export const scenarioPlannerService = {
  async getBaselineScenario(clientId) {
    await delay(250);
    const client = dataset.clients.find((c) => c.id === clientId);
    const fp = dataset.financialProfiles.find((f) => f.clientId === clientId);
    if (!client || !fp) return null;

    return clone({
      monthlySavings: fp.monthlySurplus,
      monthlyIncome: fp.income.total,
      monthlyExpenses: fp.expenses.total,
      investmentReturn: 8,
      inflation: 3,
      retirementAge: 60,
      currentAge: client.age,
      currentNetWorth: client.netWorth,
      currentAssets: client.assets,
    });
  },

  async simulate(clientId, params) {
    await delay(300);
    const client = dataset.clients.find((c) => c.id === clientId);
    if (!client) return null;

    const {
      monthlySavings = 5000,
      monthlyIncome = 10000,
      monthlyExpenses = 6000,
      investmentReturn = 8,
      inflation = 3,
      retirementAge = 60,
    } = params;

    const currentAge = client.age;
    const yearsToRetirement = Math.max(1, retirementAge - currentAge);
    const realReturn = (investmentReturn - inflation) / 100;
    const monthlyReturn = realReturn / 12;
    const months = yearsToRetirement * 12;

    // Future value projection
    let balance = client.netWorth;
    const projections = [];
    for (let y = 0; y <= yearsToRetirement; y++) {
      projections.push({
        age: currentAge + y,
        year: new Date().getFullYear() + y,
        netWorth: Math.round(balance),
      });
      for (let m = 0; m < 12 && y < yearsToRetirement; m++) {
        balance = balance * (1 + monthlyReturn) + monthlySavings;
      }
    }

    const retirementCorpus = Math.round(balance);
    const monthlyRetirementIncome = Math.round(retirementCorpus * 0.04 / 12);

    // Goal impact
    const goals = dataset.goals.filter((g) => g.clientId === clientId);
    const goalImpact = goals.map((g) => {
      const monthsToGoal = Math.max(1, Math.round((new Date(g.targetDate) - new Date()) / (30 * 24 * 60 * 60 * 1000)));
      const projectedSavings = g.currentSavings + monthlySavings * 0.3 * monthsToGoal;
      const canMeet = projectedSavings >= g.targetAmount;
      return { id: g.id, label: g.label, targetAmount: g.targetAmount, projectedAmount: Math.round(projectedSavings), canMeet };
    });

    return clone({
      projections,
      retirementCorpus,
      monthlyRetirementIncome,
      goalImpact,
      futureNetWorth: retirementCorpus,
      yearsToRetirement,
    });
  },
};
