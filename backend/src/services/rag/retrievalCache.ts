import * as crypto from 'crypto';
import { VectorSearchResult } from './vectorStore';

export interface CachedRetrieval {
  results: VectorSearchResult[];
  timestamp: number;
  confidenceScore: number;
}

class RetrievalCache {
  private cache = new Map<string, CachedRetrieval>();
  private defaultTtlMs = (Number(process.env.RETRIEVAL_CACHE_TTL_SECONDS) || 300) * 1000;

  private generateKey(query: string, categoryFilter?: string, additionalContext?: string): string {
    const rawKey = `${query}|${categoryFilter || ''}|${additionalContext || ''}`;
    return crypto.createHash('md5').update(rawKey).digest('hex');
  }

  public get(query: string, categoryFilter?: string, additionalContext?: string): CachedRetrieval | null {
    if (process.env.RETRIEVAL_ENABLE_CACHE === 'false') return null;
    
    const key = this.generateKey(query, categoryFilter, additionalContext);
    const entry = this.cache.get(key);
    
    if (entry) {
      if (Date.now() - entry.timestamp > this.defaultTtlMs) {
        this.cache.delete(key);
        return null;
      }
      return entry;
    }
    return null;
  }

  public set(query: string, results: VectorSearchResult[], confidenceScore: number, categoryFilter?: string, additionalContext?: string): void {
    if (process.env.RETRIEVAL_ENABLE_CACHE === 'false') return;
    
    const key = this.generateKey(query, categoryFilter, additionalContext);
    this.cache.set(key, {
      results,
      confidenceScore,
      timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const retrievalCache = new RetrievalCache();
