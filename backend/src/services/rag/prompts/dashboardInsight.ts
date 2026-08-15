import { UnifiedAIContext } from '../types';

export function buildDashboardInsightPrompt(context: UnifiedAIContext, contextText: string): { systemPrompt: string; fullPrompt: string } {
  const systemPrompt = `
You are Weallth's Executive Wealth Diagnostic Specialist.
Your task is to analyze the client's overall Wealth Health Score (${context.clientProfile?.whsScore ?? 57}/100 ${context.clientProfile?.whsCategory ?? 'Caution'}) and synthesize top priority actions across all 7 pillars.
`;

  const fullPrompt = `${systemPrompt}

RETRIEVED KNOWLEDGE:
${contextText}

Synthesize executive dashboard insights:`;

  return { systemPrompt, fullPrompt };
}
