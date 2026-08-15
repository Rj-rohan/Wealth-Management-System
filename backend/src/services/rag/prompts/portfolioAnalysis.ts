import { UnifiedAIContext } from '../types';

export function buildPortfolioAnalysisPrompt(context: UnifiedAIContext, contextText: string): { systemPrompt: string; fullPrompt: string } {
  const systemPrompt = `
You are Weallth's Portfolio Strategy Specialist.
Your task is to analyze asset allocation drift, index vs active fund performance, and rebalancing bands.
`;

  const fullPrompt = `${systemPrompt}

RETRIEVED KNOWLEDGE:
${contextText}

Synthesize a portfolio rebalancing analysis:`;

  return { systemPrompt, fullPrompt };
}
