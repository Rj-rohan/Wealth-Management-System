import { DocumentChunk } from './chunks';
import { ClientFinancialContext } from './engine';

export type AIRequestPurpose =
  | 'chat'
  | 'goal-analysis'
  | 'priority-analysis'
  | 'portfolio-analysis'
  | 'retirement-analysis'
  | 'dashboard-insight';

export type AIRequestIntent =
  | 'Explain'
  | 'Recommend'
  | 'Diagnose'
  | 'Compare'
  | 'Predict'
  | 'Optimize'
  | 'Summarize'
  | 'Troubleshoot';

export interface ChatMessageTurn {
  sender: 'user' | 'ai';
  text: string;
}

export interface UnifiedAIContext {
  userId: string;
  clientProfile?: ClientFinancialContext;
  selectedGoal?: {
    id: string;
    name: string;
    category: string;
    priority: string;
    targetAmount: number;
    targetYear: number;
    alreadySaved: number;
    monthlyContribution: number;
    shortfall: number;
    fundedPercentage: number;
    options?: {
      optionA_monthlySavings: number;
      optionB_presentCost: number;
      optionC_delayMonths: number;
    };
  };
  selectedRecommendation?: {
    id: string;
    category: string;
    priority: string;
    alertMessage: string;
    reason: string;
    expectedBenefit: string;
    action: string;
  };
  portfolioData?: any;
  retirementData?: any;
  chatHistory?: ChatMessageTurn[];
  currentPage?: string;
}

export interface AIPipelineRequest {
  purpose: AIRequestPurpose;
  userId: string;
  query?: string;
  goalId?: string;
  goalData?: any;
  goalOptions?: any;
  recommendationId?: string;
  recommendationData?: any;
  chatHistory?: ChatMessageTurn[];
  clientContext?: ClientFinancialContext;
  currentPage?: string;
}

export interface AIPipelineRawResult {
  reply: string;
  confidenceScore: number;
  intent: string;
  latencyMs: number;
  retrievedChunks: DocumentChunk[];
  sources: string[];
  suggestedFollowUps: string[];
}

export interface AIPipelineResult {
  purpose: AIRequestPurpose;
  intent: AIRequestIntent;
  formattedOutput: any;
  diagnostics: {
    confidenceScore: number;
    intent: string;
    retrievalLatencyMs: number;
    totalLatencyMs: number;
    retrievedChunkIds: string[];
    sources: string[];
  };
}
