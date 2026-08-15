import { PrismaClient, Prisma } from '@prisma/client';
import { embedder } from './embedder';

const prisma = new PrismaClient();

export interface RagChunkRecord {
  id: string;
  book: string;
  part: string | null;
  chapter: string | null;
  section: string | null;
  page_start: number;
  page_end: number;
  pages: number[];
  category: string;
  secondary_categories: string[];
  keywords: string[];
  concepts: string[];
  entities: string[];
  content_types: string[];
  token_count: number;
  text: string;
  embedding_text: string;
  previous_chunk_id: string | null;
  next_chunk_id: string | null;
  hash: string | null;
  score?: number;
}

export interface RetrievalOptions {
  topK?: number;           // Initial vector candidate count (default 20)
  topN?: number;           // Final selected chunks count (default 5)
  enablePreFilter?: boolean;
  minSimilarity?: number;
}

// Controlled Category Intents Map for Pre-filtering
const INTENT_CATEGORY_MAP: Record<string, string[]> = {
  'emergency': ['Emergency Fund', 'Savings Strategy', 'Cash Flow Management', 'Risk Management'],
  'emergency fund': ['Emergency Fund', 'Savings Strategy', 'Cash Flow Management'],
  'buffer': ['Emergency Fund', 'Savings Strategy'],
  'debt': ['Debt Management', 'Cash Flow Management'],
  'avalanche': ['Debt Management'],
  'snowball': ['Debt Management'],
  'credit card': ['Debt Management'],
  'retirement': ['Retirement Planning', 'Financial Independence'],
  '401k': ['Retirement Planning'],
  'ira': ['Retirement Planning', 'Tax Planning'],
  'roth': ['Retirement Planning', 'Tax Planning'],
  'mutual fund': ['Mutual Funds', 'Investment Strategy', 'Asset Allocation'],
  'index fund': ['Mutual Funds', 'Investment Strategy'],
  'active vs passive': ['Mutual Funds', 'Investment Strategy'],
  'cabbie': ['Goal Planning'],
  'evelyn': ['Goal Planning'],
  'lillian': ['Goal Planning'],
  'pound cake': ['Investment Strategy'],
  'one-investment': ['Investment Strategy'],
  'today\'s special': ['Investment Strategy'],
  'analyst': ['Investment Strategy'],
  'tulip': ['Investment Strategy'],
  'bill gates': ['Investment Strategy', 'Asset Allocation'],
  'dollar cost averaging': ['Investment Strategy'],
  'systematic': ['Investment Strategy'],
  '7 pillar': ['Financial Planning', 'Goal Planning'],
  'wealth health score': ['Financial Planning', 'Goal Planning'],
  'cake': ['Investment Strategy', 'Asset Allocation'],
  'cupcakes': ['Investment Strategy', 'Mutual Funds'],
  'estate': ['Estate Planning', 'Financial Planning'],
  'will': ['Estate Planning'],
  'trust': ['Estate Planning'],
  'insurance': ['Insurance Planning', 'Risk Management'],
  'disability': ['Insurance Planning', 'Risk Management'],
  'tax': ['Tax Planning', 'Mutual Funds']
};

/**
 * Stage 1: Pre-filter Intent Detector
 */
export function detectQueryCategoryIntents(query: string): string[] | null {
  const qLower = query.toLowerCase();
  const matchedCategories = new Set<string>();

  for (const [kw, categories] of Object.entries(INTENT_CATEGORY_MAP)) {
    if (qLower.includes(kw)) {
      categories.forEach(c => matchedCategories.add(c));
    }
  }

  return matchedCategories.size > 0 ? Array.from(matchedCategories) : null;
}

/**
 * Stage 3: Keyword / Entity Term Extractor for boosting
 */
export function extractQueryTerms(query: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'what', 'whats', 'who', 'whos', 'why', 'how', 'when', 'where', 'which',
    'do', 'does', 'did', 'done', 'should', 'could', 'would', 'can', 'may',
    'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
    'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further',
    'difference', 'explain', 'tell', 'me', 'describe'
  ]);

  return query
    .split(/\W+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .map(w => w.trim());
}

/**
 * Stage 5: Sort chunks by original reading order (Part > Chapter > Section > Chunk ID)
 */
export function sortByReadingOrder(chunks: RagChunkRecord[]): RagChunkRecord[] {
  return [...chunks].sort((a, b) => {
    // 1. Page Start
    if (a.page_start !== b.page_start) {
      return a.page_start - b.page_start;
    }
    // 2. Chunk ID numerical suffix
    const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
}

/**
 * Main 5-Stage Retrieval Pipeline
 */
export async function retrieveChunks(
  query: string,
  options: RetrievalOptions = {}
): Promise<RagChunkRecord[]> {
  const topK = options.topK || 20;
  const topN = options.topN || 5;
  const enablePreFilter = options.enablePreFilter !== false;

  // ── Stage 1: Metadata Pre-filter ──────────────────────────────────────────
  const categoryIntents = enablePreFilter ? detectQueryCategoryIntents(query) : null;

  // ── Stage 2: Vector Similarity Search ─────────────────────────────────────
  const queryVector = await embedder.embed(query);
  const vectorStr = JSON.stringify(queryVector);

  let vectorRows: any[] = [];
  try {
    if (categoryIntents && categoryIntents.length > 0) {
      vectorRows = await prisma.$queryRaw<any[]>`
        SELECT id, book, part, chapter, section, page_start AS "page_start", page_end AS "page_end", pages,
               category, secondary_categories AS "secondary_categories", keywords, concepts, entities,
               content_types AS "content_types", token_count AS "token_count", text, embedding_text AS "embedding_text",
               previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id", hash,
               1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM rag_chunks
        WHERE category = ANY(${categoryIntents}) OR secondary_categories && ${categoryIntents}
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${topK};
      `;
    }

    // Fallback or un-filtered search if pre-filter returned fewer than 5 results
    if (vectorRows.length < 5) {
      const fallbackRows = await prisma.$queryRaw<any[]>`
        SELECT id, book, part, chapter, section, page_start AS "page_start", page_end AS "page_end", pages,
               category, secondary_categories AS "secondary_categories", keywords, concepts, entities,
               content_types AS "content_types", token_count AS "token_count", text, embedding_text AS "embedding_text",
               previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id", hash,
               1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM rag_chunks
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${topK};
      `;

      // Merge vector rows deduplicated
      const rowMap = new Map<string, any>();
      vectorRows.forEach(r => rowMap.set(r.id, r));
      fallbackRows.forEach(r => {
        if (!rowMap.has(r.id)) rowMap.set(r.id, r);
      });
      vectorRows = Array.from(rowMap.values());
    }
  } catch (err) {
    console.error('[Retrieval] Vector search query error:', err);
    return [];
  }

  if (vectorRows.length === 0) {
    return [];
  }

  // ── Stage 3: Keyword / Entity Re-ranking Boost ────────────────────────────
  const queryTerms = extractQueryTerms(query);
  const reRanked: RagChunkRecord[] = vectorRows.map(r => {
    let boost = 0;
    const textLower = (r.text || '').toLowerCase();
    const sectionLower = (r.section || '').toLowerCase();
    const chapterLower = (r.chapter || '').toLowerCase();
    const keywordsList = (r.keywords || []).map((k: string) => k.toLowerCase());
    const entitiesList = (r.entities || []).map((e: string) => e.toLowerCase());

    queryTerms.forEach(term => {
      const termLower = term.toLowerCase();
      // Match in Keywords / Entities arrays (+0.15 boost)
      if (keywordsList.includes(termLower) || entitiesList.includes(termLower)) {
        boost += 0.15;
      }
      // Match in Section / Chapter title (+0.10 boost)
      if (sectionLower.includes(termLower) || chapterLower.includes(termLower)) {
        boost += 0.10;
      }
      // Match in Body text (+0.05 boost)
      if (textLower.includes(termLower)) {
        boost += 0.05;
      }
    });

    const baseScore = Number(r.score) || 0;
    const finalScore = baseScore + boost;

    return {
      id: r.id,
      book: r.book,
      part: r.part,
      chapter: r.chapter,
      section: r.section,
      page_start: r.page_start,
      page_end: r.page_end,
      pages: r.pages || [],
      category: r.category,
      secondary_categories: r.secondary_categories || [],
      keywords: r.keywords || [],
      concepts: r.concepts || [],
      entities: r.entities || [],
      content_types: r.content_types || [],
      token_count: r.token_count || 0,
      text: r.text,
      embedding_text: r.embedding_text,
      previous_chunk_id: r.previous_chunk_id,
      next_chunk_id: r.next_chunk_id,
      hash: r.hash,
      score: finalScore,
    };
  });

  // Sort by boosted score descending
  reRanked.sort((a, b) => (b.score || 0) - (a.score || 0));

  // ── Stage 4: Neighbor Expansion for Top Candidates ───────────────────────
  const selectedMap = new Map<string, RagChunkRecord>();
  const topCandidates = reRanked.slice(0, 3);
  const neighborIdsToFetch = new Set<string>();

  topCandidates.forEach(candidate => {
    selectedMap.set(candidate.id, candidate);
    // Expand neighbors if candidate score is high
    if ((candidate.score || 0) >= 0.50) {
      if (candidate.previous_chunk_id) neighborIdsToFetch.add(candidate.previous_chunk_id);
      if (candidate.next_chunk_id) neighborIdsToFetch.add(candidate.next_chunk_id);
    }
  });

  // Include remaining top re-ranked chunks up to topN
  for (const item of reRanked) {
    if (selectedMap.size >= topN) break;
    if (!selectedMap.has(item.id)) {
      selectedMap.set(item.id, item);
    }
  }

  // Fetch missing neighbor chunks from DB
  const missingNeighborIds = Array.from(neighborIdsToFetch).filter(id => !selectedMap.has(id));
  if (missingNeighborIds.length > 0) {
    try {
      const neighborRows = await prisma.$queryRaw<any[]>`
        SELECT id, book, part, chapter, section, page_start AS "page_start", page_end AS "page_end", pages,
               category, secondary_categories AS "secondary_categories", keywords, concepts, entities,
               content_types AS "content_types", token_count AS "token_count", text, embedding_text AS "embedding_text",
               previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id", hash
        FROM rag_chunks
        WHERE id IN (${Prisma.join(missingNeighborIds)});
      `;

      neighborRows.forEach(r => {
        if (!selectedMap.has(r.id)) {
          selectedMap.set(r.id, {
            id: r.id,
            book: r.book,
            part: r.part,
            chapter: r.chapter,
            section: r.section,
            page_start: r.page_start,
            page_end: r.page_end,
            pages: r.pages || [],
            category: r.category,
            secondary_categories: r.secondary_categories || [],
            keywords: r.keywords || [],
            concepts: r.concepts || [],
            entities: r.entities || [],
            content_types: r.content_types || [],
            token_count: r.token_count || 0,
            text: r.text,
            embedding_text: r.embedding_text,
            previous_chunk_id: r.previous_chunk_id,
            next_chunk_id: r.next_chunk_id,
            hash: r.hash,
            score: 0.50, // neighbor default score
          });
        }
      });
    } catch (err) {
      console.warn('[Retrieval] Failed to fetch neighbor chunks:', err);
    }
  }

  // ── Stage 5: Final Selection & Reading Order Assembly ───────────────────
  const finalChunks = Array.from(selectedMap.values()).slice(0, topN + 1);
  return sortByReadingOrder(finalChunks);
}
