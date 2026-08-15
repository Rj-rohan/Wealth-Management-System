import { RetrievalResult } from './engine';
import { AIPipelineResult, AIPipelineRequest } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class AICacheManager {
  private retrievalCache = new Map<string, CacheEntry<RetrievalResult>>();
  private pipelineCache = new Map<string, CacheEntry<AIPipelineResult>>();
  private ttlMs = 15 * 60 * 1000; // 15 minutes TTL for free-tier optimization

  public getPipelineCacheKey(req: AIPipelineRequest): string {
    const subKey = req.goalId || req.recommendationId || (req.query ? req.query.toLowerCase().trim() : 'default');
    return `${req.purpose}_${req.userId || 'anon'}_${subKey}`;
  }

  public getCachedResponse(key: string): AIPipelineResult | null {
    const entry = this.pipelineCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.pipelineCache.delete(key);
      return null;
    }

    console.log(`[AI CACHE] Full Pipeline Cache Hit for key: "${key}"`);
    return entry.data;
  }

  public setCachedResponse(key: string, data: AIPipelineResult): void {
    this.pipelineCache.set(key, { data, timestamp: Date.now() });

    // Prune if cache grows large
    if (this.pipelineCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of this.pipelineCache.entries()) {
        if (now - v.timestamp > this.ttlMs) this.pipelineCache.delete(k);
      }
    }
  }

  public invalidateUser(userId: string): void {
    for (const key of this.pipelineCache.keys()) {
      if (key.includes(`_${userId}_`)) {
        this.pipelineCache.delete(key);
      }
    }
  }

  public getCachedRetrieval(query: string, categoryFilter?: string): RetrievalResult | null {
    const key = `${query.toLowerCase().trim()}_${categoryFilter || 'all'}`;
    const entry = this.retrievalCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.retrievalCache.delete(key);
      return null;
    }

    console.log(`[AI CACHE] Retrieval Cache Hit for query: "${query}"`);
    return entry.data;
  }

  public setCachedRetrieval(query: string, categoryFilter: string | undefined, data: RetrievalResult): void {
    const key = `${query.toLowerCase().trim()}_${categoryFilter || 'all'}`;
    this.retrievalCache.set(key, { data, timestamp: Date.now() });
  }

  public clear(): void {
    this.retrievalCache.clear();
    this.pipelineCache.clear();
  }
}

export const aiCache = new AICacheManager();
