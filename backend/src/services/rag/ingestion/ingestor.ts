import * as fs from 'fs';
import * as path from 'path';
import { RawDocumentChunk, processDocumentChunks, generateContentHash, generateParentDocId } from './chunker';
import { filterUnchangedChunks } from './incrementalSync';
import { generateDocumentSummary } from './summarizer';
import { embedder } from '../embedder';
import { vectorStore, VectorMetadata } from '../vectorStore';

export interface IngestionStats {
  totalChunks: number;
  newChunks: number;
  updatedChunks: number;
  skippedChunks: number;
  summariesGenerated: number;
  totalVectorsUpserted: number;
  latencyMs: number;
}

async function loadRawChunks(): Promise<RawDocumentChunk[]> {
  const filePath = path.join(__dirname, '..', 'rag_knowledge.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  
  const samplePath = path.join(__dirname, '..', 'sample_rag_knowledge.json');
  if (fs.existsSync(samplePath)) {
    console.warn('[Ingestor] rag_knowledge.json not found, falling back to sample_rag_knowledge.json');
    const data = fs.readFileSync(samplePath, 'utf-8');
    return JSON.parse(data);
  }
  
  throw new Error('No knowledge base source files found.');
}

export async function ingestKnowledgeBase(namespace?: string, incremental: boolean = false): Promise<IngestionStats> {
  const startTime = Date.now();
  console.log(`[Ingestor] Starting ingestion pipeline (Namespace: ${namespace || 'production'}, Incremental: ${incremental})`);

  // Step 1: Initialize Pinecone
  await vectorStore.initialize(namespace);
  if (!vectorStore.isAvailable) {
    throw new Error('VectorStore must be available for ingestion.');
  }

  // Step 2: Load raw chunks
  const rawChunks = await loadRawChunks();
  
  // Step 3: Process chunks into vector metadata format with grouping
  const processedChunks = processDocumentChunks(rawChunks);
  let chunksToProcess = processedChunks;
  let skippedChunks = 0;

  // Step 4: Incremental Sync filtering
  if (incremental) {
    const filterResult = await filterUnchangedChunks(processedChunks, namespace);
    chunksToProcess = filterResult.toUpdate;
    skippedChunks = filterResult.skippedCount;
    console.log(`[Ingestor] Incremental sync: skipped ${skippedChunks}/${processedChunks.length} unchanged chunks.`);
  }

  if (chunksToProcess.length === 0) {
    return {
      totalChunks: processedChunks.length,
      newChunks: 0,
      updatedChunks: 0,
      skippedChunks,
      summariesGenerated: 0,
      totalVectorsUpserted: 0,
      latencyMs: Date.now() - startTime
    };
  }

  // Step 5: Group chunks by parent for summarization and batching
  const parentGroups = new Map<string, typeof chunksToProcess>();
  for (const chunk of chunksToProcess) {
    const parentId = chunk.metadata.parent_doc_id;
    if (!parentGroups.has(parentId)) {
      parentGroups.set(parentId, []);
    }
    parentGroups.get(parentId)!.push(chunk);
  }

  let summariesGenerated = 0;
  let totalVectorsUpserted = 0;

  // Process each document group
  for (const [parentDocId, group] of parentGroups.entries()) {
    console.log(`[Ingestor] Processing document group: ${parentDocId} (${group.length} chunks)`);
    
    for (let i = 0; i < group.length; i++) {
      const c = group[i];
      const headerStr = `[Book: ${c.metadata.book} | Part: ${c.metadata.part || 'N/A'} | Chapter: ${c.metadata.chapter || 'N/A'} | Section: ${c.metadata.section || 'N/A'}]`;
      const enrichedContext = `${headerStr}\n\n${c.text}`;

      const embedding = await embedder.embed(enrichedContext);
      
      const itemToUpsert = {
        id: c.id,
        values: embedding,
        enrichedContext: enrichedContext,
        metadata: { ...c.metadata, text: c.text }
      };

      await vectorStore.upsert([itemToUpsert], namespace);
      totalVectorsUpserted++;
      if (i % 25 === 0 || i === group.length - 1) {
        console.log(`[Ingestor] Streamed ${i + 1}/${group.length} chunks for ${parentDocId} to PostgreSQL + pgvector.`);
      }
    }

    // Step 6: Generate Document Summary
    const fullText = group.map(c => c.text).join('\n\n');
    const representativeChunk = group[0];
    
    const summaryText = await generateDocumentSummary(fullText, representativeChunk.metadata.category, representativeChunk.metadata.title);
    const summaryHash = generateContentHash(summaryText);
    const summaryEmbedding = await embedder.embed(summaryText);
    
    const summaryItem = {
      id: `${parentDocId}-summary`,
      values: summaryEmbedding,
      enrichedContext: `[Summary: ${representativeChunk.metadata.title}]\n\n${summaryText}`,
      metadata: {
        category: representativeChunk.metadata.category,
        source: representativeChunk.metadata.source,
        book: representativeChunk.metadata.book,
        author: representativeChunk.metadata.author,
        title: representativeChunk.metadata.title + ' (Summary)',
        parent_doc_id: parentDocId,
        chunk_index: -1,
        total_chunks: representativeChunk.metadata.total_chunks,
        is_summary: true,
        summary_level: 'document',
        embedding_version: embedder.version,
        ingestion_timestamp: new Date().toISOString(),
        content_hash: summaryHash,
        text: summaryText
      }
    };

    await vectorStore.upsert([summaryItem], namespace);
    summariesGenerated++;
    totalVectorsUpserted++;
  }

  const latencyMs = Date.now() - startTime;
  console.log(`[Ingestor] Ingestion complete in ${latencyMs}ms. ${totalVectorsUpserted} vectors stored in PostgreSQL.`);

  return {
    totalChunks: processedChunks.length,
    newChunks: chunksToProcess.length,
    updatedChunks: 0,
    skippedChunks,
    summariesGenerated,
    totalVectorsUpserted,
    latencyMs
  };
}

export async function incrementalSync(namespace?: string): Promise<IngestionStats> {
  return ingestKnowledgeBase(namespace, true);
}
