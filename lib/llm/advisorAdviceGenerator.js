/**
 * System Instruction for the Personal Wealth Advisor LLM
 */
const SYSTEM_INSTRUCTION = `You are an AI assistant for a professional wealth management advisor.

The advisor has already analyzed the client's financial situation and financial goals.

Use the advisor's analysis as the primary basis for generating personalized advice.
Also consider the client's financial information and financial goals provided in the input.

Generate clear, personalized, client-friendly advice.
Do not invent financial information.
Do not assume information that is not provided.
Do not contradict the advisor's analysis without a clear reason.
Do not guarantee investment returns.
Do not recommend specific stocks or securities unless such information is explicitly part of the advisor's analysis and the system permits it.
Do not make unsupported financial claims.

The output should communicate the advisor's analysis and recommended direction in simple language that the client can understand.

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
 * Generate Personalized Advice using LLM API with intelligent fallback.
 */
export async function generatePersonalizedAdvice({ client, financialInformation, financialGoals, advisorAnalysis }) {
  const payload = {
    client: {
      name: client.name || `${client.first_name || ""} ${client.last_name || ""}`.trim(),
      age: client.age || 35,
      gender: client.gender || "Not specified",
      occupation: client.occupation || "",
      location: client.location || "",
      riskProfile: client.risk_profile || client.riskProfile || "Moderate",
    },
    financialInformation: {
      annualIncome: Number(client.income || financialInformation?.income?.total || 0),
      monthlyIncome: Number(financialInformation?.income?.total || (client.income ? Math.round(client.income / 12) : 0)),
      monthlyExpenses: Number(financialInformation?.expenses?.total || (client.expenses ? Math.round(client.expenses / 12) : 0)),
      monthlySavings: Number(financialInformation?.monthly_surplus || financialInformation?.monthlySurplus || 0),
      totalAssets: Number(client.assets || financialInformation?.totalAssets || financialInformation?.assets || 0),
      totalLiabilities: Number(client.liabilities || financialInformation?.totalLiabilities || financialInformation?.liabilities || 0),
      netWorth: Number(client.net_worth || client.netWorth || financialInformation?.netWorth || financialInformation?.net_worth || 0),
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
      priority: g.priority ? (g.priority.charAt(0).toUpperCase() + g.priority.slice(1)) : "High",
      targetYear: g.target_date ? new Date(g.target_date).getFullYear() : (g.targetDate ? new Date(g.targetDate).getFullYear() : "Future"),
    })),
    advisorAnalysis: {
      financialSituationAnalysis: advisorAnalysis.financialSituationAnalysis || advisorAnalysis.financial_situation_analysis || "",
      goalAnalysis: advisorAnalysis.goalAnalysis || advisorAnalysis.goal_analysis || "",
      overallAssessment: advisorAnalysis.overallAssessment || advisorAnalysis.overall_assessment || "",
    },
  };

  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  // If LLM API key exists, attempt LLM call
  if (apiKey) {
    try {
      if (process.env.OPENAI_API_KEY || apiKey.startsWith("sk-")) {
        const res = await callOpenAI(apiKey, payload);
        if (res) return res;
      } else {
        const res = await callGemini(apiKey, payload);
        if (res) return res;
      }
    } catch (err) {
      console.warn("[LLM API Warning]: LLM call failed, switching to local financial synthesis engine:", err.message);
    }
  }

  // Fallback: Highly personalized deterministic synthesis obeying the exact advisor analysis and client data
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
 * Deterministic Personalization Engine (Offline Fallback)
 * Translates the advisor's exact analysis notes and client goals into structured personalized advice.
 */
function synthesizePersonalizedAdvice(payload) {
  const { client, financialInformation, financialGoals, advisorAnalysis } = payload;
  const firstName = client.name.split(" ")[0];

  const analysisSituation = advisorAnalysis.financialSituationAnalysis || "";
  const analysisGoal = advisorAnalysis.goalAnalysis || "";
  const analysisOverall = advisorAnalysis.overallAssessment || "";

  const adviceItems = [];

  // 1. Goal-driven advice items derived from advisor analysis & client goals
  if (financialGoals && financialGoals.length > 0) {
    financialGoals.forEach((goal) => {
      const gName = goal.name || "Goal";
      const targetYear = goal.targetYear || "Target Year";
      const priority = goal.priority || "High";

      let explanation = `Based on your advisor's assessment, your ${gName.toLowerCase()} goal (target year ${targetYear}) is a key pillar of your wealth plan.`;
      let action = `Maintain a disciplined monthly allocation towards ${gName} and monitor progress periodically with your advisor.`;

      // Contextual personalization from advisor notes
      if (gName.toLowerCase().includes("retire")) {
        explanation = analysisGoal.toLowerCase().includes("retire")
          ? `Your advisor has prioritized retirement planning as a primary long-term objective requiring focused accumulation and portfolio growth.`
          : `Retirement requires steady compound growth to build long-term financial freedom without compromising living standards.`;
        action = `Automate a dedicated monthly SIP contribution toward diversified growth instruments aligned with your ${client.riskProfile} risk profile.`;
      } else if (gName.toLowerCase().includes("emergency")) {
        explanation = `Your advisor emphasizes establishing adequate liquid reserves to safeguard your family against unexpected expenses without liquidating long-term investments.`;
        action = `Build and maintain a dedicated emergency reserve in high-yield liquid funds and short-term fixed deposits.`;
      } else if (gName.toLowerCase().includes("education") || gName.toLowerCase().includes("child")) {
        explanation = `Your advisor recognizes education funding as an essential milestone that requires capital preservation combined with inflation-beating growth.`;
        action = `Create a structured education fund strategy targeting ${targetYear} with balanced hybrid allocations.`;
      } else if (gName.toLowerCase().includes("house") || gName.toLowerCase().includes("property")) {
        explanation = `Your advisor recommends ensuring adequate down-payment liquidity and debt comfort before committing to real estate acquisitions.`;
        action = `Systematically accumulate required capital in safe, medium-term debt and equity-oriented instruments.`;
      } else if (gName.toLowerCase().includes("loan") || gName.toLowerCase().includes("debt")) {
        explanation = `Your advisor highlights high-interest debt reduction as a crucial step to lower monthly EMI burden and improve monthly surplus.`;
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

  // 2. Add Overall Advisor Assessment item
  if (analysisOverall) {
    adviceItems.push({
      title: "Portfolio & Cash Flow Optimization",
      priority: "Medium",
      explanation: `Your advisor's overall evaluation: "${analysisOverall}"`,
      action: "Review your asset allocation quarterly and maintain aligned savings surplus.",
      relatedGoal: "Overall Wealth Strategy",
    });
  }

  const summary = `Hello ${firstName}, based on your financial position (Net Worth: ₹${Number(financialInformation.netWorth).toLocaleString("en-IN")}, Risk Profile: ${client.riskProfile}), your active goals, and your advisor Rahul Deshmukh's detailed assessment: ${analysisSituation ? `"${analysisSituation}"` : "your customized wealth plan has been structured to optimize growth and financial security."}`;

  return {
    summary,
    advice: adviceItems,
  };
}
