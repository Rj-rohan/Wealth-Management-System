/**
 * Market data service — live quotes and market news.
 *
 * Ported from the Next.js route handlers `app/api/market/quotes` and
 * `app/api/market/news`. Behaviour is unchanged: Serper is used when
 * SERPER_API_KEY is configured, and the curated fallback dataset is served
 * otherwise so the Market Pulse screen always renders.
 */

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface NewsArticle {
  title: string;
  snippet: string;
  url: string;
  source: string;
  publishedAt: string;
}

// Server-side cache for stock quotes
const quoteCache = new Map<string, { data: Quote; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const results: Quote[] = [];

  for (const symbol of symbols) {
    // Check cache first
    const cached = quoteCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      results.push(cached.data);
      continue;
    }

    try {
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        results.push(getFallbackQuote(symbol));
        continue;
      }

      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: `${symbol} stock price NSE today` }),
      });

      if (!res.ok) {
        results.push(getFallbackQuote(symbol));
        continue;
      }

      const data = (await res.json()) as any;
      const quote = parseQuoteFromSerper(symbol, data);

      // Cache the result
      quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
      results.push(quote);
    } catch {
      results.push(getFallbackQuote(symbol));
    }
  }

  return results;
}

function parseQuoteFromSerper(symbol: string, data: any): Quote {
  let price: number | null = null;
  let change: number | null = null;
  let changePercent: number | null = null;

  // Try answerBox first
  if (data.answerBox) {
    const text = data.answerBox.answer || data.answerBox.snippet || '';
    const priceMatch = text.match(/₹?\s?([\d,]+\.?\d*)/);
    if (priceMatch) price = parseFloat(priceMatch[1].replace(/,/g, ''));
    const changeMatch = text.match(/([+-]?\d+\.?\d*)\s*%/);
    if (changeMatch) changePercent = parseFloat(changeMatch[1]);
  }

  // Fallback to organic snippets
  if (!price && data.organic && data.organic.length > 0) {
    for (const result of data.organic.slice(0, 3)) {
      const snippet = result.snippet || '';
      const priceMatch = snippet.match(/₹?\s?([\d,]+\.?\d*)/);
      if (priceMatch && !price) price = parseFloat(priceMatch[1].replace(/,/g, ''));
      const changeMatch = snippet.match(/([+-]?\d+\.?\d*)\s*%/);
      if (changeMatch && !changePercent) changePercent = parseFloat(changeMatch[1]);
    }
  }

  // Final fallback to the curated dataset
  if (!price) return getFallbackQuote(symbol);

  if (changePercent && price) {
    change = (price * changePercent) / 100;
  }

  return {
    symbol,
    price: price || 0,
    change: change || 0,
    changePercent: changePercent || 0,
    lastUpdated: new Date().toISOString(),
  };
}

const FALLBACK_QUOTES: Record<string, { price: number; change: number; changePercent: number }> = {
  INFY: { price: 1842, change: 23.5, changePercent: 1.29 },
  TCS: { price: 3891, change: -15.2, changePercent: -0.39 },
  HDFC: { price: 1678, change: 12.8, changePercent: 0.77 },
  NTPC: { price: 364, change: 5.2, changePercent: 1.45 },
  APOLLOTYRE: { price: 512, change: -8.3, changePercent: -1.6 },
  CEATLTD: { price: 3102, change: 45.7, changePercent: 1.5 },
  INDUSINDBK: { price: 1024, change: -18.4, changePercent: -1.77 },
  UJJIVANSFB: { price: 482, change: 6.1, changePercent: 1.28 },
  HINDUNILVR: { price: 2478, change: -3.2, changePercent: -0.13 },
  RELIANCE: { price: 2945, change: 32.1, changePercent: 1.1 },
  HDFCBANK: { price: 1612, change: 8.9, changePercent: 0.56 },
  ICICIBANK: { price: 1245, change: -5.6, changePercent: -0.45 },
  SBIN: { price: 832, change: 11.3, changePercent: 1.38 },
  WIPRO: { price: 467, change: -2.1, changePercent: -0.45 },
  BHARTIARTL: { price: 1523, change: 18.7, changePercent: 1.24 },
  ITC: { price: 442, change: 3.8, changePercent: 0.87 },
  KOTAKBANK: { price: 1876, change: -7.2, changePercent: -0.38 },
  LT: { price: 3456, change: 28.4, changePercent: 0.83 },
  TATAMOTORS: { price: 987, change: -14.5, changePercent: -1.45 },
  SUNPHARMA: { price: 1234, change: 9.6, changePercent: 0.78 },
};

function getFallbackQuote(symbol: string): Quote {
  const data = FALLBACK_QUOTES[symbol] || {
    price: Math.round(500 + Math.random() * 3000),
    change: parseFloat((Math.random() * 40 - 20).toFixed(1)),
    changePercent: parseFloat((Math.random() * 4 - 2).toFixed(2)),
  };

  return {
    symbol,
    ...data,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getMarketNews(): Promise<NewsArticle[]> {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return getFallbackNews();

    const res = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: 'Indian stock market BSE NSE today', num: 8 }),
    });

    if (!res.ok) return getFallbackNews();

    const data = (await res.json()) as any;
    const articles: NewsArticle[] = (data.news || []).slice(0, 8).map((item: any) => ({
      title: item.title,
      snippet: item.snippet || '',
      url: item.link,
      source: item.source || 'Market News',
      publishedAt: item.date || new Date().toISOString(),
    }));

    return articles.length > 0 ? articles : getFallbackNews();
  } catch {
    return getFallbackNews();
  }
}

function getFallbackNews(): NewsArticle[] {
  return [
    {
      title: 'Sensex surges 450 points as IT, banking stocks rally',
      snippet:
        "The BSE Sensex jumped 450 points in early trade led by strong gains in IT and banking counters. TCS, Infosys, and HDFC Bank were the top contributors to the benchmark's rally.",
      url: 'https://example.com/news/1',
      source: 'Economic Times',
      publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      title: 'RBI holds repo rate steady at 6.5%, maintains accommodative stance',
      snippet:
        'The Reserve Bank of India kept the benchmark lending rate unchanged at 6.5% for the seventh consecutive meeting while maintaining an accommodative monetary policy stance.',
      url: 'https://example.com/news/2',
      source: 'Mint',
      publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      title: 'FII inflows cross ₹15,000 crore in June, highest in 6 months',
      snippet:
        'Foreign institutional investors have pumped in over ₹15,000 crore into Indian equities in June, marking the highest monthly inflow in six months amid global risk-on sentiment.',
      url: 'https://example.com/news/3',
      source: 'Business Standard',
      publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      title: 'NTPC Green Energy IPO subscribed 3.2x on day 2',
      snippet:
        "NTPC Green Energy's initial public offering was subscribed 3.2 times on the second day of bidding, driven by strong interest from retail and institutional investors.",
      url: 'https://example.com/news/4',
      source: 'Moneycontrol',
      publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      title: 'Auto sector outlook positive: Apollo Tyres, CEAT in focus',
      snippet:
        'Analysts maintain a positive outlook on the auto ancillary sector with Apollo Tyres and CEAT expected to benefit from rising domestic demand and easing raw material costs.',
      url: 'https://example.com/news/5',
      source: 'CNBC-TV18',
      publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      title: 'Nifty IT index hits all-time high, TCS leads the pack',
      snippet:
        'The Nifty IT index hit a fresh all-time high with TCS leading gains after reporting better-than-expected quarterly earnings and raising its full-year revenue guidance.',
      url: 'https://example.com/news/6',
      source: 'LiveMint',
      publishedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    },
    {
      title: 'Gold prices steady near ₹72,000 per 10 grams on global cues',
      snippet:
        "Gold prices remained stable near ₹72,000 per 10 grams in Indian markets, tracking global cues as investors await US Federal Reserve's interest rate decision.",
      url: 'https://example.com/news/7',
      source: 'Financial Express',
      publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    },
    {
      title: "India's GDP growth forecast raised to 7.2% by World Bank",
      snippet:
        "The World Bank has revised India's GDP growth forecast upward to 7.2% for the current fiscal year, citing robust domestic consumption and infrastructure spending.",
      url: 'https://example.com/news/8',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
  ];
}
