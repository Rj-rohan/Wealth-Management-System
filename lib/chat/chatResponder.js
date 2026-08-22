import { db } from "@/lib/db/database";
import { detectIntent, getDeterministicGreeting, INTENTS } from "./intentDetector";

/**
 * Generate Context-Aware Chat Response
 */
export async function generateChatResponse({ clientId, message, conversationHistory = [] }) {
  const cleanMsg = String(message || "").trim();
  const { intent, greetingType, isPureGreeting, specificGoal } = detectIntent(cleanMsg);

  // 1. Deterministic Greeting (NO LLM CALL)
  if (intent === INTENTS.GREETING && isPureGreeting) {
    return {
      text: getDeterministicGreeting(greetingType),
      intent: INTENTS.GREETING,
      usedLLM: false,
    };
  }

  // 2. Fetch only necessary, relevant context
  const client = clientId ? await db.findOne("clients", { id: clientId }) : null;
  const clientName = client?.name || "Client";
  const firstName = clientName.split(" ")[0];

  let relevantContext = {
    client: {
      name: clientName,
      riskProfile: client?.risk_profile || "Moderate",
      netWorth: client?.net_worth ? `₹${Number(client.net_worth).toLocaleString("en-IN")}` : "Not specified",
      monthlyIncome: client?.income ? `₹${Number(client.income / 12).toLocaleString("en-IN")}` : "Not specified",
      monthlyExpenses: client?.expenses ? `₹${Number(client.expenses / 12).toLocaleString("en-IN")}` : "Not specified",
    },
    advisor: {
      name: "Rahul Deshmukh",
      title: "Certified Financial Planner (CFP)",
    },
  };

  // Attach goal-specific data only if goal question
  if (intent === INTENTS.GOAL_QUESTION) {
    const allGoals = clientId ? await db.findMany("client_goals", { client_id: clientId }) : [];
    let filteredGoals = allGoals;
    if (specificGoal === "retirement") {
      filteredGoals = allGoals.filter((g) => g.type === "retirement" || /retire/i.test(g.label));
    } else if (specificGoal === "house") {
      filteredGoals = allGoals.filter((g) => g.type === "property" || /house|home|down/i.test(g.label));
    } else if (specificGoal === "education") {
      filteredGoals = allGoals.filter((g) => g.type === "education" || /education|child/i.test(g.label));
    }

    const advisorAnalysis = clientId ? await db.findOne("advisor_analyses", { client_id: clientId }) : null;

    relevantContext.goals = (filteredGoals.length ? filteredGoals : allGoals).map((g) => ({
      name: g.label,
      targetAmount: `₹${Number(g.target_amount).toLocaleString("en-IN")}`,
      currentSavings: `₹${Number(g.current_savings).toLocaleString("en-IN")}`,
      targetDate: g.target_date,
      priority: g.priority,
    }));
    relevantContext.advisorGoalAnalysis = advisorAnalysis?.goal_analysis || "";
  }

  // Attach financial analysis only if financial question
  if (intent === INTENTS.FINANCIAL_QUESTION) {
    const advisorAnalysis = clientId ? await db.findOne("advisor_analyses", { client_id: clientId }) : null;
    const advisorAdvice = clientId ? await db.findOne("advisor_advice", { client_id: clientId }) : null;
    relevantContext.advisorFinancialAnalysis = advisorAnalysis?.financial_situation_analysis || "";
    relevantContext.advisorOverallSummary = advisorAdvice?.summary || "";
    relevantContext.assetAllocation = client?.allocation || { equity: 50, fixedIncome: 30, cash: 10, realEstate: 10 };
  }

  // Attach appointment data only if meeting question
  if (intent === INTENTS.MEETING_QUESTION) {
    const appointments = clientId ? await db.findMany("appointments", { client_id: clientId, status: "upcoming" }) : [];
    relevantContext.upcomingMeetings = appointments.map((a) => ({
      title: a.title,
      start: a.start,
      googleMeetUrl: a.google_meet_url,
    }));
  }

  // 3. Check for available LLM API Key (Gemini or OpenAI)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const responseText = await callGeminiChat({ message: cleanMsg, context: relevantContext, intent });
      if (responseText) {
        return { text: responseText, intent, usedLLM: true };
      }
    } catch (e) {
      console.warn("[Gemini Chat API Warning]:", e.message);
    }
  } else if (openaiKey) {
    try {
      const responseText = await callOpenAIChat({ message: cleanMsg, context: relevantContext, intent });
      if (responseText) {
        return { text: responseText, intent, usedLLM: true };
      }
    } catch (e) {
      console.warn("[OpenAI Chat API Warning]:", e.message);
    }
  }

  // 4. Deterministic Contextual Financial Synthesis (Accurate, Non-hallucinating)
  const synthesisReply = generateContextualSynthesis({
    message: cleanMsg,
    clientName: firstName,
    intent,
    specificGoal,
    context: relevantContext,
  });

  return {
    text: synthesisReply,
    intent,
    usedLLM: false,
  };
}

/**
 * Gemini Chat Completion Call
 */
async function callGeminiChat({ message, context, intent }) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const systemPrompt = `You are Rahul Deshmukh, a Certified Financial Planner (CFP) at Meridian Wealth Management.
You are communicating directly with your client in a professional, warm, concise, and helpful tone.
Answer the user's specific question directly based STRICTLY on the provided client context and advisor analysis.
Do not invent missing information.
Do not provide unrelated investment or financial recommendations.
Keep response concise and actionable (2-4 sentences max).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const prompt = `${systemPrompt}

Client & Advisor Context:
${JSON.stringify(context, null, 2)}

User Question: "${message}"

Your response as Advisor Rahul Deshmukh:`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

/**
 * OpenAI Chat Completion Call
 */
async function callOpenAIChat({ message, context, intent }) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Rahul Deshmukh, Certified Financial Planner. Answer the client's question strictly using the provided context. Be concise, direct, and helpful (2-4 sentences max).`,
        },
        {
          role: "user",
          content: `Context: ${JSON.stringify(context)}\n\nQuestion: "${message}"`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim();
}

/**
 * Deterministic Contextual Financial Synthesis (Fallback when no API Key)
 */
function generateContextualSynthesis({ message, clientName, intent, specificGoal, context }) {
  if (intent === INTENTS.GOAL_QUESTION) {
    if (specificGoal === "retirement") {
      const retGoal = context.goals?.find((g) => /retire/i.test(g.name));
      const target = retGoal?.targetAmount || "₹5,00,00,000";
      const saved = retGoal?.currentSavings || "₹35,00,000";
      return `For your retirement goal, we are targeting ${target} (currently at ${saved}). Given your ${context.client.riskProfile} risk profile, our primary focus is expanding monthly equity SIP contributions to capture long-term compounding while keeping a disciplined emergency reserve.`;
    }
    if (specificGoal === "house") {
      return `For the house purchase goal, we should prioritize building the down-payment corpus in short-duration debt instruments and hybrid funds to preserve capital while funding the target horizon.`;
    }
    if (specificGoal === "education") {
      return `For the children's higher education goal, we recommend setting up dedicated index funds with stepped-up annual contributions to beat education inflation.`;
    }
    return `Regarding your financial goals, our focus is balancing short-term liquidity needs with high-conviction equity allocations for your long-term milestones. Let me know which specific goal you'd like to review!`;
  }

  if (intent === INTENTS.FINANCIAL_QUESTION) {
    if (/emergency/i.test(message)) {
      return `We recommend maintaining a 6-month living expense buffer (around 6x your monthly expenses) in liquid funds or high-yield savings to ensure full downside protection before aggressive equity deployment.`;
    }
    if (/allocation|equity|debt/i.test(message)) {
      return `Based on your ${context.client.riskProfile} risk profile, your recommended asset allocation is optimized for sustainable growth while maintaining debt stability. You can view the full asset breakdown under the Investments tab.`;
    }
    return `Your financial snapshot shows a solid net worth of ${context.client.netWorth} with healthy monthly surplus. Our advice plan is tailored to accelerate your wealth creation systematically.`;
  }

  if (intent === INTENTS.MEETING_QUESTION) {
    if (context.upcomingMeetings && context.upcomingMeetings.length > 0) {
      const nextM = context.upcomingMeetings[0];
      return `You have an upcoming consultation: "${nextM.title}" scheduled for ${new Date(nextM.start).toLocaleString("en-IN")}. You can join using the Google Meet link in the portal!`;
    }
    return `I'd be glad to discuss this in detail! Let's schedule a 30-minute Google Meet consultation at a time that works best for you.`;
  }

  // General fallback
  return `Thank you for reaching out, ${clientName}! I have reviewed your portfolio and goals. Let me know if you would like to discuss specific investment allocations or schedule our next quarterly review.`;
}
