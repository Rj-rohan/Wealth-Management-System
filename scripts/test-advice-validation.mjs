import { generatePersonalizedAdvice } from "../lib/llm/advisorAdviceGenerator.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING STRICT ADVICE VALIDATION & SAFETY TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: Client has no financial data
  try {
    console.log("--- TEST 1: Client has no financial data ---");
    const client = { id: "test_empty", name: "Empty Client", income: 0, expenses: 0, assets: 0, liabilities: 0, net_worth: 0 };
    await generatePersonalizedAdvice({
      client,
      financialInformation: {},
      financialGoals: [{ label: "Retirement", target_amount: 1000000 }],
      advisorAnalysis: { financialSituationAnalysis: "Good analysis." }
    });
    console.error("FAIL: Expected insufficient_data error but call succeeded");
    failed++;
  } catch (err) {
    if (err.code === "INSUFFICIENT_DATA" && err.missingFields?.includes("financial_information")) {
      console.log("PASS: Blocked successfully with code:", err.code, "Missing:", err.missingFields);
      passed++;
    } else {
      console.error("FAIL: Unexpected error:", err);
      failed++;
    }
  }

  // TEST 2: Client has financial data but no goals
  try {
    console.log("\n--- TEST 2: Client has financial data but no goals ---");
    const client = { id: "test_no_goals", name: "No Goals Client", income: 100000, assets: 500000, net_worth: 500000 };
    await generatePersonalizedAdvice({
      client,
      financialInformation: { income: { total: 100000 }, netWorth: 500000 },
      financialGoals: [],
      advisorAnalysis: { financialSituationAnalysis: "Stable IT job." }
    });
    console.error("FAIL: Expected insufficient_data error but call succeeded");
    failed++;
  } catch (err) {
    if (err.code === "INSUFFICIENT_DATA" && err.missingFields?.includes("financial_goals")) {
      console.log("PASS: Blocked successfully with code:", err.code, "Missing:", err.missingFields);
      passed++;
    } else {
      console.error("FAIL: Unexpected error:", err);
      failed++;
    }
  }

  // TEST 3: Client has goals but no advisor financial analysis
  try {
    console.log("\n--- TEST 3: Client has goals but no advisor financial analysis ---");
    const client = { id: "test_no_analysis", name: "No Analysis Client", income: 100000, assets: 500000, net_worth: 500000 };
    await generatePersonalizedAdvice({
      client,
      financialInformation: { income: { total: 100000 }, netWorth: 500000 },
      financialGoals: [{ label: "Emergency Fund", target_amount: 300000 }],
      advisorAnalysis: { financialSituationAnalysis: "", goalAnalysis: "", overallAssessment: "" }
    });
    console.error("FAIL: Expected insufficient_data error but call succeeded");
    failed++;
  } catch (err) {
    if (err.code === "INSUFFICIENT_DATA" && err.missingFields?.includes("financial_analysis")) {
      console.log("PASS: Blocked successfully with code:", err.code, "Missing:", err.missingFields);
      passed++;
    } else {
      console.error("FAIL: Unexpected error:", err);
      failed++;
    }
  }

  // TEST 4: Client has complete data (financial data + goals + advisor analysis)
  try {
    console.log("\n--- TEST 4: Client has complete data ---");
    const client = { id: "test_complete", name: "Complete Client", income: 120000, assets: 800000, net_worth: 800000, risk_profile: "Moderate" };
    const res = await generatePersonalizedAdvice({
      client,
      financialInformation: { income: { total: 120000 }, netWorth: 800000 },
      financialGoals: [{ label: "Retirement", type: "retirement", target_amount: 20000000, priority: "High" }],
      advisorAnalysis: {
        financialSituationAnalysis: "Stable IT income with 45% savings rate.",
        goalAnalysis: "Retirement is the primary objective.",
        overallAssessment: "Channel monthly surplus into diversified mutual funds."
      }
    });
    if (res?.summary && Array.isArray(res?.advice) && res.advice.length > 0) {
      console.log("PASS: Personalized advice generated successfully.");
      console.log("Summary:", res.summary);
      console.log("Advice count:", res.advice.length);
      passed++;
    } else {
      console.error("FAIL: Result format invalid:", res);
      failed++;
    }
  } catch (err) {
    console.error("FAIL: Unexpected error on complete data:", err);
    failed++;
  }

  // TEST 5: Two clients with different financial data & goals receive strictly distinct advice
  try {
    console.log("\n--- TEST 5: Two distinct clients receive distinct advice ---");
    const clientA = { id: "clientA", name: "Client Alpha", income: 250000, assets: 4000000, net_worth: 4000000, risk_profile: "Aggressive" };
    const clientB = { id: "clientB", name: "Client Beta", income: 60000, assets: 200000, net_worth: 200000, risk_profile: "Conservative" };

    const resA = await generatePersonalizedAdvice({
      client: clientA,
      financialInformation: { income: { total: 250000 }, netWorth: 4000000 },
      financialGoals: [{ label: "Commercial Property Purchase", type: "house", target_amount: 15000000 }],
      advisorAnalysis: { financialSituationAnalysis: "High cash flow executive." }
    });

    const resB = await generatePersonalizedAdvice({
      client: clientB,
      financialInformation: { income: { total: 60000 }, netWorth: 200000 },
      financialGoals: [{ label: "Emergency Buffer", type: "emergency_fund", target_amount: 180000 }],
      advisorAnalysis: { financialSituationAnalysis: "Modest income, prioritizing safety." }
    });

    if (resA.summary !== resB.summary && resA.advice[0]?.title !== resB.advice[0]?.title) {
      console.log("PASS: Both clients received strictly differentiated, personalized advice.");
      console.log("Client Alpha Advice Title:", resA.advice[0]?.title);
      console.log("Client Beta Advice Title:", resB.advice[0]?.title);
      passed++;
    } else {
      console.error("FAIL: Advice was identical between different clients.");
      failed++;
    }
  } catch (err) {
    console.error("FAIL: Unexpected error in multi-client test:", err);
    failed++;
  }

  // TEST 6: Missing optional data (risk profile is missing) -> engine does not hallucinate
  try {
    console.log("\n--- TEST 6: Missing optional data (no risk profile) ---");
    const clientNoRisk = { id: "client_norisk", name: "No Risk Profile Client", income: 100000, assets: 400000, net_worth: 400000, risk_profile: null };
    const res = await generatePersonalizedAdvice({
      client: clientNoRisk,
      financialInformation: { income: { total: 100000 }, netWorth: 400000 },
      financialGoals: [{ label: "Retirement", type: "retirement", target_amount: 10000000 }],
      advisorAnalysis: { financialSituationAnalysis: "Regular savings." }
    });

    const hasFabricatedRisk = JSON.stringify(res).includes("Aggressive") || JSON.stringify(res).includes("Conservative");
    if (!hasFabricatedRisk) {
      console.log("PASS: Engine did not invent missing risk profile.");
      console.log("Summary:", res.summary);
      passed++;
    } else {
      console.error("FAIL: Engine invented risk profile when none provided:", res);
      failed++;
    }
  } catch (err) {
    console.error("FAIL: Unexpected error in optional data test:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runTests().catch(console.error);
