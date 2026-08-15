import { PrismaClient, Prisma } from '@prisma/client';
import { retrieveChunks, RagChunkRecord } from './retrieval';

const prisma = new PrismaClient();

export interface VectorMetadata {
  id: string;
  text: string;
  category: string;
  source: string;
  book: string;
  author?: string;
  part?: string;
  chapter?: string;
  section?: string;
  subsection?: string;
  page_start?: number;
  page_end?: number;
  pages?: number[];
  document_order?: number;
  previous_chunk_id?: string | null;
  next_chunk_id?: string | null;
  token_count?: number;
  keywords?: string[];
  title: string;
  parent_doc_id: string;
  chunk_index: number;
  total_chunks: number;
  is_summary: boolean;
  summary_level?: string;
  embedding_version: string;
  ingestion_timestamp: string;
  content_hash: string;
  applicable_segments?: string[];
  min_age?: number;
  max_age?: number;
  requires_dependents?: boolean;
  [key: string]: any;
}

export interface SearchOptions {
  topK?: number;
  minSimilarity?: number;
  namespace?: string;
  searchQuery?: string;
  filter?: {
    category?: string;
    book?: string;
    parent_doc_id?: string;
    segment?: string;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
  text: string;
}

export interface IndexStats {
  dimension?: number;
  indexFullness?: number;
  totalRecordCount?: number;
  namespaces?: {
    [key: string]: {
      recordCount: number;
    };
  };
}

class VectorStore {
  public isAvailable = false;

  public async initialize(_namespace?: string): Promise<void> {
    try {
      // 1. Enable pgvector extension if not exists
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');

      // 2. Ensure HNSW Cosine vector index
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS document_vector_chunks_embedding_hnsw_idx 
        ON document_vector_chunks USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
      `);

      // 3. Ensure Full-Text Search GIN index
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS document_vector_chunks_fts_idx 
        ON document_vector_chunks USING gin (to_tsvector('english', title || ' ' || text));
      `);

      // 4. Ensure GIN indexes for keywords
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS document_vector_chunks_keywords_idx 
        ON document_vector_chunks USING gin (keywords);
      `);

      this.isAvailable = true;
      console.log('[VectorStore] Initialized PostgreSQL + pgvector vector store successfully.');
    } catch (error) {
      console.error('[VectorStore] Failed to initialize PostgreSQL + pgvector:', error);
      this.isAvailable = false;
    }
  }

  public async upsert(vectors: any[], _namespace?: string): Promise<void> {
    if (!this.isAvailable) await this.initialize();
    
    // Batch upsert into document_vector_chunks in batches of 50
    const batchSize = 50;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      for (const item of batch) {
        const meta = item.metadata;
        const vectorStr = JSON.stringify(item.values);
        const pagesArr = meta.pages || [meta.page_start || 1];
        const keywordsArr = meta.keywords || [];

        await prisma.$executeRaw`
          INSERT INTO document_vector_chunks (
            id, book, author, part, chapter, section, subsection,
            page_start, page_end, pages, document_order, chunk_index,
            previous_chunk_id, next_chunk_id, category, keywords, title,
            source, token_count, content_hash, parent_doc_id, is_summary,
            summary_level, embedding_version, text, enriched_context, metadata,
            embedding, updated_at
          ) VALUES (
            ${item.id}, ${meta.book || 'Discover The Wealth Within You'}, ${meta.author || 'Ric Edelman'},
            ${meta.part || null}, ${meta.chapter || null}, ${meta.section || null}, ${meta.subsection || null},
            ${meta.page_start || 1}, ${meta.page_end || 1}, ${pagesArr}, ${meta.document_order || meta.chunk_index || 1},
            ${meta.chunk_index || 1}, ${meta.previous_chunk_id || null}, ${meta.next_chunk_id || null},
            ${meta.category || 'General'}, ${keywordsArr}, ${meta.title || ''}, ${meta.source || ''},
            ${meta.token_count || 500}, ${meta.content_hash || ''}, ${meta.parent_doc_id || ''},
            ${meta.is_summary || false}, ${meta.summary_level || 'chunk'}, ${meta.embedding_version || 'gemini-embedding-001'},
            ${meta.text || ''}, ${item.enrichedContext || meta.text || ''}, ${JSON.stringify(meta)}::jsonb,
            ${vectorStr}::vector, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            keywords = EXCLUDED.keywords,
            title = EXCLUDED.title,
            source = EXCLUDED.source,
            token_count = EXCLUDED.token_count,
            content_hash = EXCLUDED.content_hash,
            parent_doc_id = EXCLUDED.parent_doc_id,
            is_summary = EXCLUDED.is_summary,
            summary_level = EXCLUDED.summary_level,
            embedding_version = EXCLUDED.embedding_version,
            text = EXCLUDED.text,
            enriched_context = EXCLUDED.enriched_context,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = NOW();
        `;
      }
    }
  }

  public async search(queryVector: number[], options?: SearchOptions): Promise<VectorSearchResult[]> {
    if (!this.isAvailable) await this.initialize();
    
    const searchQuery = options?.searchQuery || '';
    if (searchQuery) {
      const retrieved = await retrieveChunks(searchQuery, {
        topK: options?.topK || 20,
        topN: options?.topK || 5,
        enablePreFilter: true,
      });

      return retrieved.map((r: RagChunkRecord) => ({
        id: r.id,
        score: Number((r.score || 0.85).toFixed(4)),
        text: r.text,
        metadata: {
          id: r.id,
          text: r.text,
          category: r.category,
          source: `${r.book} - ${r.chapter}`,
          book: r.book,
          author: 'Ric Edelman',
          part: r.part || '',
          chapter: r.chapter || '',
          section: r.section || '',
          subsection: 'General',
          page_start: r.page_start,
          page_end: r.page_end,
          pages: r.pages,
          document_order: parseInt(r.id.replace(/\D/g, ''), 10) || 1,
          previous_chunk_id: r.previous_chunk_id,
          next_chunk_id: r.next_chunk_id,
          token_count: r.token_count,
          keywords: r.keywords,
          title: `${r.chapter}: ${r.section}`,
          parent_doc_id: `${r.book}_${r.chapter}`.replace(/\s+/g, '_').toLowerCase(),
          chunk_index: parseInt(r.id.replace(/\D/g, ''), 10) || 1,
          total_chunks: 1,
          is_summary: false,
          summary_level: 'chunk',
          embedding_version: 'gemini-embedding-001',
          ingestion_timestamp: new Date().toISOString(),
          content_hash: r.hash || ''
        }
      }));
    }

    const topK = options?.topK || Number(process.env.RETRIEVAL_TOP_K) || 20;
    const minSimilarity = options?.minSimilarity || Number(process.env.RETRIEVAL_MIN_SIMILARITY) || 0.45;
    const vectorWeight = Number(process.env.RETRIEVAL_HYBRID_VECTOR_WEIGHT) || 0.7;
    const keywordWeight = Number(process.env.RETRIEVAL_HYBRID_KEYWORD_WEIGHT) || 0.3;
    const rrfK = Number(process.env.RETRIEVAL_RRF_K) || 60;

    const categoryFilter = options?.filter?.category || null;
    const parentDocFilter = options?.filter?.parent_doc_id || null;
    const vectorStr = JSON.stringify(queryVector);

    // 1. Parameterized Cosine Vector Similarity Query
    let vectorRows: any[] = [];
    try {
      vectorRows = await prisma.$queryRaw<any[]>`
        SELECT id, text, category, source, book, author, part, chapter, section, subsection,
               page_start AS "page_start", page_end AS "page_end", pages, document_order AS "document_order",
               previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id",
               token_count AS "token_count", keywords, title, parent_doc_id AS "parent_doc_id",
               is_summary AS "is_summary", summary_level AS "summary_level", content_hash AS "content_hash",
               1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM document_vector_chunks
        WHERE is_summary = false
          AND (${categoryFilter}::text IS NULL OR category ILIKE ${'%' + (categoryFilter || '') + '%'})
          AND (${parentDocFilter}::text IS NULL OR parent_doc_id = ${parentDocFilter})
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${topK};
      `;
    } catch (e) {
      console.warn('[VectorStore] pgvector search query error:', e);
    }

    // 2. Full-Text Search Query (BM25 Equivalent) if search query is available
    let ftsRows: any[] = [];
    if (options?.searchQuery && options.searchQuery.trim().length > 0) {
      try {
        const sq = options.searchQuery.trim();
        // Comprehensive English stop-words filter
        const stopWords = new Set([
          'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
          'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
          'do', 'does', 'did', 'done', 'doing', 'have', 'has', 'had', 'having',
          'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
          'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
          'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us',
          'for', 'and', 'nor', 'but', 'or', 'yet', 'so', 'at', 'by', 'in', 'of', 'on', 'to', 'from', 'with', 'about'
        ]);
        const words = sq.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
        const orPattern = words.join(' | ');
        const properNouns = sq.split(/\W+/).filter(w => w.length > 2 && w[0] === w[0].toUpperCase() && !stopWords.has(w.toLowerCase()));
        const properPattern = properNouns.map(w => w.toLowerCase()).join(' & ');

        ftsRows = await prisma.$queryRaw<any[]>`
          SELECT id, text, category, source, book, author, part, chapter, section, subsection,
                 page_start AS "page_start", page_end AS "page_end", pages, document_order AS "document_order",
                 previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id",
                 token_count AS "token_count", keywords, title, parent_doc_id AS "parent_doc_id",
                 is_summary AS "is_summary", summary_level AS "summary_level", content_hash AS "content_hash",
                 (
                   CASE WHEN (${properPattern.length > 0}::boolean AND to_tsvector('english', title || ' ' || text) @@ to_tsquery('english', ${properPattern || 'evelyn'})) THEN 10.0 ELSE 1.0 END
                   + ts_rank_cd(to_tsvector('english', title || ' ' || text), to_tsquery('english', ${orPattern || 'emergency | fund'}))
                 ) AS score
          FROM document_vector_chunks
          WHERE is_summary = false
            AND (
              (${properPattern.length > 0}::boolean AND to_tsvector('english', title || ' ' || text) @@ to_tsquery('english', ${properPattern}))
              OR (${orPattern.length > 0}::boolean AND to_tsvector('english', title || ' ' || text) @@ to_tsquery('english', ${orPattern}))
              OR title ILIKE ${'%' + sq + '%'}
              OR text ILIKE ${'%' + sq + '%'}
            )
            AND (${categoryFilter}::text IS NULL OR category ILIKE ${'%' + (categoryFilter || '') + '%'})
          ORDER BY score DESC
          LIMIT ${topK};
        `;
      } catch (e) {
        // Fallback FTS with simple ILIKE
        try {
          const sq = options.searchQuery.trim();
          ftsRows = await prisma.$queryRaw<any[]>`
            SELECT id, text, category, source, book, author, part, chapter, section, subsection,
                   page_start AS "page_start", page_end AS "page_end", pages, document_order AS "document_order",
                   previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id",
                   token_count AS "token_count", keywords, title, parent_doc_id AS "parent_doc_id",
                   is_summary AS "is_summary", summary_level AS "summary_level", content_hash AS "content_hash",
                   0.8 AS score
            FROM document_vector_chunks
            WHERE is_summary = false
              AND (text ILIKE ${'%' + sq + '%'} OR title ILIKE ${'%' + sq + '%'})
            LIMIT ${topK};
          `;
        } catch (err2) {}
      }
    }

    // 3. Score Fusion (Reciprocal Rank Fusion - RRF)
    const fusedMap = new Map<string, { row: any; rrfScore: number; cosScore: number }>();

    // Give FTS matches strong priority if present
    const hasFtsMatches = ftsRows.length > 0;
    const effVectorWeight = hasFtsMatches ? 0.3 : vectorWeight;
    const effKeywordWeight = hasFtsMatches ? 0.8 : keywordWeight;

    ftsRows.forEach((r, rank) => {
      const ftsScore = Number(r.score) || 1.0;
      const rrf = (effKeywordWeight * ftsScore) + (2.0 / (rank + 1));
      fusedMap.set(r.id, { row: r, rrfScore: rrf, cosScore: Math.max(ftsScore, 0.75) });
    });

    vectorRows.forEach((r, rank) => {
      const cosScore = Number(r.score) || 0;
      const rrf = (effVectorWeight * cosScore) + (1.0 / (rank + rrfK));
      if (fusedMap.has(r.id)) {
        fusedMap.get(r.id)!.rrfScore += rrf;
      } else {
        fusedMap.set(r.id, { row: r, rrfScore: rrf, cosScore });
      }
    });

    const sortedFused = Array.from(fusedMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, topK);

    const results: VectorSearchResult[] = [];
    for (const item of sortedFused) {
      const r = item.row;
      const finalScore = Number(item.cosScore.toFixed(4));

      if (finalScore >= minSimilarity || (hasFtsMatches && item.rrfScore >= 0.01)) {
        results.push({
          id: r.id,
          score: finalScore > 0.1 ? finalScore : 0.85,
          text: r.text,
          metadata: {
            id: r.id,
            text: r.text,
            category: r.category,
            source: r.source,
            book: r.book,
            author: r.author,
            part: r.part,
            chapter: r.chapter,
            section: r.section,
            subsection: r.subsection,
            page_start: r.page_start,
            page_end: r.page_end,
            pages: r.pages,
            document_order: r.document_order,
            previous_chunk_id: r.previous_chunk_id,
            next_chunk_id: r.next_chunk_id,
            token_count: r.token_count,
            keywords: r.keywords,
            title: r.title,
            parent_doc_id: r.parent_doc_id,
            chunk_index: r.document_order || 1,
            total_chunks: 1,
            is_summary: r.is_summary,
            summary_level: r.summary_level,
            embedding_version: 'gemini-embedding-001',
            ingestion_timestamp: new Date().toISOString(),
            content_hash: r.content_hash || ''
          }
        });
      }
    }

    return results;
  }

  public async fetchByIds(ids: string[]): Promise<VectorSearchResult[]> {
    if (!this.isAvailable || ids.length === 0) return [];
    
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, text, category, source, book, author, part, chapter, section, subsection,
             page_start AS "page_start", page_end AS "page_end", pages, document_order AS "document_order",
             previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id",
             token_count AS "token_count", keywords, title, parent_doc_id AS "parent_doc_id",
             is_summary AS "is_summary", summary_level AS "summary_level", content_hash AS "content_hash"
      FROM document_vector_chunks
      WHERE id IN (${Prisma.join(ids)});
    `;

    return rows.map(r => ({
      id: r.id,
      score: 1.0,
      text: r.text,
      metadata: {
        id: r.id,
        text: r.text,
        category: r.category,
        source: r.source,
        book: r.book,
        author: r.author,
        part: r.part,
        chapter: r.chapter,
        section: r.section,
        subsection: r.subsection,
        page_start: r.page_start,
        page_end: r.page_end,
        pages: r.pages,
        document_order: r.document_order,
        previous_chunk_id: r.previous_chunk_id,
        next_chunk_id: r.next_chunk_id,
        token_count: r.token_count,
        keywords: r.keywords,
        title: r.title,
        parent_doc_id: r.parent_doc_id,
        chunk_index: r.document_order || 1,
        total_chunks: 1,
        is_summary: r.is_summary,
        summary_level: r.summary_level,
        embedding_version: 'gemini-embedding-001',
        ingestion_timestamp: new Date().toISOString(),
        content_hash: r.content_hash || ''
      }
    }));
  }

  public async getDocumentSummary(parentDocId: string): Promise<VectorSearchResult | null> {
    if (!this.isAvailable) return null;
    
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, text, category, source, book, author, part, chapter, section, subsection,
             page_start AS "page_start", page_end AS "page_end", pages, document_order AS "document_order",
             previous_chunk_id AS "previous_chunk_id", next_chunk_id AS "next_chunk_id",
             token_count AS "token_count", keywords, title, parent_doc_id AS "parent_doc_id",
             is_summary AS "is_summary", summary_level AS "summary_level", content_hash AS "content_hash"
      FROM document_vector_chunks
      WHERE parent_doc_id = ${parentDocId} AND is_summary = true
      LIMIT 1;
    `;

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      score: 1.0,
      text: r.text,
      metadata: {
        id: r.id,
        text: r.text,
        category: r.category,
        source: r.source,
        book: r.book,
        author: r.author,
        part: r.part,
        chapter: r.chapter,
        section: r.section,
        subsection: r.subsection,
        page_start: r.page_start,
        page_end: r.page_end,
        pages: r.pages,
        document_order: r.document_order,
        previous_chunk_id: r.previous_chunk_id,
        next_chunk_id: r.next_chunk_id,
        token_count: r.token_count,
        keywords: r.keywords,
        title: r.title,
        parent_doc_id: r.parent_doc_id,
        chunk_index: r.document_order || 1,
        total_chunks: 1,
        is_summary: r.is_summary,
        summary_level: r.summary_level,
        embedding_version: 'gemini-embedding-001',
        ingestion_timestamp: new Date().toISOString(),
        content_hash: r.content_hash || ''
      }
    };
  }

  public async getAdjacentChunks(chunkId: string): Promise<VectorSearchResult[]> {
    if (!this.isAvailable) return [];
    
    const targets = await this.fetchByIds([chunkId]);
    if (targets.length === 0) return [];
    
    const target = targets[0];
    const prevId = target.metadata.previous_chunk_id;
    const nextId = target.metadata.next_chunk_id;
    
    const idsToFetch = [prevId, nextId].filter(Boolean) as string[];
    if (idsToFetch.length === 0) return [];

    return this.fetchByIds(idsToFetch);
  }

  public async getStats(): Promise<IndexStats> {
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM document_vector_chunks;
    `;
    const totalRecordCount = Number(countResult[0]?.count || 0);

    return {
      dimension: Number(process.env.EMBEDDING_DIMENSION) || 768,
      indexFullness: 0.0,
      totalRecordCount,
      namespaces: {
        production: {
          recordCount: totalRecordCount
        }
      }
    };
  }
  
  public async deleteAll(): Promise<void> {
    await prisma.$executeRawUnsafe('DELETE FROM document_vector_chunks;');
  }
}

export const vectorStore = new VectorStore();
