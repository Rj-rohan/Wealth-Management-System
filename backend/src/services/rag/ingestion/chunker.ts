import { VectorMetadata } from '../vectorStore';
import { embedder } from '../embedder';
import * as crypto from 'crypto';

export interface RawDocumentChunk {
  id: string;
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
  category: string;
  title: string;
  text: string;
}

export function generateContentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function generateParentDocId(source: string, title: string): string {
  const normalizedSource = source.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const normalizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `${normalizedSource}--${normalizedTitle}`.substring(0, 100);
}

export function processDocumentChunks(rawChunks: RawDocumentChunk[]): {
  id: string;
  text: string;
  metadata: Omit<VectorMetadata, 'id' | 'text'>;
}[] {
  // Group by parent document
  const groupedByParent = new Map<string, RawDocumentChunk[]>();
  
  for (const chunk of rawChunks) {
    const parentDocId = generateParentDocId(chunk.source, chunk.title);
    if (!groupedByParent.has(parentDocId)) {
      groupedByParent.set(parentDocId, []);
    }
    groupedByParent.get(parentDocId)!.push(chunk);
  }

  const processedChunks: {
    id: string;
    text: string;
    metadata: Omit<VectorMetadata, 'id' | 'text'>;
  }[] = [];

  const timestamp = new Date().toISOString();

  for (const [parentDocId, group] of groupedByParent.entries()) {
    const total_chunks = group.length;
    
    // Process each chunk in the group
    group.forEach((chunk, chunk_index) => {
      const content_hash = generateContentHash(chunk.text);
      
      processedChunks.push({
        id: chunk.id,
        text: chunk.text,
        metadata: {
          category: chunk.category,
          source: chunk.source,
          book: chunk.book,
          author: chunk.author,
          part: chunk.part,
          chapter: chunk.chapter,
          section: chunk.section,
          subsection: chunk.subsection,
          page_start: chunk.page_start,
          page_end: chunk.page_end,
          pages: chunk.pages,
          document_order: chunk.document_order,
          previous_chunk_id: chunk.previous_chunk_id,
          next_chunk_id: chunk.next_chunk_id,
          token_count: chunk.token_count,
          keywords: chunk.keywords,
          title: chunk.title,
          parent_doc_id: parentDocId,
          chunk_index: chunk_index,
          total_chunks: total_chunks,
          is_summary: false,
          embedding_version: embedder.version,
          ingestion_timestamp: timestamp,
          content_hash: content_hash
        }
      });
    });
  }

  return processedChunks;
}
