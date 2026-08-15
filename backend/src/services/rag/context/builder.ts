import { AIPipelineRequest, UnifiedAIContext } from '../types';

export function buildUnifiedContext(req: AIPipelineRequest): UnifiedAIContext {
  const { purpose, userId, goalData, goalOptions, recommendationData, clientContext, chatHistory, currentPage } = req;

  let selectedGoal: UnifiedAIContext['selectedGoal'] = undefined;
  if (goalData) {
    const targetAmt = goalData.target_amount || goalData.targetAmount || 0;
    const alreadySaved = goalData.already_saved || goalData.alreadySaved || 0;
    const fundedPercentage = targetAmt > 0 ? Math.min(100, Math.round((alreadySaved / targetAmt) * 100)) : 0;

    selectedGoal = {
      id: goalData.id || '',
      name: goalData.name || 'Financial Goal',
      category: goalData.category || 'General',
      priority: goalData.priority || 'Medium',
      targetAmount: targetAmt,
      targetYear: goalData.target_year || goalData.targetYear || 2030,
      alreadySaved,
      monthlyContribution: goalData.monthly_contribution || goalData.monthlyContribution || 0,
      shortfall: goalData.shortfall || 0,
      fundedPercentage,
      options: goalOptions ? {
        optionA_monthlySavings: goalOptions.option_a_required_monthly_savings || 0,
        optionB_presentCost: goalOptions.option_b_supported_present_cost || 0,
        optionC_delayMonths: goalOptions.option_c_delay_months || 0,
      } : undefined
    };
  }

  let selectedRecommendation: UnifiedAIContext['selectedRecommendation'] = undefined;
  if (recommendationData) {
    selectedRecommendation = {
      id: recommendationData.id || '',
      category: recommendationData.category || 'General',
      priority: recommendationData.priority || 'Medium',
      alertMessage: recommendationData.alert_message || recommendationData.alertMessage || '',
      reason: recommendationData.reason || '',
      expectedBenefit: recommendationData.expected_benefit || recommendationData.expectedBenefit || '',
      action: recommendationData.action || '',
    };
  }

  // Purpose-Based Memory Management: Only include chat history for conversational chat purpose or explicit memory purpose
  const includeMemory = purpose === 'chat';
  const filteredChatHistory = includeMemory ? (chatHistory || []).slice(-4) : undefined;

  return {
    userId,
    clientProfile: clientContext,
    selectedGoal,
    selectedRecommendation,
    chatHistory: filteredChatHistory,
    currentPage: currentPage || (purpose === 'goal-analysis' ? '/goals' : '/dashboard')
  };
}
