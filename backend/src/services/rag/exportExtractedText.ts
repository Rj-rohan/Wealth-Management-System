import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function exportTextOnly(): Promise<{ jsonPath: string; mdPath: string }> {
  console.log('[Exporter] Fetching extracted text...');

  let rows: any[] = [];
  try {
    rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, title, book, chapter, section, page_start, page_end, text, content_hash
      FROM document_vector_chunks
      WHERE is_summary = false
      ORDER BY document_order ASC;
    `);
  } catch (err) {
    console.warn('[Exporter] Could not query PostgreSQL directly, falling back to rag_knowledge.json');
  }

  if (!rows || rows.length < 200) {
    const ragPath = path.join(__dirname, 'rag_knowledge.json');
    if (fs.existsSync(ragPath)) {
      const data = JSON.parse(fs.readFileSync(ragPath, 'utf-8'));
      rows = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        book: item.book,
        chapter: item.chapter,
        section: item.section,
        page_start: item.page_start,
        page_end: item.page_end,
        text: item.text
      }));
      console.log(`[Exporter] Loaded all ${rows.length} complete chunks from rag_knowledge.json`);
    }
  } else {
    console.log(`[Exporter] Fetched ${rows.length} chunks from PostgreSQL.`);
  }

  const textOnlyJSON = rows.map((r, idx) => ({
    chunk_number: idx + 1,
    id: r.id,
    title: r.title,
    chapter: r.chapter,
    section: r.section,
    pdf_pages: `Page ${r.page_start} to ${r.page_end}`,
    full_text: r.text
  }));

  const jsonPath = path.join(__dirname, 'extracted_book_text.json');
  fs.writeFileSync(jsonPath, JSON.stringify(textOnlyJSON, null, 2), 'utf-8');

  // Also build clean Markdown Reader Document
  let mdContent = `# Extracted Book Text Reader\n\nTotal Chunks: ${textOnlyJSON.length}\n\n---\n\n`;
  textOnlyJSON.forEach(c => {
    mdContent += `## Chunk ${c.chunk_number}: ${c.title}\n`;
    mdContent += `- **Chunk ID**: \`${c.id}\`\n`;
    mdContent += `- **Chapter**: ${c.chapter}\n`;
    mdContent += `- **Section**: ${c.section}\n`;
    mdContent += `- **PDF Location**: ${c.pdf_pages}\n\n`;
    mdContent += `### Extracted Text:\n\n${c.full_text}\n\n---\n\n`;
  });

  const mdPath = path.join(__dirname, 'extracted_book_text.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');

  console.log(`✅ Extracted text saved to:\n1. JSON: ${jsonPath}\n2. Markdown: ${mdPath}`);
  return { jsonPath, mdPath };
}

if (require.main === module) {
  exportTextOnly().finally(() => prisma.$disconnect());
}
