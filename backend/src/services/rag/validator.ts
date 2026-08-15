import { AIPipelineRequest, AIRequestIntent, UnifiedAIContext } from './types';

export function validateInput(req: AIPipelineRequest): { isValid: boolean; error?: string } {
  if (!req.userId) {
    return { isValid: false, error: 'User ID is required for AI Request Pipeline execution.' };
  }

  if (req.purpose === 'chat' && (!req.query || !req.query.trim())) {
    return { isValid: false, error: 'Query text is required for chat purpose.' };
  }

  if (req.purpose === 'goal-analysis' && !req.goalId && !req.goalData) {
    return { isValid: false, error: 'Goal ID or Goal data is required for goal-analysis purpose.' };
  }

  if (req.purpose === 'priority-analysis' && !req.recommendationId && !req.recommendationData) {
    return { isValid: false, error: 'Recommendation ID or Recommendation data is required for priority-analysis purpose.' };
  }

  return { isValid: true };
}

export function detectIntentFromPurposeAndQuery(purpose: string, query?: string): AIRequestIntent {
  const q = (query || '').toLowerCase();

  if (q.includes('why') || q.includes('reason') || q.includes('cause') || q.includes('rule violation')) {
    return 'Diagnose';
  }
  if (q.includes('how can i') || q.includes('action') || q.includes('step') || q.includes('improve')) {
    return 'Optimize';
  }
  if (q.includes('compare') || q.includes('vs') || q.includes('difference')) {
    return 'Compare';
  }
  if (q.includes('what will happen') || q.includes('project') || q.includes('future')) {
    return 'Predict';
  }

  switch (purpose) {
    case 'goal-analysis':
      return 'Optimize';
    case 'priority-analysis':
      return 'Diagnose';
    case 'portfolio-analysis':
      return 'Compare';
    case 'retirement-analysis':
      return 'Predict';
    case 'dashboard-insight':
      return 'Summarize';
    case 'chat':
    default:
      return 'Explain';
  }
}

export function validateConfidence(confidenceScore: number, purpose: string): { isSufficient: boolean; fallbackReply?: string } {
  if (confidenceScore < 0.25 && purpose === 'chat') {
    return {
      isSufficient: false,
      fallbackReply: `I want to provide grounded, accurate financial guidance, but I couldn't find sufficient verified documentation in my knowledge base to answer with high confidence.

Could you clarify your question? You can ask me about:
• **Ric Edelman's 7-Pillar Methodology**
• **Emergency Fund calculation & liquid reserves**
• **Debt Avalanche payoff strategy**
• **Retirement longevity & withdrawal sequencing**
• **Wealth Health Score (WHS) calculation**`
    };
  }
  return { isSufficient: true };
}

export function validateGeneratedResponse(reply: string, context: UnifiedAIContext): { isValid: boolean; error?: string } {
  if (!reply || reply.trim().length < 20) {
    return { isValid: false, error: 'Generated response is empty or too short.' };
  }

  const rLower = reply.toLowerCase();
  const efMonths = context.clientProfile?.emergencyFundMonths ?? 0;

  // Contradiction Check: If user has 6 months emergency buffer, response must not tell them they lack emergency funds
  if (efMonths >= 6 && (rLower.includes('you need to build a 6-month') || rLower.includes('you have no emergency savings'))) {
    return { isValid: false, error: 'Contradiction detected: User already has a fully funded 6-month emergency buffer.' };
  }

  return { isValid: true };
}
