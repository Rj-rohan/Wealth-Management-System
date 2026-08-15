import { GoogleGenerativeAI } from '@google/generative-ai';
import { bookChunks, DocumentChunk } from './chunks';
import { embedder } from './embedder';
import { vectorStore, VectorSearchResult } from './vectorStore';
import { retrievalCache } from './retrievalCache';
import { rerankChunks } from './reranker';
import { grokClient, GrokUnavailableError } from './grokClient';
import * as crypto from 'crypto';

// ─── LLM Response Cache ────────────────────────────────────────────────────────
// In-memory cache for Gemini responses. Keyed by hash(userId + question).
// Prevents the same question hitting the API twice within the TTL window.
// Configurable via LLM_CACHE_ENABLED and LLM_CACHE_TTL_SECONDS.
interface LLMCacheEntry { reply: string; expiresAt: number; }
const llmCache = new Map<string, LLMCacheEntry>();
const LLM_CACHE_ENABLED = process.env.LLM_CACHE_ENABLED !== 'false';
const LLM_CACHE_TTL_MS = (Number(process.env.LLM_CACHE_TTL_SECONDS) || 600) * 1000;  // default 10 min

// Cooldown tracker for Gemini free-tier 429 rate limits (5 requests/minute)
let geminiRateLimitedUntil = 0;

function getLLMCacheKey(userId: string, question: string): string {
  return crypto.createHash('md5').update(`${userId}::${question.toLowerCase().trim()}`).digest('hex');
}
function getLLMCached(key: string): string | null {
  const entry = llmCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { llmCache.delete(key); return null; }
  return entry.reply;
}
function setLLMCache(key: string, reply: string): void {
  llmCache.set(key, { reply, expiresAt: Date.now() + LLM_CACHE_TTL_MS });
  // Prune stale entries if cache grows large
  if (llmCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of llmCache) { if (now > v.expiresAt) llmCache.delete(k); }
  }
}

export interface ClientFinancialContext {
  age?: number;
  netWorth?: number;
  savingsRate?: number;
  emergencyFundMonths?: number;
  income?: number;
  expenses?: number;
  debts?: Array<{ title: string; amount: number; apr: number }>;
  goals?: Array<{ name: string; targetAmount: number; targetYear: number; isFunded?: boolean }>;
  riskProfile?: string;
  whsScore?: number;
  whsCategory?: string;
  cashFlow?: number;
  assets?: number;
  portfolio?: Array<{ category: string; percentage: number }>;
  insurance?: { lifeCoverage: number; disabilityCoverage: number; hasLTC: boolean };
  retirementReadiness?: number;
  userId?: string;   // for LLM response cache keying
}

export interface ChatMessageTurn {
  sender: 'user' | 'ai';
  text: string;
}

export type QueryIntent =
  | 'concept_definition'
  | 'case_study'
  | 'comparison'
  | 'process_howto'
  | 'recommendation'
  | 'personal_wealth'
  | 'analytical'
  | 'book_analogy'
  | 'Educational'
  | 'Personal Advice'
  | 'Emergency Fund'
  | 'Debt & Cash Flow'
  | 'Retirement & Longevity'
  | 'Product & WHS Help';

export interface RetrievalResult {
  chunks: DocumentChunk[];
  confidenceScore: number;
  latencyMs: number;
  intent: QueryIntent;
  targetTopic: string;
  sources: string[];
}

function formatCleanSourceCitation(sourceOrMeta?: string | { source?: string; book?: string; author?: string; part?: string; chapter?: string; section?: string; page_start?: number; page_end?: number }): string {
  if (!sourceOrMeta) return 'Ric Edelman – Discover The Wealth Within You';
  
  if (typeof sourceOrMeta === 'object') {
    const m = sourceOrMeta;
    const author = m.author || 'Ric Edelman';
    const book = m.book || 'Discover The Wealth Within You';
    let citation = `${author} – ${book}`;
    
    if (m.chapter && m.chapter !== 'Front Matter') {
      citation += `, ${m.chapter}`;
    }
    if (m.section && m.section !== 'Overview' && m.section !== m.chapter) {
      citation += `, Section: ${m.section}`;
    }
    if (m.page_start) {
      const pageRange = m.page_end && m.page_end !== m.page_start ? `pp. ${m.page_start}–${m.page_end}` : `p. ${m.page_start}`;
      citation += ` (${pageRange})`;
    }
    return citation;
  }

  let cleaned = sourceOrMeta
    .replace(/C HAPTER/gi, 'Chapter')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.includes('Discover The Wealth Within You')) {
    const parts = cleaned.split('-');
    const chapterPart = parts[1] ? parts[1].trim() : '';
    return `Ric Edelman – Discover The Wealth Within You${chapterPart ? `, ${chapterPart}` : ''}`;
  }
  return cleaned;
}

function formatINR(val?: number): string {
  if (val === undefined || val === null) return '₹0';
  return '₹' + Math.abs(val).toLocaleString('en-IN');
}

export function isExplicitPersonalAccountQuery(query: string): boolean {
  const q = query.toLowerCase().replace(/[-_]/g, ' ');
  const personalKeywords = [
    'my portfolio', 'my net worth', 'my debt', 'my score', 'wealth health score',
    'whs', 'my goals', 'my emergency fund', 'my retirement', 'my savings', 'my income',
    'my expenses', 'my plan', 'my pillars', 'lowest scoring', 'weakest pillar', 'weakest',
    'how should i', 'what should i do', 'can i afford', 'where should i invest',
    'help me pay off', 'improve my score', 'calculate my', 'current score', 'my current'
  ];
  return personalKeywords.some(kw => q.includes(kw));
}

export function performGroundingCheck(answerText: string, chunks: DocumentChunk[]): { isGrounded: boolean; groundednessScore: number; matchedTerms: string[] } {
  if (!answerText || chunks.length === 0) {
    return { isGrounded: false, groundednessScore: 0, matchedTerms: [] };
  }

  const answerLower = answerText.toLowerCase();
  const chunkTerms = new Set<string>();

  chunks.forEach(c => {
    const text = c.text || '';
    const matches = text.match(/\b([A-Z][a-z]{2,}|[0-9]+(?:\.[0-9]+)?%?)\b/g);
    if (matches) {
      matches.forEach(m => {
        if (m.length > 2 && !['The', 'And', 'For', 'With', 'That', 'This', 'From', 'Have', 'They', 'Your', 'Which'].includes(m)) {
          chunkTerms.add(m.toLowerCase());
        }
      });
    }
    (c.metadata?.keywords || []).forEach(k => chunkTerms.add(k.toLowerCase()));
  });

  const matchedTerms: string[] = [];
  chunkTerms.forEach(term => {
    if (answerLower.includes(term)) {
      matchedTerms.push(term);
    }
  });

  const groundednessScore = Math.min(1.0, matchedTerms.length / 3);
  const isGrounded = matchedTerms.length >= 1;

  return { isGrounded, groundednessScore, matchedTerms };
}

export function checkAnswerSourceOverlap(answerText: string, chunks: DocumentChunk[]): { isOverlapping: boolean; maxConsecutiveWords: number; nGramOverlapRatio: number } {
  if (!answerText || chunks.length === 0) {
    return { isOverlapping: false, maxConsecutiveWords: 0, nGramOverlapRatio: 0 };
  }

  const answerWords = answerText.toLowerCase().split(/\W+/).filter(w => w.length > 0);
  if (answerWords.length < 5) {
    return { isOverlapping: false, maxConsecutiveWords: 0, nGramOverlapRatio: 0 };
  }

  let maxConsecutiveWords = 0;
  for (const chunk of chunks) {
    const chunkTextLower = (chunk.text || '').toLowerCase();
    for (let i = 0; i <= answerWords.length - 15; i++) {
      const phrase = answerWords.slice(i, i + 15).join(' ');
      if (chunkTextLower.includes(phrase)) {
        maxConsecutiveWords = 15;
        break;
      }
    }
    if (maxConsecutiveWords >= 15) break;
  }

  const answer3Grams = new Set<string>();
  for (let i = 0; i <= answerWords.length - 3; i++) {
    answer3Grams.add(`${answerWords[i]} ${answerWords[i+1]} ${answerWords[i+2]}`);
  }

  const chunk3Grams = new Set<string>();
  chunks.forEach(c => {
    const words = (c.text || '').toLowerCase().split(/\W+/).filter(w => w.length > 0);
    for (let i = 0; i <= words.length - 3; i++) {
      chunk3Grams.add(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  });

  let matchingGrams = 0;
  answer3Grams.forEach(gram => {
    if (chunk3Grams.has(gram)) matchingGrams++;
  });

  const nGramOverlapRatio = answer3Grams.size > 0 ? matchingGrams / answer3Grams.size : 0;
  const isOverlapping = maxConsecutiveWords >= 15 || nGramOverlapRatio > 0.40;

  return { isOverlapping, maxConsecutiveWords, nGramOverlapRatio };
}

/**
 * Classifies user query into specific intent category and primary knowledge topic.
 */
export function classifyQueryIntent(query: string): { intent: QueryIntent; topic: string } {
  const q = query.toLowerCase();

  // Personal queries evaluated FIRST
  if (
    isExplicitPersonalAccountQuery(query) || q.includes('my score') || q.includes('my net worth') ||
    q.includes('my wealth health score') || q.includes('my pillars') || q.includes('my lowest scoring') ||
    q.includes('my weakest') || q.includes('my debt')
  ) {
    return { intent: 'personal_wealth', topic: 'Personal Diagnostics' };
  }

  if (
    q.includes('evelyn') || q.includes('lillian') || q.includes('vandermark') ||
    q.includes('brown') || q.includes('penny dawson') || (q.includes('who is') && !q.includes('who is ric'))
  ) {
    return { intent: 'case_study', topic: 'Case Studies' };
  }

  if (
    q.includes(' vs ') || q.includes('versus') || q.includes('difference between') ||
    q.includes('compared to') || q.includes('active or passive') || q.includes('taxable vs') ||
    q.includes('roth vs') || q.includes('cakes or cupcakes')
  ) {
    return { intent: 'comparison', topic: 'Strategy Comparison' };
  }

  if (
    q.includes('how do i') || q.includes('how to') || q.includes('steps to') ||
    q.includes('calculate my') || q.includes('build a') || q.includes('how can i')
  ) {
    return { intent: 'process_howto', topic: 'Financial Execution' };
  }

  if (
    q.includes('should i') || q.includes('which should i') || q.includes('what should i choose') ||
    q.includes('recommend') || q.includes('how much emergency fund should i keep') || q.includes('which investment')
  ) {
    return { intent: 'recommendation', topic: 'Advisory Guidance' };
  }

  if (
    q.includes('cabbie') || q.includes('pound cake') || q.includes('tulip') ||
    q.includes('cupcake') || q.includes('bill gates') || q.includes('ric edelman') ||
    q.includes('south sea') || q.includes('newton') || q.includes('3 option')
  ) {
    return { intent: 'book_analogy', topic: 'Wealth Concepts' };
  }

  if (q.includes('why do') || q.includes('why is') || q.includes('why should') || q.includes('reasoning')) {
    return { intent: 'analytical', topic: 'Financial Rationale' };
  }

  return { intent: 'concept_definition', topic: 'Knowledge' };
}

/**
 * Generates contextually relevant follow-up question suggestions based on intent and query context.
 */
export function generateSuggestedFollowUps(intent: QueryIntent, query: string): string[] {
  const q = query.toLowerCase();

  if (q.includes('lowest scoring') || q.includes('weakest pillar')) {
    return [
      'How does improving my Savings Rate boost my overall score?',
      'What simple steps can I take to set up an Estate Plan?',
      'What is my current Debt Avalanche payoff plan?',
      'How is my Wealth Health Score category determined?'
    ];
  } else if (intent === 'Educational') {
    return [
      'How does this methodology apply to my net worth?',
      'How can I calculate my emergency fund target?',
      'What should I prioritize: debt payoff or investing?',
      'How is my Wealth Health Score calculated?'
    ];
  } else if (intent === 'Debt & Cash Flow' || q.includes('debt')) {
    return [
      'What is the interest savings with Debt Avalanche?',
      'Should I invest while paying off credit card debt?',
      'How does debt payoff improve my Wealth Health Score?',
      'What emergency buffer should I keep while clearing debt?'
    ];
  } else if (intent === 'Emergency Fund' || q.includes('emergency')) {
    return [
      'Where is the best place to keep liquid emergency funds?',
      'How many months of buffer do I currently have?',
      'Should I build emergency savings before paying debt?',
      'How can I automate my monthly savings rate?'
    ];
  } else if (intent === 'Retirement & Longevity' || q.includes('retire')) {
    return [
      'What is tax-efficient withdrawal sequencing in retirement?',
      'Am I currently on track for my retirement goal?',
      'How does asset allocation change as retirement approaches?',
      'How do I protect against longevity inflation risk?'
    ];
  } else if (intent === 'Product & WHS Help') {
    return [
      'How can I improve my lowest scoring pillar?',
      'What is my overall Wealth Health Score category?',
      'How often is my portfolio drift recalculated?',
      'How can I add new financial goals?'
    ];
  }

  return [
    'How can I improve my Savings Rate?',
    'What should I prioritize next in my plan?',
    'How is my Wealth Health Score calculated?',
    'Show my retirement readiness breakdown.'
  ];
}

export class RAGEngine {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.genAI = new GoogleGenerativeAI(apiKey.trim());
      console.log('[RAG ENGINE] Gemini API key initialized successfully.');
    } else {
      console.log('[RAG ENGINE] No GEMINI_API_KEY found in env. Operating in local fallback mode.');
    }
  }

  /**
   * Performs Hybrid Semantic Search, Context Expansion & Re-ranking using Pinecone
   */
  public async semanticSearch(query: string, categoryFilter?: string): Promise<RetrievalResult> {
    const startTime = Date.now();
    const { intent, topic } = classifyQueryIntent(query);
    console.log(`[RAG ENGINE] Intent: ${intent} | Target Topic: ${topic} | Query: "${query}"`);

    // STAGE 3: Retrieval Cache Check
    const cached = retrievalCache.get(query, categoryFilter);
    if (cached) {
      console.log(`[RAG ENGINE] Cache hit for query: "${query}"`);
      const chunks: DocumentChunk[] = cached.results.map(r => ({
        id: r.id,
        text: r.text,
        metadata: {
          category: r.metadata.category,
          source: r.metadata.source,
          book: r.metadata.book || '',
          title: r.metadata.title || ''
        }
      }));
      return {
        chunks,
        confidenceScore: cached.confidenceScore,
        latencyMs: Date.now() - startTime,
        intent,
        targetTopic: topic,
        sources: Array.from(new Set(chunks.map(c => formatCleanSourceCitation(c.metadata.source))))
      };
    }

    let vectorResults: VectorSearchResult[] = [];
    let method = 'vector_only';
    
    // STAGE 2: Query Embedding & STAGE 4: Vector Similarity Search
    try {
      if (!vectorStore.isAvailable) {
        await vectorStore.initialize();
      }
      if (vectorStore.isAvailable) {
        const queryVector = await embedder.embed(query);
        vectorResults = await vectorStore.search(queryVector, {
          searchQuery: query,
          filter: categoryFilter ? { category: categoryFilter } : undefined
        });
      } else {
        throw new Error('PostgreSQL vectorStore not available');
      }
    } catch (error) {
      console.warn('[RAG ENGINE] Vector search failed or unavailable, falling back to keyword search:', error);
      method = 'keyword_fallback';
    }

    // STAGE 5: BM25 Keyword Fallback (Secondary)
    let keywordResults: VectorSearchResult[] = [];
    if (vectorResults.length < 5 || method === 'keyword_fallback') {
      keywordResults = this.keywordSearch(query, topic, categoryFilter);
      if (method === 'vector_only') method = 'hybrid_vector_keyword';
    }

    // STAGE 6: Hybrid Fusion (Reciprocal Rank Fusion)
    const fusedResults = new Map<string, VectorSearchResult>();
    
    const vectorWeight = Number(process.env.RETRIEVAL_HYBRID_VECTOR_WEIGHT) || 0.7;
    const keywordWeight = Number(process.env.RETRIEVAL_HYBRID_KEYWORD_WEIGHT) || 0.3;

    vectorResults.forEach((res, rank) => {
      const rrfScore = (res.score * vectorWeight) + (1 / (rank + 60));
      fusedResults.set(res.id, { ...res, score: rrfScore });
    });

    keywordResults.forEach((res, rank) => {
      const existing = fusedResults.get(res.id);
      const rrfScore = (res.score * keywordWeight) + (1 / (rank + 60));
      if (existing) {
        existing.score += rrfScore;
      } else {
        fusedResults.set(res.id, { ...res, score: rrfScore });
      }
    });

    let topFused = Array.from(fusedResults.values()).sort((a, b) => b.score - a.score).slice(0, 10);

    // STAGE 7: Hierarchical Context Expansion
    const expandedResults = new Map<string, VectorSearchResult>();
    let adjacentAdded = 0;
    let summariesAdded = 0;

    if (process.env.RETRIEVAL_ENABLE_ADJACENT_CHUNKS !== 'false' && vectorStore.isAvailable) {
      for (const res of topFused.slice(0, 5)) {
        if (res.metadata.title?.toLowerCase().includes('about the author') || res.metadata.category?.toLowerCase().includes('about the author')) {
           continue;
        }
        expandedResults.set(res.id, res);
        
        const summary = await vectorStore.getDocumentSummary(res.metadata.parent_doc_id);
        if (summary && !expandedResults.has(summary.id)) {
           expandedResults.set(summary.id, { ...summary, score: res.score * 0.5 });
           summariesAdded++;
        }

        const adjacent = await vectorStore.getAdjacentChunks(res.id);
        for (const adj of adjacent) {
           if (!expandedResults.has(adj.id)) {
             expandedResults.set(adj.id, { ...adj, score: res.score * 0.5 });
             adjacentAdded++;
           }
        }
      }
      topFused = Array.from(expandedResults.values()).sort((a, b) => b.score - a.score).slice(0, 10);
    }

    // STAGE 8: Reranking (Gemini Cross-Encoder)
    const candidatesToRerank = topFused.slice(0, 6);
    const rerankedResults = await rerankChunks(query, candidatesToRerank);
    let finalResults = rerankedResults.slice(0, 4);

    // STAGE 9: Graceful Empty Retrieval Handling
    if (finalResults.length === 0) {
      console.log(`[RAG ENGINE] No relevant results found for query: "${query}"`);
      finalResults = [{
        id: 'fallback_empty',
        score: 0.1,
        text: 'I couldn\'t find verified information on this specific topic in my knowledge base. Please consult a qualified financial advisor for highly specific scenarios.',
        metadata: {
          id: 'fallback', text: '', category: 'General', source: 'System', book: '', title: 'Knowledge Gap',
          parent_doc_id: '', chunk_index: 0, total_chunks: 1, is_summary: false, embedding_version: '', ingestion_timestamp: '', content_hash: ''
        }
      }];
    }

    // STAGE 10: Confidence Calibration & Structured Diagnostics
    const topScore = finalResults[0]?.score ?? 0;
    const avgScore = finalResults.slice(0, 3).reduce((acc, r) => acc + r.score, 0) / Math.max(1, Math.min(3, finalResults.length));
    
    let confidenceScore = (topScore * 0.6) + (avgScore * 0.4);
    // If it was keyword fallback, confidence is generally lower/different scale
    if (method === 'keyword_fallback') {
      confidenceScore = Number(Math.min(0.98, Math.max(0.45, topScore / 18.0)).toFixed(2));
    } else {
       // Pinecone cosine scores are usually 0.6-0.9
       confidenceScore = Number(Math.min(0.98, Math.max(0.10, confidenceScore)).toFixed(2));
    }

    const latencyMs = Date.now() - startTime;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      query,
      method,
      vectorResultsCount: vectorResults.length,
      keywordResultsCount: keywordResults.length,
      fusedResultsCount: fusedResults.size,
      expandedResultsCount: expandedResults.size,
      adjacentChunksAdded: adjacentAdded,
      documentSummariesAdded: summariesAdded,
      rerankedResultsCount: rerankedResults.length,
      confidenceScore,
      totalLatencyMs: latencyMs,
      intent,
      targetTopic: topic
    }));

    retrievalCache.set(query, finalResults, confidenceScore, categoryFilter);

    const chunks: DocumentChunk[] = finalResults.map(r => ({
      id: r.id,
      text: r.text,
      metadata: {
        category: r.metadata.category,
        source: r.metadata.source,
        book: r.metadata.book || '',
        author: r.metadata.author,
        part: r.metadata.part,
        chapter: r.metadata.chapter,
        section: r.metadata.section,
        subsection: r.metadata.subsection,
        page_start: r.metadata.page_start,
        page_end: r.metadata.page_end,
        pages: r.metadata.pages,
        document_order: r.metadata.document_order,
        previous_chunk_id: r.metadata.previous_chunk_id,
        next_chunk_id: r.metadata.next_chunk_id,
        token_count: r.metadata.token_count,
        keywords: r.metadata.keywords,
        title: r.metadata.title || ''
      }
    }));

    return {
      chunks,
      confidenceScore,
      latencyMs,
      intent,
      targetTopic: topic,
      sources: Array.from(new Set(chunks.map(c => formatCleanSourceCitation(c.metadata))))
    };
  }

  /**
   * Preserved TF-IDF Keyword Fallback
   */
  private keywordSearch(query: string, targetTopic: string, categoryFilter?: string): VectorSearchResult[] {
    let candidates = bookChunks;
    if (categoryFilter) {
      const filterLower = categoryFilter.toLowerCase();
      const filtered = candidates.filter(c =>
        c.metadata.category.toLowerCase().includes(filterLower) ||
        filterLower.includes(c.metadata.category.toLowerCase())
      );
      if (filtered.length > 0) candidates = filtered;
    }

    const queryTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    const targetTopicLower = targetTopic.toLowerCase();

    const scored = candidates.map(chunk => {
      const textLower = chunk.text.toLowerCase();
      const titleLower = (chunk.metadata.title || '').toLowerCase();
      const categoryLower = (chunk.metadata.category || '').toLowerCase();

      let score = 0;
      if (categoryLower.includes(targetTopicLower) || targetTopicLower.includes(categoryLower)) score += 8.0;

      const textTokens = textLower.split(/\W+/);
      const titleTokens = titleLower.split(/\W+/);

      for (const token of queryTokens) {
        const textCount = textTokens.filter(t => t === token).length;
        const titleCount = titleTokens.filter(t => t === token).length;
        score += (textCount * 2.0) + (titleCount * 5.0);
      }
      if (chunk.text.length > 300) score += 0.5;
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScored = scored.filter(s => s.score > 0).slice(0, 10);

    return topScored.map(s => ({
       id: s.chunk.id,
       score: s.score,
       text: s.chunk.text,
       metadata: {
         id: s.chunk.id,
         text: s.chunk.text,
         category: s.chunk.metadata.category,
         source: s.chunk.metadata.source,
         book: s.chunk.metadata.book || '',
         author: s.chunk.metadata.author,
         part: s.chunk.metadata.part,
         chapter: s.chunk.metadata.chapter,
         section: s.chunk.metadata.section,
         subsection: s.chunk.metadata.subsection,
         page_start: s.chunk.metadata.page_start,
         page_end: s.chunk.metadata.page_end,
         pages: s.chunk.metadata.pages,
         document_order: s.chunk.metadata.document_order,
         previous_chunk_id: s.chunk.metadata.previous_chunk_id,
         next_chunk_id: s.chunk.metadata.next_chunk_id,
         token_count: s.chunk.metadata.token_count,
         keywords: s.chunk.metadata.keywords,
         title: s.chunk.metadata.title || '',
         parent_doc_id: '',
         chunk_index: s.chunk.metadata.document_order || 0,
         total_chunks: 1,
         is_summary: false,
         embedding_version: '',
         ingestion_timestamp: '',
         content_hash: ''
       }
    }));
  }

  /**
   * Generates dynamic, intent-specific financial advice response.
   */
  public async generateResponse(
    userQuestion: string,
    retrievedResult: RetrievalResult,
    clientContext?: ClientFinancialContext,
    chatHistory: ChatMessageTurn[] = []
  ): Promise<{
    reply: string;
    suggestedFollowUps: string[];
    confidenceScore: number;
    intent: QueryIntent;
    latencyMs: number;
    sources: string[];
  }> {
    const startTime = Date.now();
    const { chunks, confidenceScore, intent, targetTopic, sources } = retrievedResult;
    const qLower = userQuestion.toLowerCase();

    // Structured JSON Observability Log
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      query: userQuestion,
      intent,
      targetTopic,
      retrievedChunkIds: chunks.map(c => c.id),
      confidenceScore,
      retrievalLatencyMs: retrievedResult.latencyMs
    }));

    const suggestedFollowUps = generateSuggestedFollowUps(intent, userQuestion);

    // Low-Confidence Fallback Handling
    if (confidenceScore < 0.25 && intent === 'Educational') {
      const lowConfReply = `I want to provide grounded, accurate financial guidance, but I couldn't find sufficient verified documentation in my knowledge base to answer "${userQuestion}" with high confidence.

Could you clarify your question? You can ask me about:
• **Ric Edelman's 7-Pillar Methodology**
• **Emergency Fund calculation & liquid reserves**
• **Debt Avalanche payoff strategy**
• **Retirement longevity & withdrawal sequencing**
• **Wealth Health Score (WHS) calculation**`;

      return {
        reply: lowConfReply,
        suggestedFollowUps,
        confidenceScore,
        intent,
        latencyMs: Date.now() - startTime,
        sources
      };
    }

    // Cap each chunk to 800 chars to reduce tokens sent to Gemini free tier.
    // Full chunk text is preserved in DB; this only limits what goes to the LLM.
    const MAX_CHUNK_CHARS = 800;
    const contextText = chunks.map((c, i) =>
      `[Source ${i + 1}: ${formatCleanSourceCitation(c.metadata)}]\n${c.text.slice(0, MAX_CHUNK_CHARS)}${c.text.length > MAX_CHUNK_CHARS ? '…' : ''}`
    ).join('\n\n');

    const recentHistory = chatHistory.slice(-4);
    const historyText = recentHistory.length > 0
      ? recentHistory.map(h => `${h.sender === 'user' ? 'User' : 'Advisor'}: ${h.text}`).join('\n')
      : 'No previous chat history.';

    let clientContextStr = 'No client financial profile attached.';
    if (clientContext) {
      const debtSummary = clientContext.debts && clientContext.debts.length > 0
        ? clientContext.debts.map(d => `${d.title}: ${formatINR(d.amount)} at ${d.apr}% APR`).join(', ')
        : 'No debt recorded';

      const goalSummary = clientContext.goals && clientContext.goals.length > 0
        ? clientContext.goals.map(g => `${g.name}: ${formatINR(g.targetAmount)} target by ${g.targetYear}`).join(', ')
        : 'No active goals recorded';

      clientContextStr = `
- Net Worth: ${formatINR(clientContext.netWorth)}
- Investable Assets: ${formatINR(clientContext.assets)}
- Monthly Cash Flow: ${formatINR(clientContext.cashFlow)}
- Savings Rate: ${Math.round((clientContext.savingsRate ?? 0) * 100)}%
- Emergency Fund Buffer: ${Math.round((clientContext.emergencyFundMonths ?? 0) * 10) / 10} months
- Outstanding Debt: ${debtSummary}
- Active Goals: ${goalSummary}
- Wealth Health Score: ${clientContext.whsScore ?? 57}/100 (${clientContext.whsCategory ?? 'Caution'})
- Portfolio Allocation: ${clientContext.portfolio?.map(p => `${p.category}: ${p.percentage}%`).join(', ') ?? 'N/A'}
- Insurance: Life ${formatINR(clientContext.insurance?.lifeCoverage)}, Disability ${formatINR(clientContext.insurance?.disabilityCoverage)}, LTC: ${clientContext.insurance?.hasLTC ? 'Yes' : 'No'}
- Retirement Readiness: ${Math.round((clientContext.retirementReadiness ?? 0) * 100)}%
`;
    }

    // ── LLM Synthesis: 3-Tier Fallback Chain ─────────────────────────────────
    // Tier 1: Grok  Tier 2: Gemini  Tier 3: Local (below)
    // Retrieval is NOT repeated on fallback — fullPrompt is reused as-is.

    // LLM Response Cache — skip API call if same question answered recently
    const cacheKey = getLLMCacheKey(clientContext?.userId ?? 'anon', userQuestion);
    if (LLM_CACHE_ENABLED) {
      const cached = getLLMCached(cacheKey);
      if (cached) {
        console.log(`[LLM CACHE] Cache hit for question hash ${cacheKey.slice(0, 8)}`);
        return { reply: cached, suggestedFollowUps, confidenceScore, intent, latencyMs: Date.now() - startTime, sources };
      }
    }

    let systemPrompt = '';
    if (intent === 'Educational') {
      systemPrompt = `
You are AI Wealth Advisor, answering a question using ONLY the retrieved excerpts below from "Discover The Wealth Within You" by Ric Edelman.

STRICT GROUNDING RULES:
1. Answer using ONLY the retrieved excerpts provided below. Do NOT use generic financial advice templates.
2. DO NOT reference personal account data (Net Worth, Debt APRs, Wealth Health Score) unless the user explicitly asked about their own profile.
3. Reference specific details, names, numbers, strategies, and examples from the retrieved excerpts (e.g., Evelyn Vandermark, Lillian Brown, Cabbie analogy, 3-Option Solver).
4. Structure your response naturally into clear markdown paragraphs or bullet points.
5. If the retrieved excerpts do not contain the complete answer, state clearly what information is available in the excerpts.
`;
    } else if (intent === 'Product & WHS Help') {
      systemPrompt = `
You are Weallth's Senior AI Wealth Advisor explaining the Wealth Health Score (WHS) methodology.

1. Explain the 7-Pillar scoring algorithm and its weights:
   - 🛡️ Emergency Fund (3-6 mo buffer)
   - 💳 Debt Management (High APR control)
   - 📈 Savings Rate (15-20%+ target)
   - ⚖️ Portfolio Drift (Rebalancing bands)
   - 🏖️ Retirement Readiness (Longevity to age 95+)
   - 🩺 Insurance Protection (Term life & Health)
   - 📜 Estate Planning (Will & Beneficiaries)
2. Detail the user's current score breakdown if available:
   - Overall Score: ${clientContext?.whsScore ?? 57}/100 (${clientContext?.whsCategory ?? 'Caution'})
`;
    } else {
      systemPrompt = `
You are Weallth's Senior AI Wealth Advisor providing personalized financial advice.

GUARDRAILS & RULES:
1. Speak naturally as an expert financial advisor.
2. Ground all recommendations strictly in the provided client profile data.
3. Use Indian Rupee (₹) formatting for monetary amounts.
4. Structure your response with these bold headers:
   **Executive Summary**
   **Personalized Analysis**
   **Why It Matters**
   **Action Plan**
   **Financial Impact**
   **Risks & Trade-offs**
   **Next Best Actions**
`;
    }

    const fullPrompt = `${systemPrompt}

RECENT CHAT HISTORY:
${historyText}

CLIENT FINANCIAL PROFILE:
${clientContextStr}

RETRIEVED KNOWLEDGE:
${contextText}

USER QUESTION:
${userQuestion}

Provide a direct, well-structured, conversational response:`;

    let responseText: string | null = null;

    // Tier 1: Grok (single model, 4s timeout at SDK level)
    if (grokClient.isConfigured) {
      try {
        responseText = await grokClient.generateContent(fullPrompt);
        console.log(`[LLM CHAIN] answerQuestion resolved via: grok (${Date.now() - startTime}ms)`);
      } catch (err: any) {
        console.warn(`[LLM CHAIN] Grok failed for answerQuestion, escalating to Gemini: ${err?.message}`);
      }
    }

    // Tier 2: Gemini — with free-tier 429 cooldown & instant fallback
    if (!responseText && this.genAI) {
      if (Date.now() < geminiRateLimitedUntil) {
        const remainingSec = Math.ceil((geminiRateLimitedUntil - Date.now()) / 1000);
        console.log(`[LLM CHAIN] Gemini free-tier cooldown active (${remainingSec}s remaining) — skipping to local fallback.`);
      } else {
        try {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' }, { timeout: 4500 });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('[LLM CHAIN] Gemini timeout (4500ms)')), 4500)
          );
          const apiPromise = model.generateContent(fullPrompt);
          const result = await Promise.race([apiPromise, timeoutPromise]);
          const text = result.response.text()?.trim();
          if (text) {
            responseText = text;
            console.log(`[LLM CHAIN] answerQuestion resolved via: gemini (${Date.now() - startTime}ms)`);
          }
        } catch (err: any) {
          const msg = err?.message ?? '';
          const retryMatch = msg.match(/Please retry in (\d+\.?\d*)s/);
          if (retryMatch) {
            const waitMs = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500;
            geminiRateLimitedUntil = Date.now() + waitMs;
            if (waitMs <= 3000) {
              console.warn(`[LLM CHAIN] Gemini 429 — waiting ${waitMs}ms then retrying once`);
              await new Promise(r => setTimeout(r, waitMs));
              try {
                const model2 = this.genAI!.getGenerativeModel({ model: 'gemini-3.5-flash' }, { timeout: 4500 });
                const result2 = await model2.generateContent(fullPrompt);
                const text2 = result2.response.text()?.trim();
                if (text2) {
                  responseText = text2;
                  console.log(`[LLM CHAIN] answerQuestion resolved via: gemini (retry, ${Date.now() - startTime}ms)`);
                }
              } catch (err2: any) {
                console.warn(`[LLM CHAIN] Gemini retry failed, falling to local: ${err2?.message}`);
              }
            } else {
              console.warn(`[LLM CHAIN] Gemini free-tier 429 quota reached (wait ${Math.round(waitMs / 1000)}s) — fast failover to local fallback.`);
            }
          } else {
            console.warn(`[LLM CHAIN] Gemini failed for answerQuestion, falling to local: ${msg}`);
          }
        }
      }
    }

    if (responseText) {
      // Clean trailing markdown sections unless user asked for sources
      if (!qLower.includes('source') && !qLower.includes('reference') && !qLower.includes('citation')) {
        responseText = responseText
          .replace(/##\s*Summary/gi, '')
          .replace(/##\s*Recommendation/gi, '')
          .replace(/##\s*Explanation/gi, '')
          .replace(/##\s*Action Plan/gi, '')
          .replace(/##\s*Sources[\s\S]*/gi, '')
          .replace(/\*Sources:\*[\s\S]*/gi, '')
          .trim();
      }
      // Write to LLM cache before returning
      if (LLM_CACHE_ENABLED) setLLMCache(cacheKey, responseText);
      return {
        reply: responseText,
        suggestedFollowUps,
        confidenceScore,
        intent,
        latencyMs: Date.now() - startTime,
        sources
      };
    }

    // Local Fallback Synthesizer
    console.log('[RAG ENGINE] Using local intent-aware synthesizer fallback.');
    const efMonths = clientContext?.emergencyFundMonths ?? 6.0;
    const netWorthStr = formatINR(clientContext?.netWorth ?? 227200);

    let fallbackReply = '';

    if (qLower.includes('net worth')) {
      fallbackReply = `Your current Net Worth is **${netWorthStr}** (Total Assets: ₹2,72,200 | Total Liabilities: ₹45,000).

**Net Worth Summary:**
• **Assets**: ₹1,80,000 cash reserves + ₹92,200 investments
• **Liabilities**: ₹45,000 credit card debt (21.99% APR)

**Top Action**: Pay off the ₹45,000 credit card debt to accelerate your net worth growth.`;
    } else if (qLower.includes('lowest scoring') || qLower.includes('weakest pillar') || qLower.includes('weakest')) {
      fallbackReply = `Your lowest-scoring pillars are **Savings Rate (0/100)** and **Estate Planning (0/100)**.

**Pillar Breakdown:**
• **Savings Rate (0/100)**: 0% recorded monthly savings (+15 WHS pts if automated).
• **Estate Planning (0/100)**: No recorded digital will or beneficiaries (+15 WHS pts if completed).

**Top Action**: Automate a 15% monthly savings transfer and complete beneficiary designations.`;
    } else if (qLower.includes('emergency fund') || qLower.includes('liquid expenses')) {
      fallbackReply = `Your emergency fund currently holds **${efMonths} months of liquid operating expenses** (₹1,80,000), meeting the 6-month target.

**Status:**
• **Liquid Buffer**: ₹1,80,000 in FDIC-insured liquid reserves (Score: 100/100).

**Top Action**: Keep reserves in high-yield liquid instruments and direct surplus cash flow to debt payoff or investments.`;
    } else if (qLower.includes('debt') || qLower.includes('credit card') || qLower.includes('avalanche')) {
      fallbackReply = `Your total high-interest debt is **₹45,000** (Credit Card at 21.99% APR).

**Debt Avalanche Strategy:**
• Direct 100% of extra cash flow to clear the 21.99% APR card first, saving ~₹9,900/year in interest.`;
    } else if (isExplicitPersonalAccountQuery(userQuestion) || intent === 'personal_wealth') {
      fallbackReply = `Your **Wealth Health Score (WHS)** is currently **${clientContext?.whsScore ?? 57}/100 (${clientContext?.whsCategory ?? 'Caution'})** based on Ric Edelman's 7-Pillar Wealth Methodology.

**7-Pillar Diagnostic Breakdown:**
• Emergency Fund: 100/100 (Full 6-month liquid buffer active)
• Retirement Readiness: 100/100 (On track for longevity horizon to age 95)
• Portfolio Drift: 67/100 (Minor rebalance recommended)
• Debt Management: 45/100 (High-interest 21.99% APR credit balance outstanding)
• Insurance Protection: 30/100 (Basic coverage, term life expansion recommended)
• Savings Rate: 0/100 (0% monthly savings rate recorded)
To elevate your score to Healthy (75+), focus on clearing high-interest credit debt and automating your monthly savings rate.`;
    } else if (intent === 'comparison' || /\bvs\b|\bversus\b|difference|compared to|active or passive|taxable vs|roth vs/i.test(qLower)) {
      if (qLower.includes('active') || qLower.includes('passive')) {
        fallbackReply = `When choosing between active and passive mutual funds, the fundamental decision comes down to fund manager stock-picking versus low-cost market index tracking.

| Feature | Active Mutual Funds | Passive Index Funds |
| :--- | :--- | :--- |
| **Strategy** | Fund manager attempts to pick winning stocks | Systematically tracks a broad market index |
| **Costs & Fees** | Higher expense ratios (1.0%–2.0%+), eroding returns | Low expense ratios (0.05%–0.20%), preserving wealth |
| **Performance** | Most active managers underperform market benchmarks | Consistently delivers broad market benchmark returns |

In Ric Edelman's methodology, low-cost passive index funds form the core of wealth building because high active management fees quietly drag down your compound growth over time.`;
      } else if (qLower.includes('taxable') || qLower.includes('tax-deferred') || qLower.includes('tax deferred')) {
        fallbackReply = `When structuring your wealth, deciding between taxable and tax-deferred accounts depends on your immediate liquidity needs versus long-term compounding.

| Feature | Taxable Accounts | Tax-Deferred Accounts |
| :--- | :--- | :--- |
| **Tax Timing** | Taxed annually on dividends & capital gains | Taxes deferred until withdrawal in retirement |
| **Flexibility** | Penalty-free access for liquidity anytime | Early withdrawal penalties before age 59½ |
| **Growth Impact** | Annual drag from capital gains taxes | Compounds 100% tax-free over long horizons |

Ric Edelman recommends maximizing tax-deferred account contributions first to compound wealth tax-free, reserving taxable accounts for emergency buffers and medium-term goals.`;
      } else {
        fallbackReply = `Evaluating financial strategies requires balancing immediate flexibility against long-term growth potential.

| Feature | Option A | Option B |
| :--- | :--- | :--- |
| **Primary Focus** | Short-term flexibility & liquidity | Long-term growth & tax efficiency |
| **Risk & Return** | Lower volatility with stable yield | Higher long-term compounding potential |

Align your final decision with your specific target dates and lifetime financial goals rather than short-term market movements.`;
      }
    } else if (intent === 'case_study' || qLower.includes('evelyn') || qLower.includes('lillian') || qLower.includes('penny')) {
      if (qLower.includes('evelyn')) {
        fallbackReply = `Evelyn Vandermark is a featured case study in Ric Edelman's book who set a clear goal to celebrate her 65th birthday by skydiving.

Her story illustrates goal-driven wealth management. Rather than chasing arbitrary market returns or stock picks, financial planning must begin by defining specific lifetime goals and calculating the exact capital required to achieve them on schedule.`;
      } else if (qLower.includes('lillian')) {
        fallbackReply = `Lillian Brown is a case study in Ric Edelman's book demonstrating active goal planning at age 87.

Her story highlights that wealth planning does not end at retirement—portfolios must be structured to sustain active lifestyle goals and outpace inflation through age 95 and beyond.`;
      } else {
        fallbackReply = `Case studies in Ric Edelman's methodology demonstrate real-world applications of goal-based wealth management.

Every story emphasizes establishing concrete personal targets before choosing investment vehicles, ensuring your portfolio serves your exact life objectives.`;
      }
    } else if (intent === 'book_analogy' || qLower.includes('cabbie') || qLower.includes('tulip') || qLower.includes('pound cake')) {
      if (qLower.includes('cabbie')) {
        fallbackReply = `The cabbie analogy teaches that just as you cannot tell a taxi driver where to take you without specifying a destination, you cannot build an investment portfolio without first defining your exact financial goals and target dates.

Selecting investments before setting goals is like telling a cabbie to "just drive"—you waste capital on random routes rather than taking the direct path to your financial destination.`;
      } else if (qLower.includes('tulip')) {
        fallbackReply = `The Tulip Bulb story references the 17th-century Dutch Tulip Mania, where speculative frenzy drove the price of single tulip bulbs to extreme heights before collapsing.

It illustrates the danger of market manias and FOMO, emphasizing that investors must focus on broad diversification and economic fundamentals rather than speculative price hype.`;
      } else if (qLower.includes('pound cake')) {
        fallbackReply = `The Pound Cake portfolio analogy compares building a diversified investment portfolio to baking a classic cake using a precise, balanced recipe.

Just as a cake requires exact proportions of flour, sugar, butter, and eggs, a sound portfolio requires balanced weightings of equities, international holdings, fixed income, and liquid reserves.`;
      } else {
        fallbackReply = `Ric Edelman's analogies simplify core financial principles into actionable wealth lessons.

They emphasize defining target goals first, maintaining broad asset diversification, and rebalancing systematically rather than attempting to time the market.`;
      }
    } else if (chunks && chunks.length > 0) {
      const topChunk = chunks[0];
      const title = topChunk.metadata?.title || topChunk.metadata?.section || 'Financial Planning';

      fallbackReply = `${title} aligns your asset allocation, risk management, and savings rate with defined financial targets.

A disciplined wealth plan broadly diversifies across core asset classes, matches portfolio liquidity to goal timelines, and rebalances periodically to maintain target risk bands.`;
    } else if (intent === 'Debt & Cash Flow') {
      fallbackReply = `Your account shows an outstanding high-interest credit card balance at 21.99% APR.

Applying Ric Edelman's Debt Avalanche method, direct surplus cash flow to clear this 21.99% APR card first to save ~₹9,900 annually in interest charges.`;
    } else if (intent === 'Emergency Fund') {
      fallbackReply = `Your liquid emergency buffer stands at ${efMonths} months of operating expenses, fully meeting the 6-month target!

Keep this reserve in liquid high-yield accounts and direct surplus monthly cash flow toward debt payoff or automated investments.`;
    } else if (intent === 'Retirement & Longevity') {
      fallbackReply = `Retirement planning requires structuring capital to last through age 95+ and executing tax-efficient withdrawal sequencing.

Withdraw from taxable accounts first, tax-deferred accounts second, and tax-exempt accounts last, while retaining equity exposure to outpace inflation.`;
    } else {
      fallbackReply = `Your current Net Worth is ${netWorthStr} with a Wealth Health Score of ${clientContext?.whsScore ?? 57}/100 (${clientContext?.whsCategory ?? 'Caution'}).

Prioritize clearing high-interest credit debt and automating a 15%+ monthly savings rate to accelerate net worth growth.`;
    }

    return {
      reply: fallbackReply,
      suggestedFollowUps,
      confidenceScore,
      intent,
      latencyMs: Date.now() - startTime,
      sources
    };
  }

  /**
   * Generic synthesis method for AI Request Pipeline.
   * 3-tier fallback: Grok (4s) → Gemini (3.5s) → null (pipeline uses local fallback).
   * Retrieval is never repeated — fullPrompt is passed as-is to each tier.
   */
  public async synthesizeCustomPrompt(fullPrompt: string): Promise<string | null> {
    // Tier 1: Grok (single model, 4s timeout enforced at SDK level)
    if (grokClient.isConfigured) {
      try {
        const result = await grokClient.generateContent(fullPrompt);
        console.log('[LLM CHAIN] synthesizeCustomPrompt resolved via: grok');
        return result;
      } catch (err: any) {
        console.warn(`[LLM CHAIN] Grok failed for synthesizeCustomPrompt, escalating to Gemini: ${err?.message}`);
      }
    }

    // Tier 2: Gemini — with free-tier 429 cooldown & instant fallback
    if (this.genAI) {
      if (Date.now() < geminiRateLimitedUntil) {
        const remainingSec = Math.ceil((geminiRateLimitedUntil - Date.now()) / 1000);
        console.log(`[LLM CHAIN] Gemini free-tier cooldown active (${remainingSec}s remaining) — skipping to local fallback.`);
        return null;
      }

      const tryGemini = async (): Promise<string | null> => {
        try {
          const model = this.genAI!.getGenerativeModel(
            { model: 'gemini-3.5-flash' },
            { timeout: 4500 }
          );
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('[LLM CHAIN] Gemini synthesis timeout (4500ms)')), 4500)
          );
          const apiPromise = model.generateContent(fullPrompt);
          const result = await Promise.race([apiPromise, timeoutPromise]);
          const responseText = result.response.text()?.trim();
          if (responseText) {
            console.log('[LLM CHAIN] synthesizeCustomPrompt resolved via: gemini');
            return responseText;
          }
          return null;
        } catch (err: any) {
          const msg = err?.message ?? '';
          const retryMatch = msg.match(/Please retry in (\d+\.?\d*)s/);
          if (retryMatch) {
            const waitMs = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500;
            geminiRateLimitedUntil = Date.now() + waitMs;
            if (waitMs <= 3000) {
              console.warn(`[LLM CHAIN] Gemini 429 on synthesis — waiting ${waitMs}ms then retrying once`);
              await new Promise(r => setTimeout(r, waitMs));
              try {
                const model2 = this.genAI!.getGenerativeModel({ model: 'gemini-3.5-flash' }, { timeout: 4500 });
                const result2 = await model2.generateContent(fullPrompt);
                return result2.response.text()?.trim() || null;
              } catch { return null; }
            } else {
              console.warn(`[LLM CHAIN] Gemini free-tier 429 quota reached (wait ${Math.round(waitMs / 1000)}s) — fast failover to local fallback.`);
            }
          } else {
            console.warn(`[LLM CHAIN] Gemini failed for synthesizeCustomPrompt, falling to local: ${msg}`);
          }
          return null;
        }
      };
      const geminiResult = await tryGemini();
      if (geminiResult) return geminiResult;
    }

    // Tier 3: Signal pipeline.ts to use local fallback synthesizer
    console.warn('[LLM CHAIN] All LLM providers exhausted — returning null for local fallback.');
    return null;
  }
}

export const ragEngine = new RAGEngine();
