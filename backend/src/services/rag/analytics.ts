export interface AITelemetryRecord {
  purpose: string;
  intent: string;
  confidenceScore: number;
  totalLatencyMs: number;
  retrievalLatencyMs: number;
  timestamp: string;
  
  // New metrics for RAG Observability
  precision_at_3?: number;       // % of top-3 results that are relevant
  recall_at_5?: number;          // % of relevant docs retrieved in top-5
  hit_rate?: number;             // 1 if any relevant result, else 0
  mrr?: number;                  // Mean Reciprocal Rank (1/rank of first hit)
  cache_hit?: boolean;
  method?: string;               // vector | keyword | hybrid
}

export class AIAnalyticsTracker {
  private records: AITelemetryRecord[] = [];
  private feedbackLog: Array<{ messageIdx: number; type: 'up' | 'down'; timestamp: string }> = [];

  public logExecution(record: AITelemetryRecord): void {
    this.records.push(record);
    if (this.records.length > 500) {
      this.records.shift(); // Keep last 500 records
    }
  }

  public logFeedback(messageIdx: number, type: 'up' | 'down'): void {
    this.feedbackLog.push({ messageIdx, type, timestamp: new Date().toISOString() });
  }

  public getSummaryMetrics() {
    const totalRequests = this.records.length;
    if (totalRequests === 0) {
      return { totalRequests: 0, avgLatencyMs: 0, lowConfidenceCount: 0, feedbackUp: 0, feedbackDown: 0 };
    }

    const totalLatency = this.records.reduce((acc, r) => acc + r.totalLatencyMs, 0);
    const lowConfidenceCount = this.records.filter(r => r.confidenceScore < 0.3).length;
    const feedbackUp = this.feedbackLog.filter(f => f.type === 'up').length;
    const feedbackDown = this.feedbackLog.filter(f => f.type === 'down').length;

    // RAG specific aggregate metrics
    const ragRecords = this.records.filter(r => r.hit_rate !== undefined);
    const totalRag = ragRecords.length;
    let avg_precision_at_3 = 0, avg_mrr = 0, cache_hit_rate = 0, vector_fallback_rate = 0;
    
    if (totalRag > 0) {
      avg_precision_at_3 = ragRecords.reduce((acc, r) => acc + (r.precision_at_3 || 0), 0) / totalRag;
      avg_mrr = ragRecords.reduce((acc, r) => acc + (r.mrr || 0), 0) / totalRag;
      cache_hit_rate = ragRecords.filter(r => r.cache_hit).length / totalRag;
      vector_fallback_rate = ragRecords.filter(r => r.method?.includes('fallback')).length / totalRag;
    }

    return {
      totalRequests,
      avgLatencyMs: Math.round(totalLatency / totalRequests),
      lowConfidenceCount,
      feedbackUp,
      feedbackDown,
      ragMetrics: {
        avg_precision_at_3,
        avg_mrr,
        cache_hit_rate,
        vector_fallback_rate
      },
      purposeDistribution: this.getDistribution('purpose'),
      intentDistribution: this.getDistribution('intent')
    };
  }

  private getDistribution(key: 'purpose' | 'intent'): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of this.records) {
      const val = r[key];
      counts[val] = (counts[val] || 0) + 1;
    }
    return counts;
  }
}

export const aiAnalytics = new AIAnalyticsTracker();
