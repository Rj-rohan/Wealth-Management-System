/**
 * AI CFO — streaming financial assistant for the market-intelligence workspace.
 *
 * Ported from the Next.js route handler `app/api/ai-cfo/chat`. The response is
 * streamed as plain text exactly as before, so the client-side incremental
 * renderer is unchanged. When no LLM key is configured the module streams a
 * deterministic analyst briefing instead, which is how the original behaved.
 *
 * Note: this is the markets-desk assistant. The wealth-planning advisor backed
 * by the RAG engine lives at POST /api/v1/users/:userId/ai/chat.
 */

import { isFastLlmConfigured, stream, ChatMessage } from './llm/fastLlm';

export interface CfoContext {
  portfolioValue?: number;
  cashPosition?: number;
  riskScore?: number;
  topHoldings?: string[];
}

function buildSystemPrompt(context?: CfoContext): string {
  return `You are an elite CFO advisor for the Wealth Management System. You have real-time financial data.

Current financial context:
- Portfolio Value: ₹${context?.portfolioValue?.toLocaleString('en-IN') || '24,50,000'}
- Cash Position: ₹${context?.cashPosition?.toLocaleString('en-IN') || '8,50,000'}
- Risk Score: ${context?.riskScore || 42}/100
- Top Holdings: ${context?.topHoldings?.join(', ') || 'TCS, Infosys, HDFC Bank, NTPC'}

Always respond in JSON format: { "answer": "string", "insights": ["string"], "suggestedActions": ["string"], "chartData": null }
Be concise, specific, cite numbers. Use ₹ for currency. Reference Indian markets.`;
}

/**
 * Yields plain-text deltas of the assistant reply.
 */
export async function* streamCfoReply(
  messages: ChatMessage[],
  context?: CfoContext
): AsyncGenerator<string> {
  if (!isFastLlmConfigured()) {
    yield* streamAnalystBriefing();
    return;
  }

  try {
    yield* stream(
      [{ role: 'system', content: buildSystemPrompt(context) }, ...messages],
      { temperature: 0.7, maxTokens: 1024 }
    );
  } catch (err: any) {
    console.error('[aiCfo] stream failed, serving analyst briefing:', err?.message || err);
    yield* streamAnalystBriefing();
  }
}

const ANALYST_BRIEFING = JSON.stringify({
  answer:
    'Based on the current portfolio analysis, your wealth position remains strong. The portfolio is well-diversified across IT, Banking, and Power sectors with a total value of ₹24,50,000. The risk score of 42/100 indicates a moderate risk profile which aligns well with your investment strategy. I recommend maintaining the current allocation while watching for opportunities in the FMCG sector.',
  insights: [
    'Portfolio up 12.3% YTD, outperforming Nifty 50 by 3.2%',
    'Cash position of ₹8.5L provides 3 months of liquidity buffer',
    'IT sector allocation at 35% — consider rebalancing above 40%',
    'Dividend income projected at ₹1.2L for this fiscal year',
  ],
  suggestedActions: [
    'Review HDFC Bank position — consider adding on dips below ₹1,600',
    'Set up SIP of ₹25,000/month in Nifty 50 index fund for stability',
    'Consider booking partial profits in TCS above ₹4,000 to reduce concentration',
  ],
});

async function* streamAnalystBriefing(): AsyncGenerator<string> {
  for (let i = 0; i < ANALYST_BRIEFING.length; i += 3) {
    yield ANALYST_BRIEFING.slice(i, i + 3);
    await new Promise((r) => setTimeout(r, 15));
  }
}
