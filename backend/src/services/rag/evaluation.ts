import { DocumentChunk } from './chunks';

export interface GoldenTestCase {
  id: string;
  query: string;
  expectedIntent: 'Educational' | 'Personal Advice' | 'Emergency Fund' | 'Debt & Cash Flow' | 'Retirement & Longevity' | 'Product & WHS Help';
  targetTopic: string;
  expectedKeywords: string[];
  mustNotContainClientData?: boolean;
}

export interface EvaluationResult {
  query: string;
  intent: string;
  precisionAtK: number;
  recallAtK: number;
  hitRate: number;
  mrr: number;
  retrievalLatencyMs: number;
  confidenceScore: number;
  passed: boolean;
}

export const GOLDEN_TEST_CASES: GoldenTestCase[] = [
  // 1. Emergency Fund
  {
    id: 'ef-01',
    query: 'How much emergency fund do I need?',
    expectedIntent: 'Emergency Fund',
    targetTopic: 'Emergency Fund',
    expectedKeywords: ['emergency', 'liquid', 'months', 'reserve', 'cash']
  },
  {
    id: 'ef-02',
    query: 'Where should I keep my emergency savings?',
    expectedIntent: 'Emergency Fund',
    targetTopic: 'Emergency Fund',
    expectedKeywords: ['liquid', 'high-yield', 'bank', 'savings', 'accessible']
  },

  // 2. Debt Management
  {
    id: 'debt-01',
    query: 'Should I pay debt or invest first?',
    expectedIntent: 'Debt & Cash Flow',
    targetTopic: 'Debt Management',
    expectedKeywords: ['avalanche', 'apr', 'high-interest', 'guaranteed', 'payoff']
  },
  {
    id: 'debt-02',
    query: 'What is the debt avalanche method?',
    expectedIntent: 'Educational',
    targetTopic: 'Debt Management',
    expectedKeywords: ['highest', 'apr', 'interest', 'avalanche', 'principal'],
    mustNotContainClientData: true
  },

  // 3. Retirement Planning
  {
    id: 'ret-01',
    query: 'How should I plan for retirement longevity?',
    expectedIntent: 'Retirement & Longevity',
    targetTopic: 'Retirement',
    expectedKeywords: ['longevity', 'horizon', 'tax-deferred', 'sequence', 'withdrawal']
  },
  {
    id: 'ret-02',
    query: 'What is retirement withdrawal sequencing?',
    expectedIntent: 'Educational',
    targetTopic: 'Retirement',
    expectedKeywords: ['taxable', 'tax-deferred', 'order', 'drawdown', 'tax-free'],
    mustNotContainClientData: true
  },

  // 4. Insurance & Protection
  {
    id: 'ins-01',
    query: 'Why is term life insurance recommended over whole life?',
    expectedIntent: 'Educational',
    targetTopic: 'Insurance',
    expectedKeywords: ['term', 'protection', 'premium', 'invest', 'pure'],
    mustNotContainClientData: true
  },

  // 5. Estate Planning
  {
    id: 'est-01',
    query: 'What is the purpose of estate planning and a will?',
    expectedIntent: 'Educational',
    targetTopic: 'Estate Plan',
    expectedKeywords: ['estate', 'will', 'beneficiary', 'transfer', 'assets'],
    mustNotContainClientData: true
  },

  // 6. Portfolio Management
  {
    id: 'port-01',
    query: 'How should I rebalance my portfolio when asset allocation drifts?',
    expectedIntent: 'Personal Advice',
    targetTopic: 'Portfolio Drift',
    expectedKeywords: ['rebalance', 'allocation', 'target', 'drift', 'risk']
  },

  // 7. Mutual Funds vs ETFs
  {
    id: 'mf-01',
    query: 'What is the difference between active mutual funds and index funds?',
    expectedIntent: 'Educational',
    targetTopic: 'Portfolio Drift',
    expectedKeywords: ['index', 'expense ratio', 'passive', 'diversification', 'returns'],
    mustNotContainClientData: true
  },

  // 8. Wealth Health Score
  {
    id: 'whs-01',
    query: 'How is my Wealth Health Score calculated?',
    expectedIntent: 'Product & WHS Help',
    targetTopic: 'General',
    expectedKeywords: ['wealth', 'score', 'pillar', 'edelman', 'weight', 'health']
  },

  // 9. Edelman 7-Pillar Methodology
  {
    id: 'edelman-01',
    query: 'What is the Edelman 7-Pillar Methodology?',
    expectedIntent: 'Educational',
    targetTopic: 'General',
    expectedKeywords: ['edelman', '7-pillar', 'emergency', 'debt', 'savings'],
    mustNotContainClientData: true
  },

  // 10. Financial Goal Planning
  {
    id: 'goal-01',
    query: 'How can I grow my net worth?',
    expectedIntent: 'Personal Advice',
    targetTopic: 'General',
    expectedKeywords: ['net worth', 'savings rate', 'growth', 'compound', 'assets']
  }
];

export class RAGEvaluator {
  /**
   * Evaluates Precision@K, Recall@K, Hit Rate, and MRR for retrieved chunks against expected test topic.
   */
  public evaluateRetrieval(
    testCase: GoldenTestCase,
    retrievedChunks: DocumentChunk[],
    latencyMs: number,
    k: number = 3
  ): EvaluationResult {
    const topK = retrievedChunks.slice(0, k);
    let hitCount = 0;
    let firstHitRank = 0;

    topK.forEach((chunk, index) => {
      const category = (chunk.metadata.category || '').toLowerCase();
      const text = chunk.text.toLowerCase();
      const targetLower = testCase.targetTopic.toLowerCase();

      const isTopicMatch = category.includes(targetLower) || targetLower.includes(category);
      const isKeywordMatch = testCase.expectedKeywords.some(kw => text.includes(kw.toLowerCase()));

      if (isTopicMatch || isKeywordMatch) {
        hitCount++;
        if (firstHitRank === 0) {
          firstHitRank = index + 1;
        }
      }
    });

    const precisionAtK = topK.length > 0 ? hitCount / topK.length : 0;
    const recallAtK = hitCount > 0 ? Math.min(1.0, hitCount / 2.0) : 0;
    const hitRate = hitCount > 0 ? 1.0 : 0;
    const mrr = firstHitRank > 0 ? 1.0 / firstHitRank : 0;
    const confidenceScore = Number((precisionAtK * 0.6 + mrr * 0.4).toFixed(2));

    const passed = hitRate > 0 && latencyMs < 2500;

    return {
      query: testCase.query,
      intent: testCase.expectedIntent,
      precisionAtK: Number(precisionAtK.toFixed(2)),
      recallAtK: Number(recallAtK.toFixed(2)),
      hitRate,
      mrr: Number(mrr.toFixed(2)),
      retrievalLatencyMs: latencyMs,
      confidenceScore,
      passed
    };
  }
}

export const ragEvaluator = new RAGEvaluator();
