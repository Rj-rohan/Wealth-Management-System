/**
 * Centralized AI Output Post-Processor & Cleaner.
 * Normalizes ₹ formatting, removes raw markdown header tags, strips internal chunk IDs,
 * deduplicates sentences, and cleans spacing.
 */
export function cleanAIResponseOutput(text: string, isDeveloperDebugMode: boolean = false, stripAsterisks: boolean = true): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove raw markdown section headers, forbidden opening phrases, and static labels
  cleaned = cleaned
    .replace(/^Effective wealth strategy for .*? (focuses|emphasizes|recommends|aligns)/gi, '')
    .replace(/^Effective wealth strategy for .*?\:\s*/gi, '')
    .replace(/^Strategic wealth guidance regarding .*? (emphasizes|recommends)/gi, '')
    .replace(/^Strategic wealth guidance /gi, '')
    .replace(/^Core wealth management principles /gi, '')
    .replace(/^Regarding .*?\:\s*/gi, '')
    .replace(/\*?\*?Direct Answer:\*?\*?\s*/gi, '')
    .replace(/\*?\*?Explanation:\*?\*?\s*/gi, '')
    .replace(/\*?\*?Key Principles:\*?\*?\s*/gi, '')
    .replace(/\*?\*?Practical Guidance:\*?\*?\s*/gi, '')
    .replace(/\*?\*?Key Takeaways:\*?\*?\s*/gi, '')
    .replace(/\*?\*?Recommended Actions:\*?\*?\s*/gi, '')
    .replace(/\*?\*?DYNAMIC ARCHETYPE:.*?\*?\*?\s*/gi, '')
    .replace(/It is important to note that /gi, '')
    .replace(/It is worth noting that /gi, '')
    .replace(/As an AI wealth advisor,? /gi, '')
    .replace(/In conclusion,? /gi, '')
    .replace(/Regarding your query,? /gi, '')
    .replace(/##\s*Summary/gi, '')
    .replace(/##\s*Recommendation/gi, '')
    .replace(/##\s*Action Plan/gi, '')
    .replace(/#{1,6}\s*/g, '');

  // 2. Strip asterisks if requested for clean plain text rendering
  if (stripAsterisks) {
    cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '');
  }

  // 3. Unconditionally strip Sources, citations, page numbers, and technical metadata
  if (!isDeveloperDebugMode) {
    cleaned = cleaned
      .replace(/##\s*Sources[\s\S]*/gi, '')
      .replace(/\*?Source:\*?[\s\S]*/gi, '')
      .replace(/Sources:[\s\S]*/gi, '')
      .replace(/\(pp\.\s*\d+-\d+\)/gi, '')
      .replace(/\(p\.\s*\d+\)/gi, '')
      .replace(/I found relevant information regarding[\s\S]*?but I am unable[\s\S]*?\n\n/gi, '');
  }

  // 4. Strip internal chunk IDs and technical filenames
  cleaned = cleaned
    .replace(/dwwy_chunk_\d+/g, '')
    .replace(/chunk_\d+/g, '')
    .replace(/rag_knowledge\.json/g, '')
    .replace(/book_chunks\.ts/g, '');

  // 5. Normalize Indian Rupee (₹) formatting and clean OCR artifacts
  cleaned = cleaned
    .replace(/INR\s*(\d+)/gi, '₹$1')
    .replace(/Rs\.?\s*(\d+)/gi, '₹$1')
    .replace(/C H A P T E R|C HAPTER/g, 'Chapter')
    .replace(/P A R T|P ART/g, 'Part')
    .replace(/\b([a-z])\s+([a-z]{2,})\b/gi, (match, p1, p2) => {
      // Fix broken single-letter OCR spacing like "e ffort" -> "effort", "f inancial" -> "financial"
      const combined = (p1 + p2).toLowerCase();
      if (['effort', 'financial', 'planning', 'mutual', 'investment', 'strategy', 'advisory', 'retirement', 'insurance', 'emergency', 'portfolio'].includes(combined)) {
        return p1 + p2;
      }
      return match;
    })
    .replace(/\[\d+\]/g, ''); // Strip bracketed footnote digits like [1], [12]

  // 6. Remove consecutive duplicate lines
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (uniqueLines.length === 0 || uniqueLines[uniqueLines.length - 1].trim() !== trimmedLine || trimmedLine === '') {
      uniqueLines.push(line);
    }
  }
  cleaned = uniqueLines.join('\n');

  // 7. Clean multiple empty line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
