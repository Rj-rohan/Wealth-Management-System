import { GOLDEN_TEST_CASES, ragEvaluator } from '../evaluation';
import { ragEngine } from '../engine';

async function runGoldenTestSuite() {
  console.log('\n========= 🧪 RAG GOLDEN TEST SUITE RUNNER =========\n');
  let passedCount = 0;

  for (const tc of GOLDEN_TEST_CASES) {
    const startTime = Date.now();
    const retrievalResult = await ragEngine.semanticSearch(tc.query);
    const latencyMs = Date.now() - startTime;

    const evalResult = ragEvaluator.evaluateRetrieval(tc, retrievalResult.chunks, latencyMs);

    if (evalResult.passed) {
      passedCount++;
      console.log(`✅ [PASS] (${tc.id}) ${tc.query}`);
    } else {
      console.log(`❌ [FAIL] (${tc.id}) ${tc.query}`);
    }
    console.log(`   └─ Intent: ${evalResult.intent} | Precision@3: ${evalResult.precisionAtK} | HitRate: ${evalResult.hitRate} | Latency: ${latencyMs}ms | Confidence: ${evalResult.confidenceScore}\n`);
  }

  const passRate = Math.round((passedCount / GOLDEN_TEST_CASES.length) * 100);
  console.log(`====================================================`);
  console.log(`RESULTS: ${passedCount}/${GOLDEN_TEST_CASES.length} Test Cases Passed (${passRate}% Pass Rate)`);
  console.log(`====================================================\n`);
}

runGoldenTestSuite().catch(err => {
  console.error('Golden Test Suite Error:', err);
});
