import { GoogleGenerativeAI } from '@google/generative-ai';
import { VectorSearchResult } from './vectorStore';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
  'do', 'does', 'did', 'done', 'doing', 'have', 'has', 'had', 'having',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us',
  'for', 'and', 'nor', 'but', 'or', 'yet', 'so', 'at', 'by', 'in', 'of', 'on', 'to', 'from', 'with', 'about'
]);

/**
 * Fast in-memory relevance reranking using Term Frequency & Proper Noun Density (< 1ms execution).
 */
export function fastLocalRerank(query: string, candidates: VectorSearchResult[]): VectorSearchResult[] {
  if (candidates.length <= 1) return candidates;

  const rawWords = query.split(/\W+/).filter(w => w.length > 2);
  const terms = rawWords.map(w => w.toLowerCase()).filter(w => !STOP_WORDS.has(w));
  if (terms.length === 0) return candidates;

  // Identify Proper Nouns in original query (e.g. Evelyn, Vandermark, Lillian, Brown, Newton)
  const properNouns = rawWords.filter(w => w[0] && w[0] === w[0].toUpperCase() && !STOP_WORDS.has(w.toLowerCase())).map(w => w.toLowerCase());

  const scored = candidates.map(c => {
    const textLower = c.text.toLowerCase();
    const titleLower = (c.metadata.title || '').toLowerCase();
    
    let matchScore = 0;
    terms.forEach(t => {
      const isProper = properNouns.includes(t);
      const weight = isProper ? 8.0 : 1.5;

      // Heavy bonus for title / section matches
      if (titleLower.includes(t)) matchScore += weight * 3.0;

      // Count occurrences in body text
      const occurrences = (textLower.match(new RegExp(reEscape(t), 'g')) || []).length;
      matchScore += Math.min(occurrences, 5) * weight;
    });

    return {
      candidate: c,
      finalScore: (c.score || 0.5) * 0.3 + (matchScore / (terms.length * 5)) * 0.7
    };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return scored.map(s => s.candidate);
}

function reEscape(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function rerankChunks(query: string, candidates: VectorSearchResult[]): Promise<VectorSearchResult[]> {
  if (candidates.length <= 1) return candidates;
  if (process.env.RETRIEVAL_ENABLE_RERANKING === 'false') {
    return fastLocalRerank(query, candidates);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fastLocalRerank(query, candidates);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const candidateTexts = candidates.map((c, i) => `${i + 1}. ${c.text.substring(0, 300)}`).join('\n\n');

    const prompt = `
Query: "${query}"
Rank these candidates by financial relevance. Output JSON array of candidate numbers, e.g. [1, 2, 3].
Candidates:
${candidateTexts}
`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('[Reranker] LLM Reranker timeout (1200ms Exceeded)')), 1200)
    );

    const apiPromise = model.generateContent(prompt);
    const result = await Promise.race([apiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text().trim().replace(/```json/gi, '').replace(/```/g, '').trim();

    const ranks: number[] = JSON.parse(text);
    if (!Array.isArray(ranks)) return fastLocalRerank(query, candidates);

    const reranked: VectorSearchResult[] = [];
    for (const rank of ranks) {
      const idx = rank - 1;
      if (idx >= 0 && idx < candidates.length && !reranked.find(r => r.id === candidates[idx].id)) {
        reranked.push(candidates[idx]);
      }
    }
    for (const c of candidates) {
      if (!reranked.find(r => r.id === c.id)) reranked.push(c);
    }
    return reranked;
  } catch (error) {
    return fastLocalRerank(query, candidates);
  }
}
