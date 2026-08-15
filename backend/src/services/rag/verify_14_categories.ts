import { ragEngine } from './engine';
import { retrieveChunks } from './retrieval';
import { DocumentChunk } from './chunks';

const TEST_QUERIES = [
  { category: "1. Book Concepts", query: "What is the cabbie analogy for financial planning?" },
  { category: "2. Case Studies", query: "Who is Evelyn Vandermark?" },
  { category: "3. Chapter-Specific Questions", query: "What are the key lessons from Chapter 8?" },
  { category: "4. Section-Specific Questions", query: "Explain 'The World’s Dumbest Investor'." },
  { category: "5. Comparison Questions", query: "Active vs passive mutual funds." },
  { category: "6. How-To Questions", query: "How do I build an emergency fund?" },
  { category: "7. Why Questions", query: "Why are goals important before investing?" },
  { category: "8. Scenario-Based Questions", query: "I have ₹50,000 monthly expenses. How much emergency fund should I keep?" },
  { category: "9. Entity Retrieval", query: "Who is Bill Gates in the context of this book?" },
  { category: "10. Lists", query: "What are the steps for creating a financial plan?" },
  { category: "11. Retrieval Precision", query: "Which chapter explains mutual funds?" },
  { category: "12. Personal Wealth (App Data)", query: "What is my current net worth?" },
  { category: "13. Follow-Up Conversation", query: "What was Evelyn Vandermark's financial lesson?" },
  { category: "14. Edge Cases", query: "Explain it in simple language." }
];

async function testAllCategories() {
  console.log("==================================================");
  console.log("🔍 TESTING AI RESPONSES ACROSS ALL 14 CATEGORIES");
  console.log("==================================================\n");

  const results: Array<{ category: string; query: string; response: string }> = [];

  for (const item of TEST_QUERIES) {
    const retrievedChunks = await retrieveChunks(item.query, { topK: 10, topN: 3 });
    const docChunks: DocumentChunk[] = retrievedChunks.map(c => ({
      id: c.id,
      text: c.text,
      metadata: {
        category: c.category,
        source: `${c.book} - ${c.chapter}`,
        book: c.book,
        chapter: c.chapter || '',
        section: c.section || '',
        keywords: c.keywords
      }
    }));

    const retrievalResult = {
      chunks: docChunks,
      confidenceScore: 0.85,
      latencyMs: 100,
      intent: 'Educational' as const,
      targetTopic: item.category,
      sources: docChunks.map(c => c.metadata.source || 'Ric Edelman')
    };

    const clientContext = {
      whsScore: 47,
      whsCategory: 'Caution',
      netWorth: 227200,
      savingsRate: 0,
      emergencyFundMonths: 6.0,
      outstandingDebt: 45000
    };

    const res = await ragEngine.generateResponse(item.query, retrievalResult, clientContext as any);
    results.push({ category: item.category, query: item.query, response: res.reply });

    console.log(`📌 CATEGORY: ${item.category}`);
    console.log(`❓ QUERY: "${item.query}"`);
    console.log(`💬 RESPONSE:\n${res.reply}`);
    console.log("--------------------------------------------------\n");
  }
}

testAllCategories().catch(console.error);
