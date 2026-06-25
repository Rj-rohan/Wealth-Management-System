"use client";
import { useState, useMemo } from "react";
import StockCard from "./components/StockCard";
import { stocks, sectors } from "./data/stocks";
import { calcBuffettScore } from "./data/scoring";

const criteria = [
  { icon: "📈", label: "High ROE", desc: "Return on Equity > 15% sustained over years" },
  { icon: "💪", label: "Low Debt", desc: "Debt/Equity < 0.5, company funds growth internally" },
  { icon: "🔄", label: "Earnings Growth", desc: "Consistent 10%+ EPS CAGR over 5 years" },
  { icon: "🏰", label: "Economic Moat", desc: "Brand, switching costs, network effect, or cost advantage" },
  { icon: "💰", label: "Fair Valuation", desc: "PEG ratio ≤ 1.5 (P/E relative to earnings growth)" },
  { icon: "🤝", label: "Promoter Skin-in-Game", desc: "High promoter holding shows management conviction" },
];

export default function BuffettScreener() {
  const [sector, setSector] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [minScore, setMinScore] = useState(0);

  const filtered = useMemo(() => {
    let list = stocks
      .map((s) => ({ ...s, buffettScore: calcBuffettScore(s).score }))
      .filter((s) => (sector === "All" || s.sector === sector) && s.buffettScore >= minScore);

    if (sortBy === "score") list.sort((a, b) => b.buffettScore - a.buffettScore);
    else if (sortBy === "roe") list.sort((a, b) => b.roe - a.roe);
    else if (sortBy === "pe") list.sort((a, b) => a.pe - b.pe);
    else if (sortBy === "growth") list.sort((a, b) => b.earningsGrowth - a.earningsGrowth);

    return list;
  }, [sector, sortBy, minScore]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🧠</span>
            <h1 className="text-2xl font-bold text-gray-900">Warren Buffett Stock Screener</h1>
          </div>
          <p className="text-gray-500 text-sm ml-11">
            Stocks scored using Buffett&apos;s Secret Sauce — ROE, Moat, Debt, Growth & Valuation
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Methodology Criteria */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h2 className="font-bold text-amber-900 mb-3 text-sm uppercase tracking-wide">
            📜 Buffett&apos;s Investment Criteria
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {criteria.map((c) => (
              <div key={c.label} className="flex items-start gap-2">
                <span className="text-lg">{c.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800">{c.label}</p>
                  <p className="text-xs text-amber-700">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Sector Filter */}
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  sector === s
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-blue-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort + Min Score */}
          <div className="flex gap-3 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
            >
              <option value="score">Sort: Buffett Score</option>
              <option value="roe">Sort: ROE</option>
              <option value="pe">Sort: Lowest P/E</option>
              <option value="growth">Sort: Earnings Growth</option>
            </select>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
            >
              <option value={0}>Min Score: All</option>
              <option value={50}>Min Score: 50+</option>
              <option value={65}>Min Score: 65+ (Buy)</option>
              <option value={80}>Min Score: 80+ (Strong Buy)</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing <span className="font-semibold text-gray-800">{filtered.length}</span> stocks
        </p>

        {/* Stock Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg font-medium">No stocks match your filters</p>
            <p className="text-sm">Try adjusting the sector or minimum score</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-10 border-t border-gray-200 pt-6">
          <p className="text-xs font-semibold text-gray-500 mb-3">SCORE LEGEND</p>
          <div className="flex flex-wrap gap-4">
            {[
              { range: "80–100", label: "Strong Buy", color: "bg-green-500" },
              { range: "65–79", label: "Buy", color: "bg-blue-500" },
              { range: "50–64", label: "Hold", color: "bg-yellow-400" },
              { range: "0–49", label: "Avoid", color: "bg-red-400" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${l.color}`} />
                <span className="text-xs text-gray-600">{l.range} — {l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
