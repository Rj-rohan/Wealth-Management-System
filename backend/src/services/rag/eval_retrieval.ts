import 'dotenv/config';
import { retrieveChunks } from './retrieval';
import { ragEngine, performGroundingCheck, checkAnswerSourceOverlap } from './engine';
import { DocumentChunk } from './chunks';

export interface TestCase {
  id: number;
  question: string;
  expectedCategory: string;
  expectedKeywords: string[];
  expectedChapterOrSection: string;
  forbiddenKeywords?: string[];
}

export const TEST_SUITE: TestCase[] = [
  {
    id: 1,
    question: "what is the cabbie analogy for financial planning",
    expectedCategory: "Goal Planning",
    expectedKeywords: ["cabbie", "destination", "driver"],
    expectedChapterOrSection: "Does the Cabbie Know Where You Want to Go?",
    forbiddenKeywords: ["21.99%", "net worth: ₹"]
  },
  {
    id: 2,
    question: "who is evelyn vandermark and what was her skydiving birthday goal",
    expectedCategory: "Goal Planning",
    expectedKeywords: ["evelyn", "skydiving", "birthday"],
    expectedChapterOrSection: "Meet Evelyn Vandermark",
    forbiddenKeywords: ["21.99%", "net worth: ₹"]
  },
  {
    id: 3,
    question: "who is lillian brown and what travel goals did she set at 87",
    expectedCategory: "Goal Planning",
    expectedKeywords: ["lillian", "machu picchu"],
    expectedChapterOrSection: "Meet Lillian Brown",
    forbiddenKeywords: ["21.99%", "net worth: ₹"]
  },
  {
    id: 4,
    question: "what is ric edelman's 3 option solver for goal shortfalls",
    expectedCategory: "Goal Planning",
    expectedKeywords: ["shortfall", "option"],
    expectedChapterOrSection: "The Final Step: Use Your Income or Investments to Eliminate Any Shortfall"
  },
  {
    id: 5,
    question: "what is a pound cake one-investment portfolio",
    expectedCategory: "Investment Strategy",
    expectedKeywords: ["pound cake", "one-investment"],
    expectedChapterOrSection: "Pound Cake, the One-Investment Portfolio"
  },
  {
    id: 6,
    question: "what are the dangers of eating today's special and stock analysts",
    expectedCategory: "Investment Strategy",
    expectedKeywords: ["analysts", "special"],
    expectedChapterOrSection: "The Dangers of Eating Today’s Special"
  },
  {
    id: 7,
    question: "wanna buy some tulip bulbs and bill gates richest man",
    expectedCategory: "Investment Strategy",
    expectedKeywords: ["tulip bulbs", "bill gates"],
    expectedChapterOrSection: "Psst. Hey Buddy, Wanna Buy Some Tulip Bulbs?"
  },
  {
    id: 8,
    question: "how institutional investors slice their cakes using ric's recipe",
    expectedCategory: "Asset Allocation",
    expectedKeywords: ["slice", "cake"],
    expectedChapterOrSection: "Bake a Cake Using Ric’s Recipe"
  },
  {
    id: 9,
    question: "four ways you can buy your investments mutual funds variable annuities",
    expectedCategory: "Mutual Funds",
    expectedKeywords: ["mutual funds", "variable annuities"],
    expectedChapterOrSection: "The Four Ways You Can Buy Your Investments"
  },
  {
    id: 10,
    question: "how most people pick their mutual funds and four common problems",
    expectedCategory: "Mutual Funds",
    expectedKeywords: ["problem", "pick"],
    expectedChapterOrSection: "How Most People Pick Their Funds"
  },
  {
    id: 11,
    question: "how to pick mutual funds and expense ratios",
    expectedCategory: "Mutual Funds",
    expectedKeywords: ["expense ratio", "fund"],
    expectedChapterOrSection: "How to Pick Mutual Funds"
  },
  {
    id: 12,
    question: "should you bake cakes or cupcakes and how many funds do you need",
    expectedCategory: "Mutual Funds",
    expectedKeywords: ["cupcakes", "how many funds"],
    expectedChapterOrSection: "Should You Bake Cakes or Cupcakes?"
  },
  {
    id: 13,
    question: "should you rely on active or passive management",
    expectedCategory: "Mutual Funds",
    expectedKeywords: ["active", "passive"],
    expectedChapterOrSection: "Should You Rely on Active or Passive Management?"
  },
  {
    id: 14,
    question: "huge tax surprise for index fund holders",
    expectedCategory: "Mutual Funds",
    expectedKeywords: ["tax surprise", "index fund"],
    expectedChapterOrSection: "Index Fund Holders Could Be Hit With a Huge Tax Surprise"
  },
  {
    id: 15,
    question: "choosing between taxable and tax-deferred accounts",
    expectedCategory: "Tax Planning",
    expectedKeywords: ["taxable", "tax-deferred"],
    expectedChapterOrSection: "Choosing Between Taxable and Tax-Deferred"
  },
  {
    id: 16,
    question: "how much should I save for an emergency fund buffer",
    expectedCategory: "Emergency Fund",
    expectedKeywords: ["emergency fund", "liquid"],
    expectedChapterOrSection: "Emergency Fund"
  },
  {
    id: 17,
    question: "what is the debt avalanche payoff method for high interest debt",
    expectedCategory: "Debt Management",
    expectedKeywords: ["debt", "avalanche"],
    expectedChapterOrSection: "Debt Management"
  },
  {
    id: 18,
    question: "how to calculate retirement longevity and withdrawal sequencing",
    expectedCategory: "Retirement Planning",
    expectedKeywords: ["retirement", "longevity"],
    expectedChapterOrSection: "Retirement Planning"
  },
  {
    id: 19,
    question: "essential estate planning documents living will power of attorney",
    expectedCategory: "Estate Planning",
    expectedKeywords: ["will", "power of attorney"],
    expectedChapterOrSection: "Estate Planning"
  },
  {
    id: 20,
    question: "disability insurance coverage recommendations and gross income protection",
    expectedCategory: "Insurance Planning",
    expectedKeywords: ["disability", "insurance"],
    expectedChapterOrSection: "Insurance Planning"
  },
  {
    id: 21,
    question: "what is ric edelman's 7 pillar wealth health score methodology",
    expectedCategory: "Financial Planning",
    expectedKeywords: ["7-pillar", "wealth health score"],
    expectedChapterOrSection: "Financial Planning"
  },
  {
    id: 22,
    question: "how portfolio rebalancing prevents asset allocation drift",
    expectedCategory: "Asset Allocation",
    expectedKeywords: ["rebalancing", "drift"],
    expectedChapterOrSection: "Asset Allocation"
  },
  {
    id: 23,
    question: "what is dollar cost averaging and systematic investing",
    expectedCategory: "Investment Strategy",
    expectedKeywords: ["dollar cost averaging", "investing"],
    expectedChapterOrSection: "Investment Strategy"
  },
  {
    id: 24,
    question: "how to decide between roth ira and traditional 401k",
    expectedCategory: "Retirement Planning",
    expectedKeywords: ["roth", "401k"],
    expectedChapterOrSection: "Retirement Planning"
  },
  {
    id: 25,
    question: "south sea bubble and sir isaac newton investment mistakes",
    expectedCategory: "Investment Strategy",
    expectedKeywords: ["newton", "tulip"],
    expectedChapterOrSection: "Psst. Hey Buddy, Wanna Buy Some Tulip Bulbs?"
  }
];

function getJaccardTokenSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const set2 = new Set(str2.toLowerCase().split(/\W+/).filter(w => w.length > 2));

  let intersection = 0;
  set1.forEach(w => {
    if (set2.has(w)) intersection++;
  });

  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
}

export async function runEvaluation(): Promise<{ retrievalHitRate: number; answerGroundingPassRate: number }> {
  console.log(`\n==================================================`);
  console.log(`🚀 RUNNING RAG RETRIEVAL & ANSWER GROUNDING EVALUATION (${TEST_SUITE.length} Queries)`);
  console.log(`==================================================\n`);

  let retrievalHits = 0;
  let answerGroundingHits = 0;
  let overlapPassHits = 0;
  let metadataCleanHits = 0;
  const generatedAnswersMap = new Map<number, string>();

  for (const test of TEST_SUITE) {
    const startTime = Date.now();
    
    // 1. Test Retrieval
    const retrievedChunks = await retrieveChunks(test.question, { topK: 20, topN: 5 });
    
    const retrievalHit = retrievedChunks.some(chunk => {
      const chapterMatch = test.expectedChapterOrSection && (
        (chunk.chapter || '').toLowerCase().includes(test.expectedChapterOrSection.toLowerCase()) ||
        (chunk.section || '').toLowerCase().includes(test.expectedChapterOrSection.toLowerCase())
      );

      const keywordMatch = test.expectedKeywords.some(kw =>
        (chunk.text || '').toLowerCase().includes(kw.toLowerCase()) ||
        (chunk.keywords || []).some(k => k.toLowerCase().includes(kw.toLowerCase()))
      );

      const categoryMatch = chunk.category.toLowerCase().includes(test.expectedCategory.toLowerCase()) ||
        chunk.secondary_categories.some(sc => sc.toLowerCase().includes(test.expectedCategory.toLowerCase()));

      return chapterMatch || (keywordMatch && categoryMatch);
    });

    if (retrievalHit) retrievalHits++;

    // 2. Test Answer Generation Grounding
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
      latencyMs: Date.now() - startTime,
      intent: 'Educational' as const,
      targetTopic: test.expectedCategory,
      sources: docChunks.map(c => c.metadata.source || 'Ric Edelman')
    };

    const genRes = await ragEngine.generateResponse(test.question, retrievalResult);
    const answerText = genRes.reply;
    generatedAnswersMap.set(test.id, answerText);

    const answerLower = answerText.toLowerCase();

    // Grounding assertion: must match expected keywords or grounded terms, and must NOT contain forbidden keywords
    const containsExpectedKeyword = test.expectedKeywords.some(kw => {
      const kwLower = kw.toLowerCase();
      return answerLower.includes(kwLower) || kwLower.split(/\s+/).some(w => w.length > 3 && answerLower.includes(w));
    });
    const containsForbiddenKeyword = (test.forbiddenKeywords || []).some(fkw => answerLower.includes(fkw.toLowerCase()));
    
    const groundingCheck = performGroundingCheck(answerText, docChunks);
    const isAnswerGrounded = (containsExpectedKeyword || groundingCheck.isGrounded) && !containsForbiddenKeyword;

    const overlapCheck = checkAnswerSourceOverlap(answerText, docChunks);
    const isOverlapPass = !overlapCheck.isOverlapping;

    const containsMetadataLeak = /source:|chunk_\d+|\(pp\.\s*\d+-\d+\)|i found relevant information/i.test(answerText);
    const hasForbiddenIntro = /^(strategic wealth guidance|regarding|core wealth management principles|direct answer|it is important to note|effective wealth strategy for)/i.test(answerText.trim());
    const isMetadataClean = !containsMetadataLeak && !hasForbiddenIntro;

    if (isAnswerGrounded) answerGroundingHits++;
    if (isOverlapPass) overlapPassHits++;
    if (isMetadataClean) metadataCleanHits++;

    const latency = Date.now() - startTime;
    const statusSymbol = (retrievalHit && isAnswerGrounded && isOverlapPass && isMetadataClean) ? '✅ PASS' : '❌ FAIL';

    console.log(`[Q${test.id.toString().padStart(2, '0')}] ${statusSymbol} (${latency}ms) — "${test.question}"`);
    console.log(`      Retrieved: ${retrievedChunks[0]?.id || 'None'} (${retrievedChunks[0]?.chapter || ''}) | Grounded: ${isAnswerGrounded ? 'YES' : 'NO'} | Clean: ${isMetadataClean ? 'YES' : 'NO'}`);
    console.log(`      Answer snippet: "${answerText.substring(0, 120).replace(/\n/g, ' ')}..."\n`);
  }

  // 3. Duplicate Answer Guard
  let duplicateCount = 0;
  const ids = Array.from(generatedAnswersMap.keys());
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const ans1 = generatedAnswersMap.get(ids[i])!;
      const ans2 = generatedAnswersMap.get(ids[j])!;
      const sim = getJaccardTokenSimilarity(ans1, ans2);
      if (sim >= 0.99) {
        duplicateCount++;
        console.warn(`⚠️ Duplicate Answer Warning between Q${ids[i]} and Q${ids[j]} (Jaccard similarity: ${sim.toFixed(2)})`);
      }
    }
  }

  const retrievalHitRate = (retrievalHits / TEST_SUITE.length) * 100;
  const answerGroundingPassRate = (answerGroundingHits / TEST_SUITE.length) * 100;
  const overlapPassRate = (overlapPassHits / TEST_SUITE.length) * 100;
  const metadataCleanRate = (metadataCleanHits / TEST_SUITE.length) * 100;

  console.log(`==================================================`);
  console.log(`📊 EVALUATION SUMMARY:`);
  console.log(`   - Total Queries: ${TEST_SUITE.length}`);
  console.log(`   - Retrieval Hit Rate: ${retrievalHitRate.toFixed(1)}% (Threshold >= 80%)`);
  console.log(`   - Answer Grounding Pass Rate: ${answerGroundingPassRate.toFixed(1)}% (Threshold >= 80%)`);
  console.log(`   - Source Text Paraphrasing Pass Rate: ${overlapPassRate.toFixed(1)}% (Threshold >= 80%)`);
  console.log(`   - Zero Metadata Leakage Pass Rate: ${metadataCleanRate.toFixed(1)}% (Threshold = 100%)`);
  console.log(`   - Near-Duplicate Answers Flagged: ${duplicateCount}`);
  console.log(`==================================================\n`);

  if (retrievalHitRate >= 80 && answerGroundingPassRate >= 80 && overlapPassRate >= 80 && metadataCleanRate === 100 && duplicateCount === 0) {
    console.log(`🎉 ALL ACCEPTANCE CRITERIA PASSED! Conversational Advisor Response Verified.\n`);
  } else {
    console.warn(`⚠️ ACCEPTANCE CRITERIA WARNING: Check detailed scores above.\n`);
  }

  return { retrievalHitRate, answerGroundingPassRate };
}

if (require.main === module) {
  runEvaluation().then(() => process.exit(0)).catch(err => {
    console.error('Eval error:', err);
    process.exit(1);
  });
}
