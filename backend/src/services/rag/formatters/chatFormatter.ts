import { AIPipelineRawResult } from '../types';

export function formatChatResponse(raw: AIPipelineRawResult) {
  return {
    reply: raw.reply,
    suggestedFollowUps: raw.suggestedFollowUps,
    diagnostics: {
      confidenceScore: raw.confidenceScore,
      intent: raw.intent,
      latencyMs: raw.latencyMs,
      retrievedChunkIds: raw.retrievedChunks.map(c => c.id),
      sources: raw.sources
    },
    disclaimer: 'Advisory simulation only. Not financial advice.'
  };
}
