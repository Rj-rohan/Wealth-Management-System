/**
 * Lightweight Intent Detection Layer
 * Fast, deterministic classification before calling LLM.
 */

export const INTENTS = {
  GREETING: "greeting",
  FINANCIAL_QUESTION: "financial_question",
  GOAL_QUESTION: "goal_related_question",
  MEETING_QUESTION: "appointment_meeting_question",
  GENERAL_QUESTION: "general_question",
};

// Regex patterns for greetings
const GREETING_PATTERNS = [
  /^(hi|hii|hiii|hey|heyy|hello|helo|holla|namaste|yo|hola)\b/i,
  /^good\s*(morning|afternoon|evening|day|night)\b/i,
  /^(howdy|greetings|what'?s\s*up|sup)\b/i,
];

// Regex patterns for goal questions
const GOAL_PATTERNS = [
  /\b(retirement|retire|pension|fire)\b/i,
  /\b(house|home|property|flat|apartment|down\s*payment|downpayment)\b/i,
  /\b(child|children|kid|education|college|school|higher\s*studies)\b/i,
  /\b(goal|goals|target|milestone|ambition|horizon)\b/i,
];

// Regex patterns for financial & portfolio questions
const FINANCIAL_PATTERNS = [
  /\b(portfolio|allocation|asset\s*allocation|diversification)\b/i,
  /\b(equity|stock|stocks|mutual\s*fund|funds|sip|etf|index\s*fund)\b/i,
  /\b(debt|fixed\s*income|fd|bonds|ppf|epf|nps)\b/i,
  /\b(net\s*worth|assets|liabilities|loan|loans|emi|debt\s*ratio)\b/i,
  /\b(emergency\s*fund|liquidity|cash\s*buffer|savings|savings\s*rate)\b/i,
  /\b(risk|risk\s*profile|risk\s*tolerance|conservative|aggressive|moderate)\b/i,
  /\b(tax|tax\s*saving|80c|capital\s*gains|returns)\b/i,
];

// Regex patterns for appointment & meeting questions
const MEETING_PATTERNS = [
  /\b(meeting|meet|google\s*meet|call|consultation|session)\b/i,
  /\b(schedule|reschedule|book|appointment|calendar|slot|timing)\b/i,
  /\b(tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday|next\s*week)\b/i,
];

export function detectIntent(message = "") {
  const text = String(message).trim();
  if (!text) return { intent: INTENTS.GENERAL_QUESTION, details: {} };

  // 1. Check for pure/simple greetings
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(text)) {
      // Determine specific greeting subtype
      let greetingType = "general";
      if (/good\s*morning/i.test(text)) greetingType = "morning";
      else if (/good\s*afternoon/i.test(text)) greetingType = "afternoon";
      else if (/good\s*evening/i.test(text)) greetingType = "evening";

      return {
        intent: INTENTS.GREETING,
        greetingType,
        isPureGreeting: text.length < 35, // short greeting vs greeting + long question
      };
    }
  }

  // 2. Check for Goal-related questions
  for (const pattern of GOAL_PATTERNS) {
    if (pattern.test(text)) {
      let specificGoal = "general";
      if (/\b(retirement|retire|fire)\b/i.test(text)) specificGoal = "retirement";
      else if (/\b(house|home|property|down\s*payment)\b/i.test(text)) specificGoal = "house";
      else if (/\b(child|education|college)\b/i.test(text)) specificGoal = "education";

      return {
        intent: INTENTS.GOAL_QUESTION,
        specificGoal,
      };
    }
  }

  // 3. Check for Financial / Portfolio questions
  for (const pattern of FINANCIAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        intent: INTENTS.FINANCIAL_QUESTION,
      };
    }
  }

  // 4. Check for Meeting / Appointment questions
  for (const pattern of MEETING_PATTERNS) {
    if (pattern.test(text)) {
      return {
        intent: INTENTS.MEETING_QUESTION,
      };
    }
  }

  // 5. Default General Question
  return {
    intent: INTENTS.GENERAL_QUESTION,
  };
}

export function getDeterministicGreeting(greetingType = "general") {
  if (greetingType === "morning") {
    return "Good morning! How can I help you today?";
  }
  if (greetingType === "afternoon") {
    return "Good afternoon! How can I help you today?";
  }
  if (greetingType === "evening") {
    return "Good evening! How can I help you today?";
  }
  return "Hi! How can I help you today?";
}
