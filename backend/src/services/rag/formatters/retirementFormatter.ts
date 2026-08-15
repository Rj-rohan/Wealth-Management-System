import { AIPipelineRawResult } from '../types';

export function formatRetirementResponse(userId: string, raw: AIPipelineRawResult) {
  return {
    user_id: userId,
    sections: [
      {
        title: 'Retirement Roadmap via Gemini RAG',
        content: raw.reply
      }
    ],
    disclaimer: 'Advisory simulation only. Recommendations are not trading orders and do not constitute financial advice.'
  };
}
