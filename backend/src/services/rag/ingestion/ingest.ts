import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import { embedder } from '../embedder';

const prisma = new PrismaClient();

export interface IngestionResult {
  totalNodes: number;
  totalChunks: number;
  skippedChunks: number;
  embeddedChunks: number;
  failedChunks: number;
  latencyMs: number;
}

export async function runIngestion(outputDir?: string): Promise<IngestionResult> {
  const startTime = Date.now();
  const searchDirs = [
    outputDir,
    path.join(__dirname, '..', 'rag_out'),
    path.join(__dirname, '..'),
    path.join(process.cwd(), 'rag_out'),
    path.join(process.cwd(), 'app', 'backend', 'src', 'services', 'rag', 'rag_out'),
    path.join(process.cwd(), 'app', 'backend', 'src', 'services', 'rag'),
  ].filter(Boolean) as string[];

  let nodesPath: string | null = null;
  let chunksPath: string | null = null;

  for (const dir of searchDirs) {
    const np = path.join(dir, 'document_nodes.json');
    const cp = path.join(dir, 'rag_chunks.json');
    if (fs.existsSync(np) && fs.existsSync(cp)) {
      nodesPath = np;
      chunksPath = cp;
      break;
    }
  }

  if (!nodesPath || !chunksPath) {
    // Fallback: check if rag_knowledge.json exists
    const fallbackPath = path.join(__dirname, '..', 'rag_knowledge.json');
    if (!fs.existsSync(fallbackPath)) {
      throw new Error(`Ingestion files (document_nodes.json & rag_chunks.json) not found in searched paths: ${searchDirs.join(', ')}`);
    }
    console.warn(`[Ingest] document_nodes.json not found, using legacy rag_knowledge.json`);
    chunksPath = fallbackPath;
  }

  console.log(`[Ingest] Loading pipeline data from:\n  Nodes: ${nodesPath || 'N/A'}\n  Chunks: ${chunksPath}`);

  // 1. Ingest Document Nodes
  let totalNodes = 0;
  if (nodesPath && fs.existsSync(nodesPath)) {
    const rawNodes = JSON.parse(fs.readFileSync(nodesPath, 'utf-8'));
    totalNodes = rawNodes.length;

    for (const node of rawNodes) {
      const nodeId = `${node.book}_${node.part}_${node.chapter}_${node.section}`.replace(/\s+/g, '_').toLowerCase();
      await prisma.$executeRaw`
        INSERT INTO document_nodes (
          id, book, part, chapter, section, pages, is_metadata_only, has_content, heading_prefix, created_at
        ) VALUES (
          ${nodeId}, ${node.book || 'Discover The Wealth Within You'}, ${node.part || ''}, ${node.chapter || ''}, ${node.section || ''},
          ${node.pages || []}, ${Boolean(node.is_metadata_only)}, ${Boolean(node.has_content)}, ${node.heading_prefix || null}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          pages = EXCLUDED.pages,
          is_metadata_only = EXCLUDED.is_metadata_only,
          has_content = EXCLUDED.has_content,
          heading_prefix = EXCLUDED.heading_prefix;
      `;
    }
    console.log(`[Ingest] Successfully upserted ${totalNodes} document nodes into document_nodes table.`);
  }

  // 2. Ingest RAG Chunks
  const rawChunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  const totalChunks = rawChunks.length;

  // Ensure DB indexes exist
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw_idx 
    ON rag_chunks USING hnsw (embedding vector_cosine_ops) 
    WITH (m = 16, ef_construction = 64);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunks_keywords_gin_idx 
    ON rag_chunks USING gin (keywords);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunks_sec_cats_gin_idx 
    ON rag_chunks USING gin (secondary_categories);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunks_entities_gin_idx 
    ON rag_chunks USING gin (entities);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rag_chunks_fts_idx 
    ON rag_chunks USING gin (to_tsvector('english', section || ' ' || text));
  `);

  // Fetch existing hashes to skip unchanged chunks
  const existingRecords = await prisma.$queryRaw<{ id: string; hash: string }[]>`
    SELECT id, hash FROM rag_chunks;
  `;
  const existingHashMap = new Map<string, string>();
  existingRecords.forEach(r => existingHashMap.set(r.id, r.hash || ''));

  let skippedChunks = 0;
  let embeddedChunks = 0;
  let failedChunks = 0;

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    const chunkId = chunk.id || `chunk_${i + 1}`;
    const chunkHash = chunk.hash || '';

    // Idempotent Skip Check
    if (existingHashMap.has(chunkId) && existingHashMap.get(chunkId) === chunkHash && chunkHash !== '') {
      skippedChunks++;
      continue;
    }

    const textToEmbed = chunk.embedding_text || chunk.text || '';
    if (!textToEmbed) {
      console.warn(`[Ingest] Chunk ${chunkId} has no text to embed. Skipping.`);
      failedChunks++;
      continue;
    }

    try {
      const vec = await embedder.embed(textToEmbed);
      const vectorStr = JSON.stringify(vec);
      const pagesArr = chunk.pages || [chunk.page_start || 1];
      const secCatsArr = chunk.secondary_categories || [];
      const keywordsArr = chunk.keywords || [];
      const conceptsArr = chunk.concepts || [];
      const entitiesArr = chunk.entities || [];
      const contentTypesArr = chunk.content_types || [chunk.content_type || 'Paragraph'];

      await prisma.$executeRaw`
        INSERT INTO rag_chunks (
          id, book, part, chapter, section, page_start, page_end, pages,
          category, secondary_categories, keywords, concepts, entities, content_types,
          token_count, text, embedding_text, embedding, previous_chunk_id, next_chunk_id, hash, updated_at
        ) VALUES (
          ${chunkId}, ${chunk.book || 'Discover The Wealth Within You'}, ${chunk.part || null}, ${chunk.chapter || null}, ${chunk.section || null},
          ${chunk.page_start || 1}, ${chunk.page_end || 1}, ${pagesArr},
          ${chunk.category || chunk.primary_category || 'General'}, ${secCatsArr}, ${keywordsArr}, ${conceptsArr}, ${entitiesArr}, ${contentTypesArr},
          ${chunk.token_count || 500}, ${chunk.text || ''}, ${chunk.embedding_text || chunk.text || ''}, ${vectorStr}::vector,
          ${chunk.previous_chunk_id || null}, ${chunk.next_chunk_id || null}, ${chunkHash}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          part = EXCLUDED.part,
          chapter = EXCLUDED.chapter,
          section = EXCLUDED.section,
          page_start = EXCLUDED.page_start,
          page_end = EXCLUDED.page_end,
          pages = EXCLUDED.pages,
          category = EXCLUDED.category,
          secondary_categories = EXCLUDED.secondary_categories,
          keywords = EXCLUDED.keywords,
          concepts = EXCLUDED.concepts,
          entities = EXCLUDED.entities,
          content_types = EXCLUDED.content_types,
          token_count = EXCLUDED.token_count,
          text = EXCLUDED.text,
          embedding_text = EXCLUDED.embedding_text,
          embedding = EXCLUDED.embedding,
          previous_chunk_id = EXCLUDED.previous_chunk_id,
          next_chunk_id = EXCLUDED.next_chunk_id,
          hash = EXCLUDED.hash,
          updated_at = NOW();
      `;

      embeddedChunks++;
      if (embeddedChunks % 10 === 0 || i === rawChunks.length - 1) {
        console.log(`[Ingest] Progress: ${embeddedChunks + skippedChunks}/${totalChunks} chunks processed (${embeddedChunks} embedded, ${skippedChunks} skipped).`);
      }
    } catch (err) {
      console.error(`[Ingest] Failed to embed/upsert chunk ${chunkId}:`, err);
      failedChunks++;
    }
  }

  const latencyMs = Date.now() - startTime;
  console.log(`[Ingest] Ingestion Summary:
  - Document Nodes: ${totalNodes}
  - Total Chunks: ${totalChunks}
  - Embedded: ${embeddedChunks}
  - Skipped (Unchanged): ${skippedChunks}
  - Failures: ${failedChunks}
  - Time Elapsed: ${latencyMs}ms
  `);

  return {
    totalNodes,
    totalChunks,
    skippedChunks,
    embeddedChunks,
    failedChunks,
    latencyMs,
  };
}
