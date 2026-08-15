import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function exportEmbeddingsToJson(): Promise<string> {
  console.log('[Exporter] Fetching stored vector embeddings from PostgreSQL (pgvector)...');

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, title, category, page_start, page_end,
           vector_dims(embedding) as dimensions,
           embedding::text as vector_array_str,
           content_hash, text
    FROM document_vector_chunks
    ORDER BY document_order ASC;
  `);

  console.log(`[Exporter] Retrieved ${rows.length} vector records from PostgreSQL.`);

  const jsonExport = rows.map(r => {
    let vecArray: number[] = [];
    try {
      vecArray = JSON.parse(r.vector_array_str);
    } catch (e) {
      vecArray = r.vector_array_str.replace(/[\[\]]/g, '').split(',').map(Number);
    }

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      page_start: r.page_start,
      page_end: r.page_end,
      dimensions: r.dimensions,
      content_hash: r.content_hash,
      embedding: vecArray,
      text_snippet: r.text.substring(0, 150) + '...'
    };
  });

  const exportPath = path.join(__dirname, 'pgvector_embeddings_dump.json');
  fs.writeFileSync(exportPath, JSON.stringify(jsonExport, null, 2), 'utf-8');

  console.log(`✅ [Exporter] Successfully saved ${jsonExport.length} embeddings to JSON file:\n${exportPath}`);
  return exportPath;
}

if (require.main === module) {
  exportEmbeddingsToJson().finally(() => prisma.$disconnect());
}
