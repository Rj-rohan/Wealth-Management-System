import { useState } from "react";
import { Link } from "react-router-dom";
import { useInvestorProfile } from "../context/InvestorProfileContext";
import AppShell from "../components/AppShell";

const researchData = [
  {
    sector: "Information Technology",
    icon: "💻",
    buffettView: "Wide Moat",
    moatType: "Switching Costs",
    suitableFor: ["Aggressive Growth", "Balanced", "Wealth Builder"],
    riskLevel: "Medium",
    keyMetrics: { avgROE: 38, avgPE: 30, debtLevel: "Zero", dividendYield: 2.1 },
    buffettTake: "IT firms like TCS & Infosys have deep switching costs — once a client is integrated, they rarely leave. High ROE with zero debt is exactly what Buffett loves.",
    keyStocks: ["TCS", "Infosys", "Wipro", "HCL Technologies"],
    catalysts: ["Digital transformation spending", "AI/Cloud migration", "Global IT budgets"],
    risks: ["INR appreciation", "US recession reducing IT spend", "Attrition"],
    motilalInsight: "Motilal Oswal Wealth Creation Study identifies IT as a consistent wealth creator — 20-yr CAGR of 18%+.",
    watchMetrics: ["Revenue growth > 8%", "Operating margin > 20%", "Deal wins"],
  },
  {
    sector: "FMCG",
    icon: "🛒",
    buffettView: "Consumer Moat",
    moatType: "Brand Power",
    suitableFor: ["Conservative", "Balanced", "Wealth Builder"],
    riskLevel: "Low",
    keyMetrics: { avgROE: 22, avgPE: 52, debtLevel: "Zero", dividendYield: 1.6 },
    buffettTake: "FMCG is the closest thing to Buffett's ideal — brand moat, repeat purchases, pricing power. HUL is India's Procter & Gamble. High P/E is justified by quality.",
    keyStocks: ["HUL", "Nestle India", "Britannia", "Dabur"],
    catalysts: ["Rural recovery", "Premiumization trend", "Distribution expansion"],
    risks: ["Raw material inflation", "Slow volume growth", "Competitive pressure"],
    motilalInsight: "FMCG accounts for 30% of Motilal's top wealth creators list over 25 years.",
    watchMetrics: ["Volume growth > 5%", "Gross margin expansion", "Market share gains"],
  },
  {
    sector: "Power",
    icon: "⚡",
    buffettView: "Regulated Moat",
    moatType: "Regulated Asset Base",
    suitableFor: ["Conservative", "Wealth Builder"],
    riskLevel: "Low-Medium",
    keyMetrics: { avgROE: 13, avgPE: 16, debtLevel: "High", dividendYield: 2.9 },
    buffettTake: "Buffett loves utility businesses — regulated returns, predictable cash flows, essential service. NTPC is India's version. Dividend yield is attractive for income seekers.",
    keyStocks: ["NTPC", "Power Grid", "Torrent Power", "Tata Power"],
    catalysts: ["Renewable energy push", "Rising power demand", "Capex-driven growth"],
    risks: ["Regulatory changes", "Fuel cost volatility", "High capex needs"],
    motilalInsight: "Power sector underperformed in 2010s but is set for re-rating with EV and industrialization push.",
    watchMetrics: ["Capacity addition", "Plant load factor", "Receivable days"],
  },
  {
    sector: "Tyres",
    icon: "🔵",
    buffettView: "Cyclical Quality",
    moatType: "Brand + Distribution",
    suitableFor: ["Balanced", "Aggressive Growth"],
    riskLevel: "Medium",
    keyMetrics: { avgROE: 15, avgPE: 23, debtLevel: "Low", dividendYield: 0.9 },
    buffettTake: "Tyre companies benefit from auto industry growth and replacement demand. Apollo & CEAT have strong distribution networks. Watch crude prices as key input cost.",
    keyStocks: ["Apollo Tyres", "CEAT", "MRF", "Balkrishna Industries"],
    catalysts: ["Auto sector recovery", "EV-specific tyre demand", "Export growth"],
    risks: ["Crude oil price spike", "Auto slowdown", "Chinese imports"],
    motilalInsight: "Tyre sector showed 15% CAGR in earnings during 2014-2019 — linked to auto upcycle.",
    watchMetrics: ["Realisation per kg", "EBITDA margin", "Replacement vs OEM ratio"],
  },
  {
    sector: "Banking & Financial Services",
    icon: "🏦",
    buffettView: "Selective Buy",
    moatType: "Network Effect",
    suitableFor: ["Balanced", "Aggressive Growth", "Wealth Builder"],
    riskLevel: "Medium-High",
    keyMetrics: { avgROE: 16, avgPE: 11, debtLevel: "High (normal)", dividendYield: 1.1 },
    buffettTake: "Banking is tricky — Buffett says you need exceptional management. Focus on NIMs, GNPA, and ROA. High D/E is normal for banks. Look for low-cost CASA and strong collection.",
    keyStocks: ["IndusInd Bank", "Kotak Mahindra", "HDFC Bank", "Ujjivan SFB"],
    catalysts: ["Credit growth cycle", "Declining NPA cycle", "Digital banking adoption"],
    risks: ["Asset quality stress", "Rising NPAs", "Rate cycle reversal"],
    motilalInsight: "HDFC Bank has been Motilal's top wealth creator for over a decade — 25-yr CAGR of 22%.",
    watchMetrics: ["NIM > 4%", "GNPA < 2%", "CASA ratio", "RoA > 1.5%"],
  },
  {
    sector: "Microfinance",
    icon: "🤝",
    buffettView: "High Growth, High Risk",
    moatType: "Cost Advantage + Reach",
    suitableFor: ["Aggressive Growth"],
    riskLevel: "High",
    keyMetrics: { avgROE: 22, avgPE: 8, debtLevel: "Medium", dividendYield: 0.5 },
    buffettTake: "Microfinance isn't Buffett's classic pick — he'd avoid cyclical credit risk. But for aggressive investors, the ROE and growth can be spectacular if asset quality holds.",
    keyStocks: ["Ujjivan SFB", "Equitas SFB", "Suryoday SFB", "Spandana Sphoorty"],
    catalysts: ["Financial inclusion push", "JLG model resilience", "Rural income growth"],
    risks: ["Overleveraged borrowers", "Natural disasters", "Political interference"],
    motilalInsight: "Microfinance is a high-beta play on India's financial inclusion story.",
    watchMetrics: ["Collection efficiency > 98%", "PAR30 < 2%", "Cost-to-income ratio"],
  },
];

const riskConfig = {
  "Low": { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  "Low-Medium": { color: "#84CC16", bg: "rgba(132,204,22,0.1)" },
  "Medium": { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  "Medium-High": { color: "#F97316", bg: "rgba(249,115,22,0.1)" },
  "High": { color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
};

export default function EquityResearch() {
  const { profile } = useInvestorProfile();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const displayed = filter === "recommended" && profile
    ? researchData.filter((r) => r.suitableFor.includes(profile.investor.type))
    : researchData;

  return (
    <AppShell pageTitle="Equity Research" pageSubtitle="Sector analysis powered by Buffett + Motilal Oswal methodology">
      <div className="px-6 py-6 max-w-5xl mx-auto">

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filter === "all" ? "#22C55E" : "rgba(255,255,255,0.04)",
              color: filter === "all" ? "#000" : "#A1A1AA",
              border: `1px solid ${filter === "all" ? "transparent" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            All Sectors
          </button>
          {profile && (
            <button
              onClick={() => setFilter("recommended")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === "recommended" ? "#22C55E" : "rgba(255,255,255,0.04)",
                color: filter === "recommended" ? "#000" : "#A1A1AA",
                border: `1px solid ${filter === "recommended" ? "transparent" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {profile.investor.icon} For {profile.investor.type}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((r) => {
            const rc = riskConfig[r.riskLevel] || riskConfig["Medium"];
            const isExpanded = selected?.sector === r.sector;
            return (
              <div
                key={r.sector}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: "#161B22",
                  border: `1px solid ${isExpanded ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {r.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{r.sector}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{r.moatType}</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: rc.bg, color: rc.color }}
                    >
                      {r.riskLevel} Risk
                    </span>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: "Avg ROE", val: `${r.keyMetrics.avgROE}%` },
                      { label: "Avg P/E", val: `${r.keyMetrics.avgPE}x` },
                      { label: "Debt", val: r.keyMetrics.debtLevel },
                      { label: "Div Yield", val: `${r.keyMetrics.dividendYield}%` },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg p-2 text-center"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        <p className="text-xs mb-1" style={{ color: "#A1A1AA" }}>{m.label}</p>
                        <p className="text-xs font-bold text-white">{m.val}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs leading-relaxed mb-4" style={{ color: "#A1A1AA" }}>
                    {r.buffettTake.substring(0, 100)}...
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {r.keyStocks.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#A1A1AA" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelected(isExpanded ? null : r)}
                      className="text-xs font-medium ml-2 flex-shrink-0 transition-colors px-2 py-1 rounded-lg"
                      style={{ color: isExpanded ? "#22C55E" : "#A1A1AA" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#22C55E"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = isExpanded ? "#22C55E" : "#A1A1AA"; }}
                    >
                      {isExpanded ? "▲ Less" : "▼ More"}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div
                    className="p-5 space-y-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#A1A1AA" }}>Buffett&apos;s Take</p>
                      <p className="text-sm leading-relaxed text-white">{r.buffettTake}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#22C55E" }}>Catalysts</p>
                        <ul className="space-y-1.5">
                          {r.catalysts.map((c) => (
                            <li key={c} className="flex items-start gap-2 text-xs" style={{ color: "#A1A1AA" }}>
                              <span style={{ color: "#22C55E", marginTop: "1px" }}>+</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#DC2626" }}>Risks</p>
                        <ul className="space-y-1.5">
                          {r.risks.map((ri) => (
                            <li key={ri} className="flex items-start gap-2 text-xs" style={{ color: "#A1A1AA" }}>
                              <span style={{ color: "#DC2626", marginTop: "1px" }}>–</span> {ri}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div
                      className="rounded-lg p-3"
                      style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)" }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: "#D4AF37" }}>Motilal Oswal Study</p>
                      <p className="text-xs" style={{ color: "#A1A1AA" }}>{r.motilalInsight}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#3B82F6" }}>Watch Metrics</p>
                      <div className="flex flex-wrap gap-2">
                        {r.watchMetrics.map((m) => (
                          <span
                            key={m}
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
