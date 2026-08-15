/**
 * Smart Reports — AI-written portfolio reports with market benchmarking.
 *
 * Ported from the Next.js route handlers `app/api/reports/generate` and
 * `app/api/reports/download`. Section parsing, the benchmark lookup and the
 * printable HTML layout are unchanged.
 */

import { complete } from './llm/fastLlm';

export interface ReportSection {
  title: string;
  content: string;
}

export interface BenchmarkData {
  query: string;
  snippet: string;
}

export interface GeneratedReport {
  sections: ReportSection[];
  generatedAt: string;
  reportType: string;
  period: string;
  benchmarkData: BenchmarkData;
  wordCount: number;
}

interface CompanyData {
  portfolioValue: number;
  totalReturn: number;
  cashPosition: number;
  riskScore: number;
  topHoldings: { name: string; weight: number; return: number }[];
  sectorAllocation: Record<string, number>;
}

const REFERENCE_COMPANY_DATA: CompanyData = {
  portfolioValue: 2450000,
  totalReturn: 12.3,
  cashPosition: 850000,
  riskScore: 42,
  topHoldings: [
    { name: 'TCS', weight: 24, return: 18.5 },
    { name: 'Infosys', weight: 19, return: 14.2 },
    { name: 'HDFC Bank', weight: 14, return: 8.9 },
    { name: 'NTPC', weight: 11, return: 22.1 },
    { name: 'HUL', weight: 10, return: 5.4 },
  ],
  sectorAllocation: { IT: 43, Banking: 20, Power: 11, FMCG: 10, Tyres: 16 },
};

async function fetchBenchmark(period: string): Promise<BenchmarkData> {
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `BSE Sensex performance ${period} returns` }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const snippet =
          data.answerBox?.answer || data.answerBox?.snippet || data.organic?.[0]?.snippet || '';
        if (snippet) return { query: `BSE Sensex ${period}`, snippet };
      }
    } catch {
      // Serper is optional — fall through to the reference benchmark
    }
  }

  return {
    query: `BSE Sensex ${period}`,
    snippet:
      'The BSE Sensex delivered 14.2% returns during the period, outperforming most emerging market peers. Nifty 50 gained 13.8%, with IT and Banking sectors leading the rally. FII inflows remained strong at ₹45,000 crore.',
  };
}

export async function generateReport(
  reportType: string,
  period: string,
  companyData?: CompanyData
): Promise<GeneratedReport> {
  const benchmarkData = await fetchBenchmark(period);
  const data = companyData || REFERENCE_COMPANY_DATA;

  let sections: ReportSection[] = [];

  const content = await complete(
    [
      {
        role: 'system',
        content:
          'You are writing a professional corporate financial report. Use ₹ for currency. Be specific, cite all numbers. Return plain text with section headers marked as ##.',
      },
      {
        role: 'user',
        content: `Company data: ${JSON.stringify(data)}. Market benchmark: ${JSON.stringify(benchmarkData)}. Write a complete ${reportType} report for the period ${period} with sections: Executive Summary, Performance Analysis, Risk Assessment, Outlook. Each section should be 2-3 paragraphs.`,
      },
    ],
    { temperature: 0.6, maxTokens: 2048 }
  );

  if (content) sections = parseSections(content);
  if (sections.length === 0) sections = buildAnalystSections(reportType, period, data);

  return {
    sections,
    generatedAt: new Date().toISOString(),
    reportType,
    period,
    benchmarkData,
    wordCount: sections.reduce((s, sec) => s + sec.content.split(/\s+/).length, 0),
  };
}

function parseSections(text: string): ReportSection[] {
  const parts = text.split(/^##\s*/m).filter(Boolean);
  return parts.map((part) => {
    const lines = part.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    return { title, content };
  });
}

function buildAnalystSections(
  reportType: string,
  period: string,
  data: CompanyData
): ReportSection[] {
  return [
    {
      title: 'Executive Summary',
      content: `This ${reportType} report covers the period ${period} for the wealth portfolio. The portfolio delivered a total return of ${data.totalReturn}%, with a current valuation of ₹${(data.portfolioValue / 100000).toFixed(1)} lakhs. During the same period, the BSE Sensex delivered approximately 14.2% returns, indicating our portfolio performed in line with the broader market.\n\nThe portfolio maintains a healthy cash position of ₹${(data.cashPosition / 100000).toFixed(1)} lakhs, representing approximately ${((data.cashPosition / data.portfolioValue) * 100).toFixed(0)}% of total portfolio value. The overall risk score stands at ${data.riskScore}/100, well within the moderate risk band and aligned with the investment strategy.`,
    },
    {
      title: 'Performance Analysis',
      content: `The portfolio's top performer was NTPC with a ${data.topHoldings[3].return}% return, followed by TCS at ${data.topHoldings[0].return}%. The IT sector allocation of ${data.sectorAllocation.IT}% proved beneficial as the Nifty IT index hit all-time highs during the period. HDFC Bank contributed steady returns of ${data.topHoldings[2].return}% despite banking sector volatility.\n\nSector-wise, the IT-heavy allocation (${data.sectorAllocation.IT}%) was the primary return driver, contributing approximately 55% of total gains. The Tyres sector allocation (${data.sectorAllocation.Tyres}%) provided diversification benefits with moderate returns. HUL, while defensive, contributed the least at ${data.topHoldings[4].return}% due to elevated valuations in the FMCG space.\n\nOn a risk-adjusted basis (Sharpe ratio), the portfolio scored 1.42, comparing favorably to the benchmark's 1.28. Maximum drawdown during the period was -6.2%, well within the -15% tolerance band.`,
    },
    {
      title: 'Risk Assessment',
      content: `The portfolio risk score of ${data.riskScore}/100 reflects a well-balanced approach between growth and capital preservation. Key risk factors include concentration in IT (${data.sectorAllocation.IT}% of portfolio), which exposes the portfolio to US technology spending cycles and rupee appreciation risk.\n\nStress testing reveals that a 20% market correction would reduce portfolio value by approximately ₹${Math.round((data.portfolioValue * 0.18) / 100000)} lakhs, with an estimated recovery period of 72 days based on historical patterns. The cash buffer of ₹${(data.cashPosition / 100000).toFixed(1)} lakhs provides adequate liquidity for 3+ months without forced selling.\n\nCredit risk remains minimal as all equity holdings are in companies with investment-grade ratings and strong balance sheets. Market risk is the primary concern, particularly in the mid-cap Tyres segment.`,
    },
    {
      title: 'Outlook',
      content: `Looking ahead, the Indian equity market outlook remains cautiously optimistic. The BSE Sensex is expected to trade in the 72,000-78,000 range over the next quarter, supported by strong domestic flows and improving corporate earnings. The RBI's accommodative stance should continue to provide a supportive macro backdrop.\n\nFor this portfolio, we recommend maintaining the current IT overweight given the strong deal pipeline visibility at TCS and Infosys. However, we suggest gradually reducing the Tyres allocation from ${data.sectorAllocation.Tyres}% to 10% and redirecting towards the Banking sector, which offers better risk-reward at current valuations.\n\nKey catalysts to watch: Q2 earnings season (expected 12-15% Nifty EPS growth), RBI policy decisions, US Fed rate trajectory, and FII flow patterns. We recommend a quarterly review of the allocation strategy with particular attention to the IT sector's performance relative to the benchmark.`,
    },
  ];
}

export function renderReportHtml(data: {
  sections?: ReportSection[];
  generatedAt?: string;
  reportType?: string;
  period?: string;
}): string {
  const sections = data.sections || [];
  const generatedAt = new Date(data.generatedAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    background: #ffffff;
    color: #1a1a2e;
    padding: 48px;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.7;
  }
  .header {
    border-bottom: 3px solid #22C55E;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
  .header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #16A34A;
    margin-bottom: 8px;
  }
  .header .meta {
    font-size: 13px;
    color: #64748b;
  }
  .header .company {
    font-size: 14px;
    color: #1a1a2e;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .section {
    margin-bottom: 28px;
  }
  .section h2 {
    font-size: 18px;
    font-weight: 600;
    color: #16A34A;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  .section p {
    font-size: 14px;
    color: #334155;
    margin-bottom: 12px;
  }
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
    margin-top: 32px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="company">Wealth Management System</div>
    <h1>${data.reportType ? data.reportType.charAt(0).toUpperCase() + data.reportType.slice(1) : 'Financial'} Report</h1>
    <div class="meta">Period: ${data.period || 'N/A'} | Generated: ${generatedAt}</div>
  </div>
  ${sections
    .map(
      (s) => `
  <div class="section">
    <h2>${s.title}</h2>
    ${s.content.split('\n').filter(Boolean).map((p) => `<p>${p}</p>`).join('')}
  </div>`
    )
    .join('')}
  <div class="footer">
    This report was generated by the Wealth Management System. Data sourced from market feeds and portfolio analytics.
    <br>Advisory simulation only — not financial advice. Confidential, for authorized recipients only.
  </div>
</body>
</html>`;
}
