/**
 * RAG Knowledge Base Loader
 *
 * Attempts to load the full knowledge base (rag_knowledge.json) first.
 * rag_knowledge.json is gitignored because it contains text derived from
 * Ric Edelman's copyrighted book (HarperCollins 2010) — 41.1% of its 689 chunks.
 *
 * On a fresh clone, the app falls back to sample_rag_knowledge.json (5 copyright-free
 * placeholder chunks). To rebuild the full knowledge base locally, run:
 *   python3 scripts/build_rag_knowledge.py
 * See also: research/README.md
 */

import * as fs from 'fs';
import * as path from 'path';

let knowledgeData: any[] = [];
const fullKbPath = path.join(__dirname, 'rag_knowledge.json');
const sampleKbPath = path.join(__dirname, 'sample_rag_knowledge.json');
const srcSampleKbPath = path.join(__dirname, '../../../src/services/rag/sample_rag_knowledge.json');
const srcFullKbPath = path.join(__dirname, '../../../src/services/rag/rag_knowledge.json');

if (fs.existsSync(fullKbPath)) {
  knowledgeData = JSON.parse(fs.readFileSync(fullKbPath, 'utf-8'));
} else if (fs.existsSync(srcFullKbPath)) {
  knowledgeData = JSON.parse(fs.readFileSync(srcFullKbPath, 'utf-8'));
} else if (fs.existsSync(sampleKbPath)) {
  knowledgeData = JSON.parse(fs.readFileSync(sampleKbPath, 'utf-8'));
} else if (fs.existsSync(srcSampleKbPath)) {
  knowledgeData = JSON.parse(fs.readFileSync(srcSampleKbPath, 'utf-8'));
} else {
  console.warn('[RAG] No knowledge base JSON files found.');
}

export interface DocumentChunk {
  id: string;
  metadata: {
    category: string;
    source: string;
    book?: string;
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
    title?: string;
  };
  text: string;
}

export const bookChunks: DocumentChunk[] = (knowledgeData as any[]).map(item => ({
  id: item.id,
  metadata: {
    category: item.category || 'General',
    source: item.source || 'Discover The Wealth Within You',
    book: item.book || 'Discover The Wealth Within You',
    author: item.author || 'Ric Edelman',
    part: item.part,
    chapter: item.chapter,
    section: item.section,
    subsection: item.subsection,
    page_start: item.page_start,
    page_end: item.page_end,
    pages: item.pages,
    document_order: item.document_order,
    previous_chunk_id: item.previous_chunk_id,
    next_chunk_id: item.next_chunk_id,
    token_count: item.token_count,
    keywords: item.keywords,
    title: item.title || item.source
  },
  text: item.text
}));
