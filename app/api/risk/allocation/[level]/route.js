import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { level } = await params;
  const allocations = {
    conservative: { equity: 20, fixedIncome: 50, cash: 20, alternatives: 5, realEstate: 5 },
    moderately_conservative: { equity: 35, fixedIncome: 40, cash: 15, alternatives: 5, realEstate: 5 },
    balanced: { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
    moderately_aggressive: { equity: 65, fixedIncome: 20, cash: 5, alternatives: 5, realEstate: 5 },
    aggressive: { equity: 80, fixedIncome: 10, cash: 3, alternatives: 4, realEstate: 3 },
  };

  return ok(allocations[level] || allocations.balanced);
}
