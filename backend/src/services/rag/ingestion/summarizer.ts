import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateDocumentSummary(fullText: string, category: string, title: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing, cannot generate summaries.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const prompt = `
Summarize the following financial planning document section in exactly 3 sentences.
Ensure the summary covers:
1. The main topic or concept.
2. The core principle or strategy discussed.
3. Who should prioritize this (target audience or situation).

Context Metadata:
- Category: ${category}
- Title: ${title}

Document Text:
${fullText.substring(0, 8000)} // Truncate if extremely long
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    return text;
  } catch (error) {
    console.error(`[Summarizer] Failed to summarize document ${title}:`, error);
    return `Summary of ${title} in the ${category} category. Covers core principles and strategies for financial planning.`;
  }
}
