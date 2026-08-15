import { AIRequestPurpose, UnifiedAIContext, AIPipelineRawResult } from './types';
import { RESPONSE_PROFILES, AIResponseProfile } from './profiles';
import { buildChatPrompt } from './prompts/chat';
import { buildGoalAnalysisPrompt } from './prompts/goalAnalysis';
import { buildPriorityAnalysisPrompt } from './prompts/priorityAnalysis';
import { buildPortfolioAnalysisPrompt } from './prompts/portfolioAnalysis';
import { buildRetirementAnalysisPrompt } from './prompts/retirementAnalysis';
import { buildDashboardInsightPrompt } from './prompts/dashboardInsight';
import { formatChatResponse } from './formatters/chatFormatter';
import { formatGoalResponse } from './formatters/goalFormatter';
import { formatPriorityResponse } from './formatters/priorityFormatter';
import { formatRetirementResponse } from './formatters/retirementFormatter';

export interface AIModuleDefinition {
  purpose: AIRequestPurpose;
  profile: AIResponseProfile;
  getRetrievalStrategy: (reqQuery?: string, context?: UnifiedAIContext) => { searchQuery: string; categoryFilter?: string };
  buildPrompt: (query: string, context: UnifiedAIContext, contextText: string) => { systemPrompt: string; fullPrompt: string };
  formatResponse: (req: any, rawResult: AIPipelineRawResult, context: UnifiedAIContext) => any;
}

export const AI_MODULE_REGISTRY: Record<AIRequestPurpose, AIModuleDefinition> = {
  chat: {
    purpose: 'chat',
    profile: RESPONSE_PROFILES.chat,
    getRetrievalStrategy: (reqQuery) => ({ searchQuery: reqQuery || '', categoryFilter: undefined }),
    buildPrompt: (query, context, contextText) => buildChatPrompt(query, context, contextText),
    formatResponse: (_req, raw) => formatChatResponse(raw)
  },
  'goal-analysis': {
    purpose: 'goal-analysis',
    profile: RESPONSE_PROFILES['goal-analysis'],
    getRetrievalStrategy: (_reqQuery, context) => {
      const gName = context?.selectedGoal?.name || 'goal';
      return { searchQuery: `goal shortfall risk mathematical options ${gName}`, categoryFilter: 'Goal' };
    },
    buildPrompt: (_query, context, contextText) => buildGoalAnalysisPrompt(context, contextText),
    formatResponse: (req, raw, context) => formatGoalResponse(req.goalId || context.selectedGoal?.id || '', raw, context.selectedGoal?.name)
  },
  'priority-analysis': {
    purpose: 'priority-analysis',
    profile: RESPONSE_PROFILES['priority-analysis'],
    getRetrievalStrategy: (_reqQuery, context) => {
      const recCat = context?.selectedRecommendation?.category || 'General';
      const categoryFilter = recCat === 'Debt Management' ? 'Debt' : recCat === 'Emergency Fund' ? 'Emergency Fund' : 'Asset Allocation';
      return {
        searchQuery: `priority action rule violation ${recCat} ${context?.selectedRecommendation?.alertMessage || ''}`,
        categoryFilter
      };
    },
    buildPrompt: (_query, context, contextText) => buildPriorityAnalysisPrompt(context, contextText),
    formatResponse: (req, raw, context) => formatPriorityResponse(
      req.recommendationId || context.selectedRecommendation?.id || '',
      context.selectedRecommendation?.alertMessage || '',
      raw
    )
  },
  'retirement-analysis': {
    purpose: 'retirement-analysis',
    profile: RESPONSE_PROFILES['retirement-analysis'],
    getRetrievalStrategy: () => ({ searchQuery: 'retirement longevity risk withdrawal sequence', categoryFilter: 'Retirement' }),
    buildPrompt: (_query, context, contextText) => buildRetirementAnalysisPrompt(context, contextText),
    formatResponse: (req, raw) => formatRetirementResponse(req.userId, raw)
  },
  'portfolio-analysis': {
    purpose: 'portfolio-analysis',
    profile: RESPONSE_PROFILES['portfolio-analysis'],
    getRetrievalStrategy: () => ({ searchQuery: 'portfolio asset allocation drift rebalancing', categoryFilter: 'Asset Allocation' }),
    buildPrompt: (_query, context, contextText) => buildPortfolioAnalysisPrompt(context, contextText),
    formatResponse: (_req, raw) => formatChatResponse(raw)
  },
  'dashboard-insight': {
    purpose: 'dashboard-insight',
    profile: RESPONSE_PROFILES['dashboard-insight'],
    getRetrievalStrategy: () => ({ searchQuery: 'wealth health score 7-pillar methodology', categoryFilter: undefined }),
    buildPrompt: (_query, context, contextText) => buildDashboardInsightPrompt(context, contextText),
    formatResponse: (_req, raw) => formatChatResponse(raw)
  }
};

export function getAIModule(purpose: AIRequestPurpose): AIModuleDefinition {
  const moduleDef = AI_MODULE_REGISTRY[purpose];
  if (!moduleDef) {
    throw new Error(`AI Module for purpose "${purpose}" is not registered in AI_MODULE_REGISTRY.`);
  }
  return moduleDef;
}
