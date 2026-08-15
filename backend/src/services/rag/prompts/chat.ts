import { UnifiedAIContext } from '../types';

export function buildChatPrompt(userQuestion: string, context: UnifiedAIContext, contextText: string): { systemPrompt: string; fullPrompt: string } {
  const historyText = context.chatHistory && context.chatHistory.length > 0
    ? context.chatHistory.map(h => `${h.sender === 'user' ? 'User' : 'Advisor'}: ${h.text}`).join('\n')
    : 'No previous chat history.';

  const qLower = userQuestion.toLowerCase();

  // 1. Detect archetype intent from query
  let archetype = 'concept_definition';

  if (
    qLower.includes('evelyn') || qLower.includes('lillian') || qLower.includes('vandermark') ||
    qLower.includes('brown') || qLower.includes('penny dawson') || (qLower.includes('who is') && !qLower.includes('who is ric'))
  ) {
    archetype = 'case_study';
  } else if (
    /\bvs\b|\bversus\b|difference between|compared to|active or passive|taxable vs|roth vs|cakes or cupcakes|lump sum vs/i.test(qLower)
  ) {
    archetype = 'comparison';
  } else if (
    qLower.includes('how do i') || qLower.includes('how to') || qLower.includes('steps to') ||
    qLower.includes('calculate my') || qLower.includes('build a') || qLower.includes('how can i')
  ) {
    archetype = 'process_howto';
  } else if (
    qLower.includes('my score') || qLower.includes('my net worth') || qLower.includes('my wealth health score') ||
    qLower.includes('my pillars') || qLower.includes('my lowest scoring') || qLower.includes('my weakest') ||
    qLower.includes('my debt') || qLower.includes('my portfolio') || qLower.includes('my emergency fund')
  ) {
    archetype = 'personal_wealth';
  } else if (
    qLower.includes('should i') || qLower.includes('which should i') || qLower.includes('what should i choose') ||
    qLower.includes('recommend') || qLower.includes('how much emergency fund should i keep') || qLower.includes('which investment')
  ) {
    archetype = 'recommendation';
  } else if (
    qLower.includes('cabbie') || qLower.includes('pound cake') || qLower.includes('tulip') ||
    qLower.includes('cupcake') || qLower.includes('bill gates') || qLower.includes('ric edelman') ||
    qLower.includes('south sea') || qLower.includes('newton') || qLower.includes('3 option')
  ) {
    archetype = 'book_analogy';
  } else if (qLower.includes('why do') || qLower.includes('why is') || qLower.includes('why should') || qLower.includes('reasoning')) {
    archetype = 'analytical';
  }

  // 2. Build dynamic archetype-specific system prompt
  let archetypeInstruction = '';

  switch (archetype) {
    case 'case_study':
      archetypeInstruction = `
ADAPTIVE STYLE: STORYTELLING & CASE STUDY
- Introduce the person's story in 1-2 natural, conversational sentences (their goal, age, and context).
- Explain the core financial planning lesson demonstrated by their experience.
- Conclude with a warm, practical 1-sentence advisor takeaway.
- Do NOT use rigid section headers. Write fluid, engaging story prose.`;
      break;

    case 'comparison':
      archetypeInstruction = `
ADAPTIVE STYLE: COMPARISON & ADVISORY
- Begin with a warm 1-sentence conversational lead-in summarizing the core trade-off between the options.
- Provide a clean 3-column Markdown Comparison Table comparing both options:
  | Feature | Option A | Option B |
  | :--- | :--- | :--- |
  | **Strategy** | Option A strategy | Option B strategy |
  | **Costs & Fees** | Option A fees | Option B fees |
  | **Performance / Impact** | Option A impact | Option B impact |
- Conclude with a warm, practical advisor takeaway (1-2 sentences).`;
      break;

    case 'process_howto':
      archetypeInstruction = `
ADAPTIVE STYLE: SEQUENTIAL GUIDANCE
- Start with a direct, encouraging 1-sentence introduction to the task.
- Outline punchy, sequential steps (Step 1, Step 2, Step 3, Step 4).
- Conclude with a warm, actionable summary sentence.`;
      break;

    case 'personal_wealth':
      let subIntentRule = '';
      if (qLower.includes('net worth')) {
        subIntentRule = 'State Net Worth (₹2,27,200) in a warm opening sentence. Provide a short 2-line asset vs liability summary and 1 top priority action.';
      } else if (qLower.includes('lowest scoring') || qLower.includes('weakest pillar')) {
        subIntentRule = 'State lowest-scoring pillars (Savings Rate 0/100, Estate Plan 0/100) in sentence #1. Provide a short 2-bullet fix and top action.';
      } else if (qLower.includes('emergency fund') || qLower.includes('liquid')) {
        subIntentRule = 'State Emergency Reserve status (6.0 months active buffer) in sentence #1. Give direct liquid yield advice in 2 sentences.';
      } else if (qLower.includes('debt')) {
        subIntentRule = 'State Outstanding Credit Debt (₹45,000 at 21.99% APR) in sentence #1. Outline Debt Avalanche payoff in 2 sentences.';
      } else {
        subIntentRule = 'State Wealth Health Score (57/100 Caution) in sentence #1. Give concise pillar breakdown and top actions.';
      }

      archetypeInstruction = `
ADAPTIVE STYLE: PERSONAL WEALTH ADVICE
User Data: WHS ${context.clientProfile?.whsScore ?? 57}/100, Net Worth ₹${(context.clientProfile?.netWorth ?? 227200).toLocaleString('en-IN')}, Savings Rate ${context.clientProfile?.savingsRate ?? 0}%, Emergency Buffer ${context.clientProfile?.emergencyFundMonths ?? 6.0}mo, Debt ₹45k Credit Card (21.99% APR).
RULE: ${subIntentRule}
- Always answer the requested account metric in a warm, direct opening sentence.`;
      break;

    case 'recommendation':
      archetypeInstruction = `
ADAPTIVE STYLE: ADVISORY GUIDANCE
- State your clear recommendation directly in a warm opening sentence.
- Explain the underlying financial reasoning in 1 short, fluid paragraph.
- Mention key trade-offs and practical next steps naturally.`;
      break;

    case 'book_analogy':
      archetypeInstruction = `
ADAPTIVE STYLE: ANALOGY & WEALTH CONCEPT
- Introduce the analogy or concept in an engaging, vivid opening sentence.
- Explain the wealth-building lesson it teaches in 1 short, fluid paragraph.
- Do NOT add unsolicited personal account advice unless requested.`;
      break;

    case 'analytical':
      archetypeInstruction = `
ADAPTIVE STYLE: RATIONALE & ANALYTICAL
- Answer the core question directly in a warm opening sentence.
- Explain the market and risk principles clearly in fluid conversational prose.
- End with a clear financial takeaway.`;
      break;

    default: // concept_definition
      archetypeInstruction = `
ADAPTIVE STYLE: DEFINITION & CONTEXT
- Define the concept clearly in a warm opening sentence.
- Explain why it matters in practical terms in 1 short paragraph.
- Include a concrete monetary example (e.g. ₹50,000 monthly expenses = ₹3,00,000 emergency buffer) where applicable.`;
      break;
  }

  const systemPrompt = `
You are Senior Wealth Advisor at Weallth, providing expert, conversational financial guidance.

CORE RESPONSE QUALITY STANDARDS:
1. ANSWER FIRST: Always answer the user's exact question within the first 1-2 sentences before adding supporting context.
2. ZERO FILLER: Never use repetitive intro/outro filler phrases such as "strategic wealth guidance recommends", "it is important to note", "effective wealth strategy for", "in conclusion", "as an AI advisor", "regarding your query".
3. NO FORCED TEMPLATE HEADINGS: Do NOT force predefined section labels ("Direct Answer:", "Explanation:", "Key Principles:", "Practical Guidance:", "Key Takeaways:", "Recommended Actions:"). Write natural, fluid prose.
4. PROPORTIONAL DETAIL: Match response length strictly to query complexity (concise under 120 words for simple queries; proportional under 350 words for complex planning). Every paragraph must provide new information.
5. NO UNASKED ADVICE: For educational or book questions, explain the concept without adding unsolicited personal portfolio advice.
6. CONCRETE EXAMPLES: Use realistic monetary examples (₹) to ground explanations.
7. VARY PHRASING: Use diverse opening sentences, sentence structures, and transitions across turns so responses feel like an active human conversation.

${archetypeInstruction}
`;

  const fullPrompt = `${systemPrompt}

RECENT CHAT HISTORY:
${historyText}

RETRIEVED KNOWLEDGE CONTEXT:
${contextText}

USER QUESTION:
${userQuestion}

Answer the question directly, naturally, and conversationally:`;

  return { systemPrompt, fullPrompt };
}
