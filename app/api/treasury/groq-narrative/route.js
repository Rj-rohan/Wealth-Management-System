import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const body = await request.json();
    const { forecastData } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(getMockNarrative(forecastData));
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a treasury management expert. Respond ONLY with valid JSON, no markdown.",
        },
        {
          role: "user",
          content: `Given treasury forecast data: ${JSON.stringify(forecastData)}. Write a 4-sentence executive summary of cash health and 3 specific actions. Respond in JSON: { "summary": "string", "actions": ["string", "string", "string"] }`,
        },
      ],
      temperature: 0.5,
      max_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(content);
      return Response.json(parsed);
    } catch {
      return Response.json(getMockNarrative(forecastData));
    }
  } catch (error) {
    console.error("Treasury narrative error:", error);
    return Response.json(getMockNarrative());
  }
}

function getMockNarrative(data) {
  return {
    summary: `The treasury position remains stable with a current cash balance of ₹${((data?.currentCash || 8500000) / 100000).toFixed(1)} lakhs. Over the next 90 days, cash flow projections indicate a gradual build-up driven by consistent monthly inflows averaging ₹${((data?.monthlyAvgInflow || 5200000) / 100000).toFixed(0)}L against outflows of ₹${((data?.monthlyAvgOutflow || 4400000) / 100000).toFixed(0)}L. ${data?.shortfallDates?.length > 0 ? `There are ${data.shortfallDates.length} potential shortfall dates that require attention around end-of-quarter payment cycles.` : "No shortfall periods are anticipated in the projection window."} The idle cash of ₹${((data?.idleCashAmount || 2000000) / 100000).toFixed(1)}L presents an opportunity to earn additional returns through a structured FD ladder.`,
    actions: [
      "Deploy ₹" + ((data?.idleCashAmount || 2000000) / 100000).toFixed(0) + "L idle cash into a 30-60-90 day FD ladder to earn an estimated ₹" + Math.round(((data?.idleCashAmount || 2000000) * 0.07 * 60) / 36500).toLocaleString("en-IN") + " additional returns",
      "Set up automated alerts for cash balance dropping below ₹" + Math.round((data?.monthlyAvgOutflow || 4400000) * 0.3 / 100000) + "L to trigger contingency protocols",
      "Negotiate 15-day payment term extensions with top 3 vendors to improve working capital cycle by an estimated 8-10 days",
    ],
  };
}
