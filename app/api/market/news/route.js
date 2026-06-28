export async function GET() {
  try {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      // Return mock news data
      return Response.json(getMockNews());
    }

    const res = await fetch("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: "Indian stock market BSE NSE today", num: 8 }),
    });

    if (!res.ok) {
      return Response.json(getMockNews());
    }

    const data = await res.json();
    const articles = (data.news || []).slice(0, 8).map((item) => ({
      title: item.title,
      snippet: item.snippet || "",
      url: item.link,
      source: item.source || "Market News",
      publishedAt: item.date || new Date().toISOString(),
    }));

    return Response.json(articles.length > 0 ? articles : getMockNews());
  } catch {
    return Response.json(getMockNews());
  }
}

function getMockNews() {
  return [
    {
      title: "Sensex surges 450 points as IT, banking stocks rally",
      snippet: "The BSE Sensex jumped 450 points in early trade led by strong gains in IT and banking counters. TCS, Infosys, and HDFC Bank were the top contributors to the benchmark's rally.",
      url: "https://example.com/news/1",
      source: "Economic Times",
      publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      title: "RBI holds repo rate steady at 6.5%, maintains accommodative stance",
      snippet: "The Reserve Bank of India kept the benchmark lending rate unchanged at 6.5% for the seventh consecutive meeting while maintaining an accommodative monetary policy stance.",
      url: "https://example.com/news/2",
      source: "Mint",
      publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      title: "FII inflows cross ₹15,000 crore in June, highest in 6 months",
      snippet: "Foreign institutional investors have pumped in over ₹15,000 crore into Indian equities in June, marking the highest monthly inflow in six months amid global risk-on sentiment.",
      url: "https://example.com/news/3",
      source: "Business Standard",
      publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      title: "NTPC Green Energy IPO subscribed 3.2x on day 2",
      snippet: "NTPC Green Energy's initial public offering was subscribed 3.2 times on the second day of bidding, driven by strong interest from retail and institutional investors.",
      url: "https://example.com/news/4",
      source: "Moneycontrol",
      publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      title: "Auto sector outlook positive: Apollo Tyres, CEAT in focus",
      snippet: "Analysts maintain a positive outlook on the auto ancillary sector with Apollo Tyres and CEAT expected to benefit from rising domestic demand and easing raw material costs.",
      url: "https://example.com/news/5",
      source: "CNBC-TV18",
      publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      title: "Nifty IT index hits all-time high, TCS leads the pack",
      snippet: "The Nifty IT index hit a fresh all-time high with TCS leading gains after reporting better-than-expected quarterly earnings and raising its full-year revenue guidance.",
      url: "https://example.com/news/6",
      source: "LiveMint",
      publishedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    },
    {
      title: "Gold prices steady near ₹72,000 per 10 grams on global cues",
      snippet: "Gold prices remained stable near ₹72,000 per 10 grams in Indian markets, tracking global cues as investors await US Federal Reserve's interest rate decision.",
      url: "https://example.com/news/7",
      source: "Financial Express",
      publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    },
    {
      title: "India's GDP growth forecast raised to 7.2% by World Bank",
      snippet: "The World Bank has revised India's GDP growth forecast upward to 7.2% for the current fiscal year, citing robust domestic consumption and infrastructure spending.",
      url: "https://example.com/news/8",
      source: "Reuters",
      publishedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
  ];
}
