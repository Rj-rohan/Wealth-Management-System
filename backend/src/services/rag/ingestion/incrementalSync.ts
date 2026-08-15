import { vectorStore, VectorSearchResult } from '../vectorStore';
import { generateContentHash } from './chunker';

export async function filterUnchangedChunks(
  processedChunks: any[],
  namespace?: string
): Promise<{ toUpdate: any[]; skippedCount: number }> {
  // Fetch existing vectors by ID
  const chunkIds = processedChunks.map(c => c.id);
  
  // We need to fetch in batches to avoid overwhelming the Pinecone API
  const existingVectorsMap = new Map<string, VectorSearchResult>();
  const batchSize = 100;
  
  for (let i = 0; i < chunkIds.length; i += batchSize) {
    const batchIds = chunkIds.slice(i, i + batchSize);
    const existingBatch = await vectorStore.fetchByIds(batchIds);
    for (const v of existingBatch) {
      existingVectorsMap.set(v.id, v);
    }
  }

  const toUpdate: any[] = [];
  let skippedCount = 0;

  for (const chunk of processedChunks) {
    const existing = existingVectorsMap.get(chunk.id);
    
    // If it exists and the content hash matches the existing metadata hash, skip it
    if (existing && existing.metadata.content_hash === chunk.metadata.content_hash) {
      // Also verify embedding version hasn't changed
      if (existing.metadata.embedding_version === chunk.metadata.embedding_version) {
        skippedCount++;
        continue;
      }
    }
    toUpdate.push(chunk);
  }

  return { toUpdate, skippedCount };
}
