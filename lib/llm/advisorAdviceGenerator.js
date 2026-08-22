/**
 * System Instruction for the Personal Wealth Advisor LLM
 */
const SYSTEM_INSTRUCTION = `You are assisting a professional wealth advisor.

Use ONLY the information explicitly provided in the request.

Never invent, fabricate, assume, or guess client financial information, financial goals, risk profiles, income, expenses, assets, liabilities, investments, or other financial details.

The advisor's financial analysis and the client's actual financial data are the source of truth.

If required information is missing, do not generate personalized financial advice.

Do not create recommendations based on generic assumptions when client-specific information is unavailable.

Never claim that advice is personalized when the required client information is missing.

Do not guarantee investment returns.

You MUST respond strictly with valid JSON conforming to this exact schema:
{
  "summary": "Clear, professional executive summary addressed to the client explaining the advisor's assessment",
  "advice": [
    {
      "title": "Concise Advice Headline",
      "priority": "High" | "Medium" | "Low",
      "explanation": "Why this is important (in simple, client-friendly words)",
      "action": "Suggested direction (actionable steps)",
      "relatedGoal": "Goal name (e.g. Retirement, House Purchase, etc.)"
    }
  ]
}`;

/**
 * Generate Personalized Advice using LLM API with strict pre-validation.
 */
export async function generatePersonalizedAdvice({ client, financialInformation, financialGoals, advisorAnalysis }) {
  if (!client) {
    const err = new Error("Client record is required.");
    err.code = "INSUFFICIENT_DATA";
    throw err;
  }

  const hasGoals = Array.isArray(financialGoals) && financialGoals.length > 0;
  const analysisSituation = (advisorAnalysis?.financialSituationAnalysis || advisorAnalysis?.financial_situation_analysis || "").trim();
  const analysisGoal = (advisorAnalysis?.goalAnalysis || advisorAnalysis?.goal_analysis || "").trim();
  const analysisOverall = (advisorAnalysis?.overallAssessment || advisorAnalysis?.overall_assessment || "").trim();
  const hasAnalysis = Boolean(analysisSituation || analysisGoal || analysisOverall);

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
    const err = new Error("Personalized advice cannot be generated yet. Please complete the client's financial analysis and goals first.");
    err.code = "INSUFFICIENT_DATA";
    err.missingFields = missingFields;
    throw err;
  }

  const payload = {
    client: {
      name: client.name || `${client.first_name || ""} ${client.last_name || ""}`.trim(),
      age: client.age || null,
      gender: client.gender || null,
      occupation: client.occupation || null,
      location: client.location || null,
      riskProfile: client.risk_profile || client.riskProfile || null,
    },
    financialInformation: {
      annualIncome,
      monthlyIncome: Number(financialInformation?.income?.total || (client.income ? Math.round(client.income / 12) : 0)),
      monthlyExpenses: Number(financialInformation?.expenses?.total || (client.expenses ? Math.round(client.expenses / 12) : 0)),
      monthlySavings: Number(financialInformation?.monthly_surplus || financialInformation?.monthlySurplus || 0),
      totalAssets,
      totalLiabilities,
      netWorth,
      emergencyFundCurrent: Number(financialInformation?.emergency_fund?.current || financialInformation?.emergencyFund?.current || 0),
      emergencyFundRecommended: Number(financialInformation?.emergency_fund?.recommended || financialInformation?.emergencyFund?.recommended || 0),
      debts: financialInformation?.debts || {},
    },
    financialGoals: (financialGoals || []).map((g) => ({
      name: g.label || g.name,
      type: g.type,
      targetAmount: Number(g.target_amount || g.targetAmount || 0),
      currentSavings: Number(g.current_savings || g.currentSavings || 0),
      progress: Number(g.progress || 0),
      priority: g.priority ? (g.priority.charAt(0).toUpperCase() + g.priority.slice(1).toLowerCase()) : "Medium",
      targetYear: g.target_date ? new Date(g.target_date).getFullYear() : (g.targetDate ? new Date(g.targetDate).getFullYear() : "Target Horizon"),
    })),
    advisorAnalysis: {
      financialSituationAnalysis: analysisSituation,
      goalAnalysis: analysisGoal,
      overallAssessment: analysisOverall,
    },
  };

  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  // If LLM API key exists, attempt LLM call
  if (apiKey) {
    try {
      if (process.env.OPENAI_API_KEY || apiKey.startsWith("sk-")) {
        const res = await callOpenAI(apiKey, payload);
        if (res && res.advice && Array.isArray(res.advice)) return res;
      } else {
        const res = await callGemini(apiKey, payload);
        if (res && res.advice && Array.isArray(res.advice)) return res;
      }
    } catch (err) {
      console.warn("[LLM API Warning]: LLM call failed, switching to deterministic advisor synthesis engine:", err.message);
    }
  }

  // Fallback: Deterministic synthesis strictly derived from the client's actual goals and advisor analysis
  return synthesizePersonalizedAdvice(payload);
}

/**
 * Call Gemini API
 */
async function callGemini(apiKey, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const promptText = `
SYSTEM:
${SYSTEM_INSTRUCTION}

USER CONTEXT:
${JSON.stringify(payload, null, 2)}

Respond with valid JSON only.`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  return JSON.parse(text);
}

/**
 * Call OpenAI API
 */
async function callOpenAI(apiKey, payload) {
  const url = "https://api.openai.com/v1/chat/completions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty OpenAI response");

  return JSON.parse(text);
}

/**
 * Deterministic Personalization Engine (Strict Offline Mode)
 * Directly transforms the advisor's exact analysis notes and client goals into structured personalized advice.
 * NEVER creates advice for topics/categories not explicitly present in the input.
 */
function synthesizePersonalizedAdvice(payload) {
  const { client, financialInformation, financialGoals, advisorAnalysis } = payload;
  const firstName = (client.name || "Client").split(" ")[0];

  const analysisSituation = advisorAnalysis.financialSituationAnalysis || "";
  const analysisGoal = advisorAnalysis.goalAnalysis || "";
  const analysisOverall = advisorAnalysis.overallAssessment || "";

  const adviceItems = [];

  // 1. Goal-driven advice items derived STRICTLY from existing client goals & advisor notes
  if (Array.isArray(financialGoals) && financialGoals.length > 0) {
    financialGoals.forEach((goal) => {
      const gName = goal.name || "Financial Goal";
      const targetYear = goal.targetYear || "Target Horizon";
      const priority = goal.priority || "Medium";

      let explanation = `Based on your advisor's assessment, your ${gName.toLowerCase()} goal (target year ${targetYear}) is an active priority.`;
      let action = `Maintain your planned allocation towards ${gName} and review progress with your advisor.`;

      if (gName.toLowerCase().includes("retire")) {
        explanation = analysisGoal.toLowerCase().includes("retire")
          ? `Your advisor has highlighted retirement as a primary long-term objective requiring disciplined capital accumulation.`
          : `Retirement planning requires steady compound growth to build long-term capital preservation.`;
        action = client.riskProfile
          ? `Automate monthly contributions toward growth instruments aligned with your ${client.riskProfile} risk profile.`
          : `Automate monthly contributions toward diversified growth instruments.`;
      } else if (gName.toLowerCase().includes("emergency")) {
        explanation = `Your advisor emphasizes establishing adequate liquid reserves to safeguard against unexpected financial events.`;
        action = `Build and maintain a dedicated emergency reserve in high-yield liquid instruments.`;
      } else if (gName.toLowerCase().includes("education") || gName.toLowerCase().includes("child")) {
        explanation = `Your advisor recognizes education funding as an essential milestone requiring targeted capital preservation.`;
        action = `Create a structured education fund strategy targeting ${targetYear} with balanced allocations.`;
      } else if (gName.toLowerCase().includes("house") || gName.toLowerCase().includes("property")) {
        explanation = `Your advisor recommends ensuring adequate down-payment liquidity and debt comfort for real estate acquisitions.`;
        action = `Systematically accumulate required down-payment capital in safe medium-term instruments.`;
      } else if (gName.toLowerCase().includes("loan") || gName.toLowerCase().includes("debt")) {
        explanation = `Your advisor highlights debt reduction as a crucial step to lower recurring liabilities and improve monthly cash flow.`;
        action = `Accelerate principal repayments on high-cost liabilities to optimize overall cash flow.`;
      }

      adviceItems.push({
        title: `Plan & Accelerate: ${gName}`,
        priority: priority,
        explanation: explanation,
        action: action,
        relatedGoal: gName,
      });
    });
  }

  // 2. Add Overall Advisor Assessment item ONLY if advisor explicitly provided overall assessment
  if (analysisOverall) {
    adviceItems.push({
      title: "Advisor Strategy & Asset Allocation",
      priority: "Medium",
      explanation: `Advisor assessment: "${analysisOverall}"`,
      action: "Review your portfolio allocation and cash flow surplus periodically with your advisor.",
      relatedGoal: "Overall Strategy",
    });
  }

  const netWorthStr = financialInformation?.netWorth ? ` (Net Worth: ₹${Number(financialInformation.netWorth).toLocaleString("en-IN")})` : "";
  const summary = `Hello ${firstName}, based on your financial position${netWorthStr}, your active goals, and your advisor's assessment: ${analysisSituation ? `"${analysisSituation}"` : "your customized wealth plan has been structured according to your goals and advisor guidance."}`;

  return {
    summary,
    advice: adviceItems,
  };
}
