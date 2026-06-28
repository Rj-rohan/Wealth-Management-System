import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const body = await request.json();
    const { reportType, period, companyData } = body;

    if (!reportType || !period) {
      return Response.json({ error: "reportType and period are required" }, { status: 400 });
    }

    // Fetch market benchmark via Serper
    let benchmarkData = null;
    const serperKey = process.env.SERPER_API_KEY;
    if (serperKey) {
      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: `BSE Sensex performance ${period} returns` }),
        });
        if (res.ok) {
          const data = await res.json();
          const snippet = data.answerBox?.answer || data.answerBox?.snippet ||
            data.organic?.[0]?.snippet || "";
          benchmarkData = { query: `BSE Sensex ${period}`, snippet };
        }
      } catch {
        // Serper optional
      }
    }

    if (!benchmarkData) {
      benchmarkData = {
        query: `BSE Sensex ${period}`,
        snippet: "The BSE Sensex delivered 14.2% returns during the period, outperforming most emerging market peers. Nifty 50 gained 13.8%, with IT and Banking sectors leading the rally. FII inflows remained strong at ₹45,000 crore.",
      };
    }

    // Generate report via Groq
    const mockCompanyData = companyData || {
      portfolioValue: 2450000,
      totalReturn: 12.3,
      cashPosition: 850000,
      riskScore: 42,
      topHoldings: [
        { name: "TCS", weight: 24, return: 18.5 },
        { name: "Infosys", weight: 19, return: 14.2 },
        { name: "HDFC Bank", weight: 14, return: 8.9 },
        { name: "NTPC", weight: 11, return: 22.1 },
        { name: "HUL", weight: 10, return: 5.4 },
      ],
      sectorAllocation: { IT: 43, Banking: 20, Power: 11, FMCG: 10, Tyres: 16 },
    };

    let sections = [];
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are writing a professional corporate financial report. Use ₹ for currency. Be specific, cite all numbers. Return plain text with section headers marked as ##.",
            },
            {
              role: "user",
              content: `Company data: ${JSON.stringify(mockCompanyData)}. Market benchmark: ${JSON.stringify(benchmarkData)}. Write a complete ${reportType} report for the period ${period} with sections: Executive Summary, Performance Analysis, Risk Assessment, Outlook. Each section should be 2-3 paragraphs.`,
            },
          ],
          temperature: 0.6,
          max_tokens: 2048,
        });

        const content = completion.choices[0]?.message?.content || "";
        sections = parseSections(content);
      } catch {
        sections = getMockSections(reportType, period, mockCompanyData, benchmarkData);
      }
    } else {
      sections = getMockSections(reportType, period, mockCompanyData, benchmarkData);
    }

    return Response.json({
      sections,
      generatedAt: new Date().toISOString(),
      reportType,
      period,
      benchmarkData,
      wordCount: sections.reduce((s, sec) => s + sec.content.split(/\s+/).length, 0),
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

function parseSections(text) {
  const parts = text.split(/^##\s*/m).filter(Boolean);
  return parts.map((part) => {
    const lines = part.trim().split("\n");
    const title = lines[0].trim();
    const content = lines.slice(1).join("\n").trim();
    return { title, content };
  });
}

function getMockSections(reportType, period, data, benchmark) {
  return [
    {
      title: "Executive Summary",
      content: `This ${reportType} report covers the period ${period} for the MyMoneyPlant wealth portfolio. The portfolio delivered a total return of ${data.totalReturn}%, with a current valuation of ₹${(data.portfolioValue / 100000).toFixed(1)} lakhs. During the same period, the BSE Sensex delivered approximately 14.2% returns, indicating our portfolio performed in line with the broader market.\n\nThe portfolio maintains a healthy cash position of ₹${(data.cashPosition / 100000).toFixed(1)} lakhs, representing approximately ${((data.cashPosition / data.portfolioValue) * 100).toFixed(0)}% of total portfolio value. The overall risk score stands at ${data.riskScore}/100, well within the moderate risk band and aligned with the investment strategy.`,
    },
    {
      title: "Performance Analysis",
      content: `The portfolio's top performer was NTPC with a ${data.topHoldings[3].return}% return, followed by TCS at ${data.topHoldings[0].return}%. The IT sector allocation of ${data.sectorAllocation.IT}% proved beneficial as the Nifty IT index hit all-time highs during the period. HDFC Bank contributed steady returns of ${data.topHoldings[2].return}% despite banking sector volatility.\n\nSector-wise, the IT-heavy allocation (${data.sectorAllocation.IT}%) was the primary return driver, contributing approximately 55% of total gains. The Tyres sector allocation (${data.sectorAllocation.Tyres}%) provided diversification benefits with moderate returns. HUL, while defensive, contributed the least at ${data.topHoldings[4].return}% due to elevated valuations in the FMCG space.\n\nOn a risk-adjusted basis (Sharpe ratio), the portfolio scored 1.42, comparing favorably to the benchmark's 1.28. Maximum drawdown during the period was -6.2%, well within the -15% tolerance band.`,
    },
    {
      title: "Risk Assessment",
      content: `The portfolio risk score of ${data.riskScore}/100 reflects a well-balanced approach between growth and capital preservation. Key risk factors include concentration in IT (${data.sectorAllocation.IT}% of portfolio), which exposes the portfolio to US technology spending cycles and rupee appreciation risk.\n\nStress testing reveals that a 20% market correction would reduce portfolio value by approximately ₹${Math.round(data.portfolioValue * 0.18 / 100000)} lakhs, with an estimated recovery period of 72 days based on historical patterns. The cash buffer of ₹${(data.cashPosition / 100000).toFixed(1)} lakhs provides adequate liquidity for 3+ months without forced selling.\n\nCredit risk remains minimal as all equity holdings are in companies with investment-grade ratings and strong balance sheets. Market risk is the primary concern, particularly in the mid-cap Tyres segment.`,
    },
    {
      title: "Outlook",
      content: `Looking ahead, the Indian equity market outlook remains cautiously optimistic. The BSE Sensex is expected to trade in the 72,000-78,000 range over the next quarter, supported by strong domestic flows and improving corporate earnings. The RBI's accommodative stance should continue to provide a supportive macro backdrop.\n\nFor this portfolio, we recommend maintaining the current IT overweight given the strong deal pipeline visibility at TCS and Infosys. However, we suggest gradually reducing the Tyres allocation from ${data.sectorAllocation.Tyres}% to 10% and redirecting towards the Banking sector, which offers better risk-reward at current valuations.\n\nKey catalysts to watch: Q2 earnings season (expected 12-15% Nifty EPS growth), RBI policy decisions, US Fed rate trajectory, and FII flow patterns. We recommend a quarterly review of the allocation strategy with particular attention to the IT sector's performance relative to the benchmark.`,
    },
  ];
}
