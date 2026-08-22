import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, unauthorized } from "@/lib/api/response";
import { generatePersonalizedAdvice } from "@/lib/llm/advisorAdviceGenerator";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized("Advisor not authenticated");

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON payload", 400);
    }

    const {
      clientId,
      financialSituationAnalysis = "",
      goalAnalysis = "",
      overallAssessment = "",
    } = body || {};

    if (!clientId) return fail("clientId is required", 400);

    // 1. Fetch client
    const client = await db.findOne("clients", { id: clientId });
    if (!client) return fail("Client not found", 404);

    // Verify advisor-client relationship if advisor_id exists on client
    if (client.advisor_id && client.advisor_id !== user.id) {
      // If user is advisor, allow access or assign
    }

    // 2. Fetch client financial profile & goals
    const financialInformation = (await db.findOne("financial_profiles", { client_id: clientId })) || {};
    const financialGoals = (await db.findMany("client_goals", { client_id: clientId })) || [];

    // 3. Strict Pre-LLM Validation Layer
    const hasGoals = Array.isArray(financialGoals) && financialGoals.length > 0;
    const cleanSituation = (financialSituationAnalysis || "").trim();
    const cleanGoalAnalysis = (goalAnalysis || "").trim();
    const cleanOverall = (overallAssessment || "").trim();
    const hasAnalysis = Boolean(cleanSituation || cleanGoalAnalysis || cleanOverall);

    const annualIncome = Number(client.income || financialInformation?.income?.total || 0);
    const totalAssets = Number(client.assets || financialInformation?.totalAssets || financialInformation?.assets || 0);
    const netWorth = Number(client.net_worth || client.netWorth || financialInformation?.netWorth || financialInformation?.net_worth || 0);
    const totalLiabilities = Number(client.liabilities || financialInformation?.totalLiabilities || financialInformation?.liabilities || 0);
    const hasFinancialData = Boolean(annualIncome > 0 || totalAssets > 0 || netWorth !== 0 || totalLiabilities > 0 || (financialInformation && Object.keys(financialInformation).length > 0 && (financialInformation.income?.total || financialInformation.assets)));

    const missingFields = [];
    if (!hasFinancialData) missingFields.push("financial_information");
    if (!hasAnalysis) missingFields.push("financial_analysis");
    if (!hasGoals) missingFields.push("financial_goals");

    if (missingFields.length > 0) {
      // DO NOT CALL LLM
      return new Response(
        JSON.stringify({
          success: false,
          status: "insufficient_data",
          message: "Personalized advice cannot be generated yet. Please complete the client's financial analysis and goals first.",
          missingFields,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Save / update Advisor Analysis in PostgreSQL
    const existingAnalysis = await db.findOne("advisor_analyses", { client_id: clientId });
    let advisorAnalysis;
    if (existingAnalysis) {
      advisorAnalysis = await db.update(
        "advisor_analyses",
        { id: existingAnalysis.id },
        {
          financial_situation_analysis: cleanSituation,
          goal_analysis: cleanGoalAnalysis,
          overall_assessment: cleanOverall,
          advisor_id: user.id,
        }
      );
    } else {
      advisorAnalysis = await db.insert("advisor_analyses", {
        advisor_id: user.id,
        client_id: clientId,
        financial_situation_analysis: cleanSituation,
        goal_analysis: cleanGoalAnalysis,
        overall_assessment: cleanOverall,
      });
    }

    // 5. Generate Personalized Advice via LLM
    const llmResult = await generatePersonalizedAdvice({
      client,
      financialInformation,
      financialGoals,
      advisorAnalysis: {
        financialSituationAnalysis: cleanSituation,
        goalAnalysis: cleanGoalAnalysis,
        overallAssessment: cleanOverall,
      },
    });

    const summary = llmResult?.summary || "";
    const adviceList = Array.isArray(llmResult?.advice) ? llmResult.advice : [];

    if (!summary || adviceList.length === 0) {
      return fail("Unable to generate valid personalized advice from the provided financial analysis", 500);
    }

    // 6. Store generated advice in advisor_advice table
    const existingAdvice = await db.findOne("advisor_advice", { client_id: clientId });
    let savedAdvice;
    if (existingAdvice) {
      savedAdvice = await db.update(
        "advisor_advice",
        { id: existingAdvice.id },
        {
          advisor_id: user.id,
          summary,
          advice: adviceList,
          raw_input: {
            advisorAnalysis: { financialSituationAnalysis: cleanSituation, goalAnalysis: cleanGoalAnalysis, overallAssessment: cleanOverall },
            generatedAt: new Date().toISOString(),
          },
        }
      );
    } else {
      savedAdvice = await db.insert("advisor_advice", {
        advisor_id: user.id,
        client_id: clientId,
        summary,
        advice: adviceList,
        raw_input: {
          advisorAnalysis: { financialSituationAnalysis: cleanSituation, goalAnalysis: cleanGoalAnalysis, overallAssessment: cleanOverall },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // 7. Synchronize into recommendations table
    await db.remove("recommendations", { client_id: clientId });
    for (const item of adviceList) {
      await db.insert("recommendations", {
        client_id: clientId,
        category: (item.relatedGoal || "Investment").toLowerCase().includes("retire")
          ? "retirement"
          : (item.relatedGoal || "").toLowerCase().includes("emergency")
          ? "emergency_fund"
          : (item.relatedGoal || "").toLowerCase().includes("tax")
          ? "tax"
          : (item.relatedGoal || "").toLowerCase().includes("loan") || (item.relatedGoal || "").toLowerCase().includes("debt")
          ? "debt"
          : (item.relatedGoal || "").toLowerCase().includes("house") || (item.relatedGoal || "").toLowerCase().includes("save")
          ? "savings"
          : "investment",
        title: item.title,
        priority: (item.priority || "Medium").toLowerCase(),
        explanation: item.explanation,
        expected_benefit: item.action,
        estimated_timeline: item.relatedGoal ? `Aligned with ${item.relatedGoal}` : "Ongoing",
        status: "pending",
      });
    }

    return ok({
      id: savedAdvice.id,
      clientId,
      summary,
      advice: adviceList,
      advisorAnalysis: {
        financialSituationAnalysis: advisorAnalysis.financial_situation_analysis,
        goalAnalysis: advisorAnalysis.goal_analysis,
        overallAssessment: advisorAnalysis.overall_assessment,
      },
      updatedAt: savedAdvice.updated_at,
    });
  } catch (error) {
    if (error.code === "INSUFFICIENT_DATA") {
      return new Response(
        JSON.stringify({
          success: false,
          status: "insufficient_data",
          message: error.message,
          missingFields: error.missingFields || [],
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    console.error("[generate-advice error]:", error);
    return fail(error.message || "Failed to generate advice", 500);
  }
}
