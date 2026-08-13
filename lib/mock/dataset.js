// Central in-memory mock dataset shared by all Phase 2 + Phase 3 services.
// Generated deterministically so the demo is stable, while still allowing
// in-session mutations (create/update/delete) by the services layer.
//
// When the Personal Wealth Management module ships, each service can swap its
// reads/writes here for Supabase queries without any UI changes.
import { makeHelpers } from "./random";

const FIRST = [
  "Eleanor", "Marcus", "Priya", "David", "Sofia", "Liam", "Amara", "Noah", "Chloe", "Mateo",
  "Hannah", "Omar", "Isabella", "Ethan", "Yuki", "Gabriel", "Leila", "Lucas", "Nora", "Idris",
  "Camila", "Sebastian", "Aisha", "Henry", "Freya", "Diego",
];
const LAST = [
  "Whitman", "Lindqvist", "Raghunathan", "Okafor", "Moreau", "Bennett", "Diallo", "Schneider",
  "Rossi", "Alvarez", "Nakamura", "Haddad", "Petrova", "Carlsen", "Fernandes", "Kowalski",
  "Mensah", "Park", "Andersson", "Costa",
];
const CITIES = [
  "Mumbai, IN", "Delhi, IN", "Bengaluru, IN", "Pune, IN", "Hyderabad, IN",
  "Chennai, IN", "Kolkata, IN", "Ahmedabad, IN", "Jaipur, IN", "Surat, IN"
];
const OCCUPATIONS = [
  "Surgeon", "Tech Founder", "Corporate Lawyer", "Airline Pilot", "Architect", "Professor",
  "Investment Banker", "Business Owner", "Creative Director", "Retired Executive", "Dentist", "Consultant",
];
const STATUSES = ["prospect", "pending", "active", "active", "active", "inactive", "archived"];
const RISK = ["conservative", "moderate", "aggressive"];
const GOAL_TEMPLATES = [
  { label: "Retirement at 60", target: 2500000, type: "retirement" },
  { label: "Children's education fund", target: 400000, type: "education" },
  { label: "Second home purchase", target: 800000, type: "house" },
  { label: "Build emergency reserve", target: 150000, type: "emergency_fund" },
  { label: "Philanthropic endowment", target: 1000000, type: "wealth_creation" },
  { label: "Business succession", target: 3000000, type: "wealth_creation" },
  { label: "Dream vacation", target: 50000, type: "vacation" },
  { label: "New car purchase", target: 85000, type: "car" },
  { label: "Wedding fund", target: 120000, type: "marriage" },
];
const MEETING_TYPES = ["video", "phone", "in_person"];
const MEETING_TITLES = [
  "Portfolio Review", "Retirement Planning", "Tax Planning", "Financial Planning",
  "Risk Assessment", "Estate Planning", "Quarterly Check-in", "Onboarding Consultation",
];
const DOC_CATEGORIES = ["kyc", "identity", "tax", "investment_statements", "reports", "other"];
const DOC_NAMES = {
  kyc: ["KYC Form", "Source of Funds Declaration", "Client Agreement"],
  identity: ["Passport Copy", "Driver's License", "Proof of Address"],
  tax: ["Tax Return 2025", "W-2 Statement", "Capital Gains Summary"],
  investment_statements: ["Q1 Portfolio Statement", "Annual Holdings Report", "Brokerage Statement"],
  reports: ["Financial Plan Report", "Risk Profile Report", "Performance Review"],
  other: ["Meeting Memo", "Correspondence", "Misc Notes"],
};
const MSG_SNIPPETS = [
  "Thanks for the update on my portfolio.",
  "Could we move our meeting to next week?",
  "I've attached the documents you requested.",
  "What's your view on the recent market dip?",
  "Appreciate the detailed plan, looks great.",
  "Can you review my retirement projections?",
  "Just confirming our call tomorrow.",
  "Happy with the rebalancing, thank you!",
];

// ---- Phase 3 constants -------------------------------------------------------
const INVESTMENT_SECTORS = ["Technology", "Healthcare", "Financial Services", "Consumer Goods", "Energy", "Industrials", "Real Estate", "Utilities", "Materials", "Telecom"];
const INVESTMENT_GEO = ["US", "Europe", "Asia Pacific", "Emerging Markets", "Global"];
const STOCK_NAMES = [
  { name: "Apple Inc.", ticker: "AAPL" }, { name: "Microsoft Corp.", ticker: "MSFT" },
  { name: "Alphabet Inc.", ticker: "GOOGL" }, { name: "Amazon.com", ticker: "AMZN" },
  { name: "NVIDIA Corp.", ticker: "NVDA" }, { name: "Tesla Inc.", ticker: "TSLA" },
  { name: "JPMorgan Chase", ticker: "JPM" }, { name: "Johnson & Johnson", ticker: "JNJ" },
  { name: "Visa Inc.", ticker: "V" }, { name: "Procter & Gamble", ticker: "PG" },
];
const MF_NAMES = [
  "Vanguard Total Stock Market", "Fidelity 500 Index", "Schwab US Broad Market",
  "BlackRock Growth Fund", "T. Rowe Price Blue Chip", "American Funds Growth",
];
const ETF_NAMES = [
  "SPDR S&P 500 ETF", "Vanguard Total Bond Market", "iShares MSCI Emerging Markets",
  "Invesco QQQ Trust", "Vanguard Real Estate ETF", "iShares Russell 2000",
];
const BOND_NAMES = [
  "US Treasury 10Y", "Corporate Bond AAA", "Municipal Bond Fund",
  "High Yield Bond ETF", "Treasury Inflation Protected",
];
const PLAN_STATUSES = ["draft", "active", "under_review", "completed", "archived"];

const h = makeHelpers(20260629);

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ---- Phase 3: Financial profile per client -----------------------------------
function buildFinancialProfile(client, idx) {
  const salary = Math.round(client.income * h.float(0.55, 0.75));
  const businessIncome = h.bool(0.35) ? Math.round(client.income * h.float(0.1, 0.25)) : 0;
  const rentalIncome = h.bool(0.3) ? h.int(800, 5000) * 12 : 0;
  const investmentIncome = Math.round(client.assets * h.float(0.02, 0.06));
  const otherIncome = client.income - salary - businessIncome - Math.round(rentalIncome / 12) - Math.round(investmentIncome / 12);

  const housingPct = h.float(0.25, 0.35);
  const transportPct = h.float(0.08, 0.15);
  const foodPct = h.float(0.1, 0.18);
  const insurancePct = h.float(0.05, 0.1);
  const entertainmentPct = h.float(0.03, 0.08);
  const educationPct = h.float(0.02, 0.08);
  const healthcarePct = h.float(0.03, 0.08);
  const total = housingPct + transportPct + foodPct + insurancePct + entertainmentPct + educationPct + healthcarePct;
  const miscPct = 1 - total;

  const monthlyExpenses = client.expenses;
  const housing = Math.round(monthlyExpenses * housingPct);
  const transportation = Math.round(monthlyExpenses * transportPct);
  const food = Math.round(monthlyExpenses * foodPct);
  const insurance = Math.round(monthlyExpenses * insurancePct);
  const entertainment = Math.round(monthlyExpenses * entertainmentPct);
  const education = Math.round(monthlyExpenses * educationPct);
  const healthcare = Math.round(monthlyExpenses * healthcarePct);
  const miscellaneous = Math.round(monthlyExpenses * Math.max(0.02, miscPct));

  // Debts
  const homeLoan = client.liabilities > 100000 ? Math.round(client.liabilities * h.float(0.5, 0.7)) : 0;
  const personalLoan = h.bool(0.3) ? h.int(5, 50) * 1000 : 0;
  const vehicleLoan = h.bool(0.25) ? h.int(10, 45) * 1000 : 0;
  const creditCard = h.bool(0.4) ? h.int(2, 15) * 1000 : 0;
  const educationLoan = h.bool(0.2) ? h.int(15, 80) * 1000 : 0;

  const totalDebt = homeLoan + personalLoan + vehicleLoan + creditCard + educationLoan;
  const monthlyIncome = client.income;
  const debtRatio = totalDebt > 0 ? Number((totalDebt / client.assets).toFixed(2)) : 0;
  const totalEmi = Math.round(totalDebt * 0.008);
  const emiBurden = monthlyIncome > 0 ? Number((totalEmi / monthlyIncome).toFixed(2)) : 0;

  // Emergency fund
  const recommendedFund = monthlyExpenses * 6;
  const currentFund = Math.round(recommendedFund * h.float(0.3, 1.4));
  const coverageMonths = monthlyExpenses > 0 ? Number((currentFund / monthlyExpenses).toFixed(1)) : 0;

  // Net worth timeline (24 months)
  const netWorthTimeline = [];
  let runningNw = client.netWorth * h.float(0.65, 0.82);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  for (let m = 23; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const growth = h.float(0.005, 0.04);
    runningNw = Math.round(runningNw * (1 + growth));
    const liabFraction = h.float(0.1, 0.35);
    netWorthTimeline.push({
      month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      netWorth: runningNw,
      assets: Math.round(runningNw / (1 - liabFraction)),
      liabilities: Math.round((runningNw / (1 - liabFraction)) * liabFraction),
    });
  }

  // Cash flow history (12 months)
  const cashFlowHistory = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const inc = Math.round(monthlyIncome * h.float(0.92, 1.1));
    const exp = Math.round(monthlyExpenses * h.float(0.85, 1.15));
    cashFlowHistory.push({
      month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      income: inc,
      expenses: exp,
      savings: inc - exp,
    });
  }

  // Financial health score (0-100)
  let healthScore = 50;
  if (debtRatio < 0.3) healthScore += 15; else if (debtRatio < 0.5) healthScore += 5;
  if (emiBurden < 0.3) healthScore += 10; else if (emiBurden < 0.5) healthScore += 3;
  if (coverageMonths >= 6) healthScore += 15; else if (coverageMonths >= 3) healthScore += 8;
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  if (savingsRate > 0.3) healthScore += 10; else if (savingsRate > 0.15) healthScore += 5;
  healthScore = Math.min(100, Math.max(0, healthScore));

  return {
    clientId: client.id,
    income: {
      total: monthlyIncome,
      salary,
      businessIncome,
      rentalIncome: Math.round(rentalIncome / 12),
      investmentIncome: Math.round(investmentIncome / 12),
      otherIncome: Math.max(0, Math.round(otherIncome)),
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
      miscellaneous,
    },
    debts: {
      homeLoan,
      personalLoan,
      vehicleLoan,
      creditCard,
      educationLoan,
      total: totalDebt,
      debtRatio,
      totalEmi,
      emiBurden,
      debtReductionProgress: h.int(15, 85),
    },
    emergencyFund: {
      current: currentFund,
      recommended: recommendedFund,
      coverageMonths,
    },
    netWorthTimeline,
    cashFlowHistory,
    healthScore,
    savingsRate: Number(savingsRate.toFixed(2)),
    monthlySurplus: monthlyIncome - monthlyExpenses,
  };
}

// ---- Phase 3: Goals ----------------------------------------------------------
const GOAL_PRIORITIES = ["high", "medium", "low"];
const GOAL_STATUSES = ["on_track", "at_risk", "behind", "completed", "not_started"];

function buildGoals(client, idx) {
  const count = h.int(2, 5);
  const templates = h.sample(GOAL_TEMPLATES, count);
  return templates.map((t, gi) => {
    const progress = h.int(5, 95);
    const targetAmount = t.target + h.int(-50, 200) * 1000;
    const currentSavings = Math.round(targetAmount * progress / 100);
    const targetDate = daysFromNow(h.int(180, 2500));
    const monthsRemaining = Math.max(1, Math.round((targetDate - new Date()) / (30 * 24 * 60 * 60 * 1000)));
    const monthlyContribution = Math.round((targetAmount - currentSavings) / monthsRemaining);
    const status = progress > 90 ? "completed" : progress > 60 ? "on_track" : progress > 35 ? "at_risk" : progress > 15 ? "behind" : "not_started";

    return {
      id: `goal_${client.id}_${gi}`,
      clientId: client.id,
      type: t.type,
      label: t.label,
      targetAmount,
      currentSavings,
      targetDate: targetDate.toISOString(),
      monthlyContribution,
      progress,
      priority: h.pick(GOAL_PRIORITIES),
      status,
      createdAt: daysFromNow(-h.int(60, 400)).toISOString(),
    };
  });
}

// ---- Phase 3: Financial Plans ------------------------------------------------
function buildFinancialPlans(clients) {
  const plans = [];
  let planId = 1;
  const planClients = h.sample(clients.filter(c => c.status === "active"), Math.min(12, clients.filter(c => c.status === "active").length));
  planClients.forEach((c) => {
    const count = h.int(1, 2);
    for (let p = 0; p < count; p++) {
      const status = h.pick(PLAN_STATUSES);
      const createdAt = daysFromNow(-h.int(10, 300));
      const updatedAt = daysFromNow(-h.int(0, 10));
      plans.push({
        id: `plan_${String(planId++).padStart(3, "0")}`,
        clientId: c.id,
        clientName: c.name,
        title: `${c.name} — ${h.pick(["Comprehensive Financial Plan", "Retirement Strategy", "Wealth Growth Plan", "Estate & Succession Plan", "Tax Optimization Plan"])}`,
        status,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        version: h.int(1, 5),
        executiveSummary: `A comprehensive financial plan tailored for ${c.name} focusing on long-term wealth accumulation, risk management, and financial security. This plan addresses retirement goals, investment optimization, and tax efficiency strategies.`,
        objectives: [
          "Achieve financial independence by target retirement age",
          "Build a diversified investment portfolio aligned with risk tolerance",
          "Minimize tax liability through strategic planning",
          "Establish adequate insurance coverage for family protection",
          "Create an estate plan to preserve wealth for future generations",
        ],
        financialAnalysis: `Current net worth stands at ₹${(c.netWorth / 100000).toFixed(1)}L with total assets of ₹${(c.assets / 100000).toFixed(1)}L and liabilities of ₹${(c.liabilities / 100000).toFixed(1)}L. Monthly cash flow is positive with a savings rate of ${h.int(15, 40)}%.`,
        recommendedStrategy: h.pick([
          "Growth-oriented strategy with emphasis on equity allocation",
          "Balanced approach combining growth and income generation",
          "Conservative wealth preservation with focus on fixed income",
          "Aggressive growth strategy targeting maximum capital appreciation",
        ]),
        assetAllocation: {
          equity: c.allocation.equity,
          fixedIncome: c.allocation.fixedIncome,
          cash: c.allocation.cash,
          alternatives: c.allocation.alternatives,
          realEstate: c.allocation.realEstate,
        },
        riskAssessment: `Client has a ${c.riskProfile} risk profile. Investment strategy should align with ${c.riskProfile === "aggressive" ? "higher volatility tolerance" : c.riskProfile === "conservative" ? "capital preservation priorities" : "balanced growth objectives"}.`,
        actionItems: [
          { task: "Rebalance portfolio to target allocation", dueDate: daysFromNow(h.int(7, 30)).toISOString(), status: h.pick(["pending", "completed", "in_progress"]) },
          { task: "Review insurance coverage adequacy", dueDate: daysFromNow(h.int(14, 60)).toISOString(), status: h.pick(["pending", "completed", "in_progress"]) },
          { task: "Set up systematic investment plan", dueDate: daysFromNow(h.int(3, 15)).toISOString(), status: h.pick(["pending", "completed", "in_progress"]) },
          { task: "Schedule tax planning consultation", dueDate: daysFromNow(h.int(20, 90)).toISOString(), status: h.pick(["pending", "completed", "in_progress"]) },
        ],
        advisorNotes: `${c.name} is ${c.riskProfile === "conservative" ? "risk-averse and prefers stable returns" : c.riskProfile === "aggressive" ? "comfortable with higher risk for potentially greater returns" : "open to moderate risk with balanced returns"}. Priority focus on ${h.pick(["retirement planning", "wealth building", "tax optimization", "estate planning"])}.`,
        versionHistory: Array.from({ length: h.int(1, 4) }, (_, vi) => ({
          version: vi + 1,
          date: daysFromNow(-h.int(10 + vi * 30, 30 + vi * 60)).toISOString(),
          changes: h.pick([
            "Initial plan creation",
            "Updated asset allocation targets",
            "Revised retirement projections",
            "Added tax optimization strategies",
            "Updated risk assessment",
          ]),
        })),
      });
    }
  });
  return plans;
}

// ---- Phase 3: Portfolio Holdings ---------------------------------------------
function buildPortfolio(client, idx) {
  const holdings = [];
  let hid = 0;

  // Stocks
  const stockCount = h.int(2, 5);
  const stocks = h.sample(STOCK_NAMES, stockCount);
  stocks.forEach((s) => {
    const costBasis = h.int(20, 200) * 100;
    const returnPct = h.float(-8, 35);
    holdings.push({
      id: `hold_${client.id}_${hid++}`,
      type: "stock",
      name: s.name,
      ticker: s.ticker,
      sector: h.pick(INVESTMENT_SECTORS),
      geography: h.pick(INVESTMENT_GEO),
      costBasis,
      currentValue: Math.round(costBasis * (1 + returnPct / 100)),
      returnPct: Number(returnPct.toFixed(1)),
      quantity: h.int(10, 500),
      riskLevel: h.pick(["low", "medium", "high"]),
      timeHorizon: h.pick(["short", "medium", "long"]),
      liquidity: "high",
    });
  });

  // Mutual Funds
  const mfCount = h.int(1, 3);
  const mfs = h.sample(MF_NAMES, mfCount);
  mfs.forEach((name) => {
    const costBasis = h.int(50, 300) * 100;
    const returnPct = h.float(2, 22);
    holdings.push({
      id: `hold_${client.id}_${hid++}`,
      type: "mutual_fund",
      name,
      ticker: "",
      sector: h.pick(INVESTMENT_SECTORS),
      geography: h.pick(INVESTMENT_GEO),
      costBasis,
      currentValue: Math.round(costBasis * (1 + returnPct / 100)),
      returnPct: Number(returnPct.toFixed(1)),
      quantity: h.int(100, 2000),
      riskLevel: h.pick(["low", "medium", "high"]),
      timeHorizon: "long",
      liquidity: "medium",
    });
  });

  // ETFs
  const etfCount = h.int(1, 3);
  const etfs = h.sample(ETF_NAMES, etfCount);
  etfs.forEach((name) => {
    const costBasis = h.int(30, 150) * 100;
    const returnPct = h.float(1, 18);
    holdings.push({
      id: `hold_${client.id}_${hid++}`,
      type: "etf",
      name,
      ticker: "",
      sector: h.pick(INVESTMENT_SECTORS),
      geography: h.pick(INVESTMENT_GEO),
      costBasis,
      currentValue: Math.round(costBasis * (1 + returnPct / 100)),
      returnPct: Number(returnPct.toFixed(1)),
      quantity: h.int(20, 800),
      riskLevel: h.pick(["low", "medium"]),
      timeHorizon: "medium",
      liquidity: "high",
    });
  });

  // Bonds
  if (h.bool(0.6)) {
    const bondCount = h.int(1, 2);
    const bonds = h.sample(BOND_NAMES, bondCount);
    bonds.forEach((name) => {
      const costBasis = h.int(20, 100) * 100;
      const returnPct = h.float(2, 7);
      holdings.push({
        id: `hold_${client.id}_${hid++}`,
        type: "bond",
        name,
        ticker: "",
        sector: "Fixed Income",
        geography: h.pick(["US", "Global"]),
        costBasis,
        currentValue: Math.round(costBasis * (1 + returnPct / 100)),
        returnPct: Number(returnPct.toFixed(1)),
        quantity: h.int(10, 200),
        riskLevel: "low",
        timeHorizon: "long",
        liquidity: "medium",
      });
    });
  }

  // Gold
  if (h.bool(0.4)) {
    const costBasis = h.int(10, 60) * 100;
    const returnPct = h.float(3, 15);
    holdings.push({
      id: `hold_${client.id}_${hid++}`,
      type: "gold",
      name: "Gold ETF / Physical Gold",
      ticker: "GLD",
      sector: "Commodities",
      geography: "Global",
      costBasis,
      currentValue: Math.round(costBasis * (1 + returnPct / 100)),
      returnPct: Number(returnPct.toFixed(1)),
      quantity: h.int(5, 50),
      riskLevel: "medium",
      timeHorizon: "long",
      liquidity: "medium",
    });
  }

  // Fixed Deposits
  if (h.bool(0.5)) {
    const costBasis = h.int(20, 100) * 1000;
    holdings.push({
      id: `hold_${client.id}_${hid++}`,
      type: "fixed_deposit",
      name: `Fixed Deposit — ${h.pick(["12M", "24M", "36M", "60M"])}`,
      ticker: "",
      sector: "Fixed Income",
      geography: "Domestic",
      costBasis,
      currentValue: Math.round(costBasis * (1 + h.float(0.04, 0.08))),
      returnPct: Number(h.float(4, 8).toFixed(1)),
      quantity: 1,
      riskLevel: "low",
      timeHorizon: "medium",
      liquidity: "low",
    });
  }

  // Performance history (12 months)
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  let runningValue = totalCost * h.float(0.85, 0.95);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const performanceHistory = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const growth = h.float(-0.02, 0.06);
    runningValue = Math.round(runningValue * (1 + growth));
    performanceHistory.push({
      month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      value: runningValue,
      benchmark: Math.round(totalCost * (1 + (12 - m) * 0.008)),
    });
  }

  // Analysis scores
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const uniqueSectors = new Set(holdings.map(h => h.sector)).size;
  const uniqueTypes = new Set(holdings.map(h => h.type)).size;

  return {
    clientId: client.id,
    holdings,
    totalValue,
    totalCost: holdings.reduce((s, h) => s + h.costBasis, 0),
    totalReturn: Number(((totalValue / Math.max(1, holdings.reduce((s, h) => s + h.costBasis, 0)) - 1) * 100).toFixed(1)),
    performanceHistory,
    analysis: {
      diversificationScore: Math.min(100, uniqueSectors * 8 + uniqueTypes * 12 + h.int(10, 25)),
      riskScore: h.int(20, 85),
      volatility: Number(h.float(5, 22).toFixed(1)),
      allocationDrift: Number(h.float(1, 12).toFixed(1)),
      concentrationRisk: holdings.length < 5 ? "high" : holdings.length < 10 ? "medium" : "low",
      sharpeRatio: Number(h.float(0.5, 2.2).toFixed(2)),
    },
  };
}

// ---- Phase 3: Risk Profile ---------------------------------------------------
const RISK_LEVELS = ["conservative", "moderately_conservative", "balanced", "moderately_aggressive", "aggressive"];

function buildRiskProfile(client) {
  const riskMap = { conservative: 0, moderate: 2, aggressive: 4 };
  const baseIdx = riskMap[client.riskProfile] ?? 2;
  const riskLevelIdx = Math.max(0, Math.min(4, baseIdx + h.int(-1, 1)));
  const riskLevel = RISK_LEVELS[riskLevelIdx];
  const riskScore = 20 + riskLevelIdx * 15 + h.int(0, 15);

  const allocations = {
    conservative: { equity: 20, fixedIncome: 50, cash: 20, alternatives: 5, realEstate: 5 },
    moderately_conservative: { equity: 35, fixedIncome: 40, cash: 15, alternatives: 5, realEstate: 5 },
    balanced: { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
    moderately_aggressive: { equity: 65, fixedIncome: 20, cash: 5, alternatives: 5, realEstate: 5 },
    aggressive: { equity: 80, fixedIncome: 10, cash: 3, alternatives: 4, realEstate: 3 },
  };

  return {
    clientId: client.id,
    riskLevel,
    riskScore,
    investmentExperience: h.pick(["none", "beginner", "intermediate", "advanced", "expert"]),
    riskCapacity: h.pick(["low", "medium", "high"]),
    riskTolerance: h.pick(["low", "medium", "high"]),
    financialStability: h.pick(["unstable", "somewhat_stable", "stable", "very_stable"]),
    investmentHorizon: h.pick(["short", "medium", "long", "very_long"]),
    recommendedAllocation: allocations[riskLevel],
    suitableCategories: riskLevelIdx <= 1
      ? ["Fixed Deposits", "Government Bonds", "Blue Chip Stocks", "Index Funds"]
      : riskLevelIdx <= 2
        ? ["Index Funds", "Balanced Mutual Funds", "Blue Chip Stocks", "REITs", "Corporate Bonds"]
        : ["Growth Stocks", "Small Cap Funds", "Emerging Market ETFs", "REITs", "Alternative Investments", "Sector ETFs"],
    assessedAt: daysFromNow(-h.int(5, 120)).toISOString(),
  };
}

// ---- Phase 3: Recommendations ------------------------------------------------
const REC_CATEGORIES = ["investment", "savings", "insurance", "tax", "retirement", "debt", "liquidity", "emergency_fund"];
const REC_TEMPLATES = {
  investment: [
    { title: "Increase equity allocation", explanation: "Your current equity allocation is below the recommended level for your risk profile. Consider increasing equity exposure for better long-term growth.", benefit: "Potential 2-4% higher annual returns", timeline: "1-3 months" },
    { title: "Diversify into international markets", explanation: "Your portfolio is heavily concentrated in domestic markets. International diversification can reduce country-specific risk.", benefit: "Reduced portfolio volatility by 10-15%", timeline: "1-2 months" },
    { title: "Add bond allocation for stability", explanation: "Fixed income assets can provide portfolio stability during market downturns and generate regular income.", benefit: "Lower portfolio volatility, steady income stream", timeline: "2-4 weeks" },
  ],
  savings: [
    { title: "Automate monthly savings transfers", explanation: "Setting up automatic transfers ensures consistent savings without requiring manual action each month.", benefit: "Increase savings rate by 5-10%", timeline: "1 week" },
    { title: "Open a high-yield savings account", explanation: "Your emergency fund is earning below-market interest rates. Consider moving to a high-yield savings account.", benefit: "Additional ₹5,000-15,000 annual interest", timeline: "1-2 weeks" },
  ],
  insurance: [
    { title: "Review life insurance coverage", explanation: "Your current life insurance may not adequately cover your family's needs based on your income and liabilities.", benefit: "Adequate protection for dependents", timeline: "2-4 weeks" },
    { title: "Consider disability insurance", explanation: "Disability insurance protects your income earning capacity, which is your greatest financial asset.", benefit: "Income protection up to 60% of salary", timeline: "2-3 weeks" },
  ],
  tax: [
    { title: "Maximize retirement account contributions", explanation: "You haven't maximized your tax-advantaged retirement contributions this year.", benefit: "Tax savings of ₹30,000-80,000 annually", timeline: "Before year-end" },
    { title: "Implement tax-loss harvesting", explanation: "Selling underperforming investments to offset capital gains can reduce your tax liability.", benefit: "Potential tax savings of ₹10,000-50,000", timeline: "Q4 of current year" },
  ],
  retirement: [
    { title: "Increase retirement contributions", explanation: "At your current savings rate, you may not meet your retirement target. Consider increasing monthly contributions.", benefit: "Reach retirement goal 3-5 years earlier", timeline: "Immediate" },
    { title: "Review retirement portfolio allocation", explanation: "As you approach retirement, your portfolio should gradually shift to more conservative investments.", benefit: "Reduced sequence-of-returns risk", timeline: "1-2 months" },
  ],
  debt: [
    { title: "Refinance high-interest debt", explanation: "You have debt at above-market interest rates. Refinancing could save significant interest costs.", benefit: "Save ₹20,000-50,000 in interest annually", timeline: "1-2 months" },
    { title: "Accelerate credit card payoff", explanation: "Credit card debt carries the highest interest rate among your liabilities. Prioritize paying it off.", benefit: "Eliminate ₹5,000-20,000 in annual interest", timeline: "6-12 months" },
  ],
  liquidity: [
    { title: "Rebalance liquid vs illiquid assets", explanation: "A significant portion of your portfolio is in illiquid investments. Ensure adequate liquidity for emergencies.", benefit: "Improved access to funds when needed", timeline: "1-3 months" },
  ],
  emergency_fund: [
    { title: "Build emergency fund to 6 months", explanation: "Your emergency fund covers less than the recommended 6 months of expenses. Prioritize building it up.", benefit: "Financial security during unexpected events", timeline: "6-12 months" },
  ],
};

function buildRecommendations(client, financialProfile) {
  const recs = [];
  let rid = 0;
  const categories = h.sample(REC_CATEGORIES, h.int(4, 7));
  categories.forEach((cat) => {
    const templates = REC_TEMPLATES[cat];
    if (!templates?.length) return;
    const template = h.pick(templates);
    recs.push({
      id: `rec_${client.id}_${rid++}`,
      clientId: client.id,
      category: cat,
      title: template.title,
      priority: h.pick(["high", "medium", "low"]),
      explanation: template.explanation,
      expectedBenefit: template.benefit,
      estimatedTimeline: template.timeline,
      status: h.pick(["pending", "actioned", "dismissed"]),
      createdAt: daysFromNow(-h.int(1, 60)).toISOString(),
    });
  });
  return recs;
}

// ---- Original client builder (Phase 2) — unchanged --------------------------
function buildClient(i) {
  const first = FIRST[i % FIRST.length];
  const last = h.pick(LAST);
  const name = `${first} ${last}`;
  const status = h.pick(STATUSES);
  const risk = h.pick(RISK);

  const assets = h.int(200, 8000) * 1000;
  const liabilities = h.int(0, Math.round(assets * 0.4 / 1000)) * 1000;
  const income = h.int(120, 1200) * 1000;
  const expenses = Math.round(income * h.float(0.3, 0.7));

  const allocByRisk = {
    conservative: { equity: 30, fixedIncome: 45, cash: 15, alternatives: 5, realEstate: 5 },
    moderate: { equity: 55, fixedIncome: 25, cash: 8, alternatives: 7, realEstate: 5 },
    aggressive: { equity: 75, fixedIncome: 10, cash: 5, alternatives: 7, realEstate: 3 },
  }[risk];

  const goals = h.sample(GOAL_TEMPLATES, h.int(1, 3)).map((g, idx) => ({
    id: `${i}-goal-${idx}`,
    label: g.label,
    target: g.target,
    progress: h.int(10, 95),
  }));

  return {
    id: `cl_${String(i + 1).padStart(3, "0")}`,
    firstName: first,
    lastName: last,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
    phone: `+1 ${h.int(200, 989)} ${h.int(100, 999)} ${h.int(1000, 9999)}`,
    status,
    riskProfile: risk,
    age: h.int(28, 72),
    occupation: h.pick(OCCUPATIONS),
    location: h.pick(CITIES),
    joinedDate: daysFromNow(-h.int(20, 900)).toISOString(),
    lastContact: daysFromNow(-h.int(0, 45)).toISOString(),
    netWorth: assets - liabilities,
    assets,
    liabilities,
    income,
    expenses,
    allocation: allocByRisk,
    goals,
    tags: h.sample(["High Net Worth", "Referral", "Tax-Sensitive", "ESG", "Retiree", "Entrepreneur"], h.int(1, 3)),
  };
}

function buildAppointments(clients) {
  const out = [];
  let id = 1;
  clients.forEach((c) => {
    const count = h.int(0, 3);
    for (let k = 0; k < count; k++) {
      const offset = h.int(-40, 25);
      const date = daysFromNow(offset);
      date.setHours(h.int(8, 17), h.bool() ? 0 : 30, 0, 0);
      const status = offset < 0 ? (h.bool(0.85) ? "completed" : "cancelled") : "upcoming";
      out.push({
        id: `apt_${String(id++).padStart(3, "0")}`,
        clientId: c.id,
        clientName: c.name,
        title: h.pick(MEETING_TITLES),
        type: h.pick(MEETING_TYPES),
        start: date.toISOString(),
        duration: h.pick([30, 45, 60]),
        status,
        notes: status === "completed" ? "Reviewed objectives and agreed on next steps." : "",
      });
    }
  });
  return out.sort((a, b) => new Date(a.start) - new Date(b.start));
}

function buildConversations(clients) {
  const subset = h.sample(clients, 8);
  return subset.map((c, i) => {
    const msgCount = h.int(3, 8);
    const messages = [];
    for (let k = 0; k < msgCount; k++) {
      const fromClient = h.bool(0.55);
      const minsAgo = (msgCount - k) * h.int(40, 600);
      messages.push({
        id: `msg_${c.id}_${k}`,
        from: fromClient ? "client" : "advisor",
        text: h.pick(MSG_SNIPPETS),
        at: new Date(Date.now() - minsAgo * 60000).toISOString(),
        read: fromClient ? h.bool(0.6) : true,
      });
    }
    const unread = messages.filter((m) => m.from === "client" && !m.read).length;
    return {
      id: `conv_${i + 1}`,
      clientId: c.id,
      clientName: c.name,
      lastMessage: messages[messages.length - 1].text,
      lastAt: messages[messages.length - 1].at,
      unread,
      messages,
    };
  });
}

function buildDocuments(clients) {
  const out = [];
  let id = 1;
  clients.forEach((c) => {
    const count = h.int(1, 5);
    const cats = h.sample(DOC_CATEGORIES, count);
    cats.forEach((cat) => {
      out.push({
        id: `doc_${String(id++).padStart(3, "0")}`,
        clientId: c.id,
        clientName: c.name,
        name: `${h.pick(DOC_NAMES[cat])}.pdf`,
        category: cat,
        sizeKb: h.int(80, 5200),
        uploadedAt: daysFromNow(-h.int(0, 300)).toISOString(),
      });
    });
  });
  return out.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function buildNotes(clients) {
  const subset = h.sample(clients, 10);
  const texts = [
    "Client prefers conservative positioning ahead of retirement.",
    "Discussed tax-loss harvesting opportunities for Q4.",
    "Interested in ESG-focused funds — follow up with options.",
    "Reviewing estate plan; needs referral to estate attorney.",
    "Wants to increase monthly contributions starting next quarter.",
    "Concerned about market volatility — reassured on long-term plan.",
  ];
  return subset.map((c, i) => ({
    id: `note_${i + 1}`,
    clientId: c.id,
    clientName: c.name,
    type: h.bool(0.4) ? "meeting" : "private",
    pinned: h.bool(0.3),
    title: h.pick(MEETING_TITLES) + " notes",
    body: h.pick(texts),
    createdAt: daysFromNow(-h.int(0, 120)).toISOString(),
  }));
}

// ---- Singleton dataset -------------------------------------------------------
const clients = Array.from({ length: 26 }, (_, i) => buildClient(i));

// Phase 3 data
const financialProfiles = clients.map((c, i) => buildFinancialProfile(c, i));
const goals = clients.flatMap((c, i) => buildGoals(c, i));
const financialPlans = buildFinancialPlans(clients);
const portfolios = clients.map((c, i) => buildPortfolio(c, i));
const riskProfiles = clients.map((c) => buildRiskProfile(c));
const recommendations = clients.flatMap((c, i) => {
  const fp = financialProfiles.find(f => f.clientId === c.id);
  return buildRecommendations(c, fp);
});

export const dataset = {
  // Phase 2
  clients,
  appointments: buildAppointments(clients),
  conversations: buildConversations(clients),
  documents: buildDocuments(clients),
  notes: buildNotes(clients),
  // Phase 3
  financialProfiles,
  goals,
  financialPlans,
  portfolios,
  riskProfiles,
  recommendations,
};
