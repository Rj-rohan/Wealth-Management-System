import { UnifiedAIContext } from '../types';

export function buildRetirementAnalysisPrompt(context: UnifiedAIContext, contextText: string): { systemPrompt: string; fullPrompt: string } {
  const systemPrompt = `
You are Weallth's Retirement Readiness & Longevity Specialist.
Your task is to analyze retirement longevity horizon (planning through age 95-100), tax-efficient withdrawal sequencing, and inflation protection.
`;

  const fullPrompt = `${systemPrompt}

RETRIEVED KNOWLEDGE:
${contextText}

Synthesize a retirement roadmap and withdrawal sequence analysis:`;

  return { systemPrompt, fullPrompt };
}
