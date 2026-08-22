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
      return fail("Invalid JSON payload");
    }

    const {
      clientId,
      financialSituationAnalysis = "",
      goalAnalysis = "",
      overallAssessment = "",
    } = body || {};

    if (!clientId) return fail("clientId is required");

    // 1. Fetch client
    const client = await db.findOne("clients", { id: clientId });
    if (!client) return fail("Client not found", 404);

    // 2. Save / update Advisor Analysis in PostgreSQL
    const existingAnalysis = await db.findOne("advisor_analyses", { client_id: clientId });
    let advisorAnalysis;
    if (existingAnalysis) {
      advisorAnalysis = await db.update(
        "advisor_analyses",
        { id: existingAnalysis.id },
        {
          financial_situation_analysis: financialSituationAnalysis,
          goal_analysis: goalAnalysis,
          overall_assessment: overallAssessment,
          advisor_id: user.id,
        }
      );
    } else {
      advisorAnalysis = await db.insert("advisor_analyses", {
        advisor_id: user.id,
        client_id: clientId,
        financial_situation_analysis: financialSituationAnalysis,
        goal_analysis: goalAnalysis,
        overall_assessment: overallAssessment,
      });
    }

    // 3. Fetch client financial profile & goals
    const financialInformation = (await db.findOne("financial_profiles", { client_id: clientId })) || {};
    const financialGoals = (await db.findMany("client_goals", { client_id: clientId })) || [];

    // 4. Generate Personalized Advice via LLM
    const llmResult = await generatePersonalizedAdvice({
      client,
      financialInformation,
      financialGoals,
      advisorAnalysis: {
        financialSituationAnalysis,
        goalAnalysis,
        overallAssessment,
      },
    });

    const summary = llmResult?.summary || "";
    const adviceList = Array.isArray(llmResult?.advice) ? llmResult.advice : [];

    // 5. Store generated advice in advisor_advice table
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
            advisorAnalysis: { financialSituationAnalysis, goalAnalysis, overallAssessment },
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
          advisorAnalysis: { financialSituationAnalysis, goalAnalysis, overallAssessment },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // 6. Synchronize into recommendations table for seamless system-wide integration
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
          : "investment",
        title: item.title,
        priority: (item.priority || "Medium").toLowerCase(),
        explanation: item.explanation,
        expected_benefit: item.action,
        estimated_timeline: item.relatedGoal ? `Aligned with ${item.relatedGoal}` : "Continuous",
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
    console.error("[generate-advice error]:", error);
    return fail(error.message || "Failed to generate advice", 500);
  }
}
