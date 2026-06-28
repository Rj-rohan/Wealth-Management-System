import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Messages array required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Return mock streaming response
      return createMockStream(messages);
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are an elite CFO advisor for MyMoneyPlant Wealth Management. You have real-time financial data.

Current financial context:
- Portfolio Value: ₹${context?.portfolioValue?.toLocaleString("en-IN") || "24,50,000"}
- Cash Position: ₹${context?.cashPosition?.toLocaleString("en-IN") || "8,50,000"}
- Risk Score: ${context?.riskScore || 42}/100
- Top Holdings: ${context?.topHoldings?.join(", ") || "TCS, Infosys, HDFC Bank, NTPC"}

Always respond in JSON format: { "answer": "string", "insights": ["string"], "suggestedActions": ["string"], "chartData": null }
Be concise, specific, cite numbers. Use ₹ for currency. Reference Indian markets.`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    // Create a ReadableStream from the Groq stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("AI CFO error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}

function createMockStream(messages) {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const mockResponse = JSON.stringify({
    answer: `Based on the current portfolio analysis, your wealth position remains strong. The portfolio is well-diversified across IT, Banking, and Power sectors with a total value of ₹24,50,000. The risk score of 42/100 indicates a moderate risk profile which aligns well with your investment strategy. I recommend maintaining the current allocation while watching for opportunities in the FMCG sector.`,
    insights: [
      "Portfolio up 12.3% YTD, outperforming Nifty 50 by 3.2%",
      "Cash position of ₹8.5L provides 3 months of liquidity buffer",
      "IT sector allocation at 35% — consider rebalancing above 40%",
      "Dividend income projected at ₹1.2L for this fiscal year",
    ],
    suggestedActions: [
      "Review HDFC Bank position — consider adding on dips below ₹1,600",
      "Set up SIP of ₹25,000/month in Nifty 50 index fund for stability",
      "Consider booking partial profits in TCS above ₹4,000 to reduce concentration",
    ],
  });

  const encoder = new TextEncoder();
  let index = 0;

  const readable = new ReadableStream({
    async pull(controller) {
      if (index < mockResponse.length) {
        const chunk = mockResponse.slice(index, index + 3);
        controller.enqueue(encoder.encode(chunk));
        index += 3;
        await new Promise((r) => setTimeout(r, 15));
      } else {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
