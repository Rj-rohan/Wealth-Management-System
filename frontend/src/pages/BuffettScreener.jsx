import { useState, useMemo } from "react";
import StockCard from "../components/StockCard";
import { stocks, sectors } from "../data/stocks";
import { calcBuffettScore } from "../data/scoring";
import AppShell from "../components/AppShell";

const criteria = [
  { label: "High ROE", desc: "Return on Equity > 15% sustained" },
  { label: "Low Debt", desc: "D/E < 0.5, self-funded growth" },
  { label: "Earnings Growth", desc: "10%+ EPS CAGR over 5 years" },
  { label: "Economic Moat", desc: "Brand, switching costs, network" },
  { label: "Fair Valuation", desc: "PEG ratio ≤ 1.5" },
  { label: "Promoter Stake", desc: "High holding = skin in game" },
];

const selectStyle = {
  background: "#1C2128",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13px",
  outline: "none",
  cursor: "pointer",
};

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
    <AppShell pageTitle="Warren Buffett Screener" pageSubtitle="Stocks scored by ROE, moat, debt, growth & valuation">
      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* Methodology Panel */}
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#D4AF37" }}>
            Buffett&apos;s Investment Criteria
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {criteria.map((c) => (
              <div key={c.label} className="flex items-start gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: "#D4AF37" }}
                />
                <div>
                  <p className="text-xs font-semibold text-white">{c.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Sector Pills */}
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sector === s ? "#22C55E" : "rgba(255,255,255,0.04)",
                  color: sector === s ? "#000" : "#A1A1AA",
                  border: `1px solid ${sector === s ? "transparent" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort + Min Score */}
          <div className="flex gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={selectStyle}
            >
              <option value="score" style={{ background: "#1C2128" }}>Sort: Buffett Score</option>
              <option value="roe" style={{ background: "#1C2128" }}>Sort: ROE</option>
              <option value="pe" style={{ background: "#1C2128" }}>Sort: Lowest P/E</option>
              <option value="growth" style={{ background: "#1C2128" }}>Sort: Earnings Growth</option>
            </select>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={selectStyle}
            >
              <option value={0} style={{ background: "#1C2128" }}>Min Score: All</option>
              <option value={50} style={{ background: "#1C2128" }}>Min: 50+</option>
              <option value={65} style={{ background: "#1C2128" }}>Min: 65+ (Buy)</option>
              <option value={80} style={{ background: "#1C2128" }}>Min: 80+ (Strong Buy)</option>
            </select>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: "#A1A1AA" }}>
            <span className="text-white font-semibold">{filtered.length}</span> stocks
          </p>
          {/* Score Legend */}
          <div className="flex items-center gap-4">
            {[
              { range: "80–100", label: "Strong Buy", color: "#22C55E" },
              { range: "65–79", label: "Buy", color: "#3B82F6" },
              { range: "50–64", label: "Hold", color: "#F59E0B" },
              { range: "0–49", label: "Avoid", color: "#DC2626" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-xs" style={{ color: "#A1A1AA" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Grid */}
        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-16 text-center"
            style={{ background: "#161B22", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              🔍
            </div>
            <p className="text-lg font-semibold text-white mb-1">No stocks match your filters</p>
            <p className="text-sm" style={{ color: "#A1A1AA" }}>Try adjusting the sector or minimum score</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
