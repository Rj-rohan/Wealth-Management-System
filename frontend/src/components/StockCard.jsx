import { useState } from "react";
import { calcBuffettScore } from "../data/scoring";

const moatConfig = {
  Brand: { color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  "Switching Costs": { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  "Network Effect": { color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  Regulated: { color: "#F97316", bg: "rgba(249,115,22,0.1)" },
  "Cost Advantage": { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
};

function ScoreRing({ score }) {
  const color = score >= 80 ? "#22C55E" : score >= 65 ? "#3B82F6" : score >= 50 ? "#F59E0B" : "#DC2626";
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        position: "relative",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
        style={{ background: "#161B22", color }}
      >
        {score}
      </div>
    </div>
  );
}

export default function StockCard({ stock }) {
  const [expanded, setExpanded] = useState(false);
  const { score, breakdown, rating, ratingColor } = calcBuffettScore(stock);

  const ratingConfig = {
    "Strong Buy": { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    "Buy": { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    "Hold": { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    "Avoid": { color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  };
  const rc = ratingConfig[rating] || ratingConfig["Hold"];
  const mc = moatConfig[stock.moat] || { color: "#A1A1AA", bg: "rgba(161,161,170,0.1)" };

  const peg = stock.earningsGrowth > 0 ? (stock.pe / stock.earningsGrowth).toFixed(2) : "N/A";
  const pegColor = peg <= 1 ? "#22C55E" : peg <= 1.5 ? "#3B82F6" : peg <= 2.5 ? "#F59E0B" : "#DC2626";
  const pegLabel = peg <= 1 ? "Undervalued" : peg <= 1.5 ? "Fair" : peg <= 2.5 ? "Expensive" : "Overvalued";

  const roeColor = stock.roe >= 20 ? "#22C55E" : stock.roe >= 12 ? "#3B82F6" : "#DC2626";
  const deColor = stock.debtToEquity <= 0.5 ? "#22C55E" : stock.debtToEquity <= 1.5 ? "#F59E0B" : "#DC2626";
  const epsColor = stock.earningsGrowth >= 15 ? "#22C55E" : "#A1A1AA";
  const promoterColor = stock.promoterHolding >= 50 ? "#22C55E" : stock.promoterHolding >= 30 ? "#F59E0B" : "#DC2626";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: "#161B22",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.border = `1px solid ${rc.color}25`; e.currentTarget.style.background = "#1C2128"; }}
      onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.background = "#161B22"; }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-white text-base leading-tight">{stock.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
              {stock.ticker} · {stock.sector} · {stock.fy}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ScoreRing score={score} />
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: rc.bg, color: rc.color }}
            >
              {rating}
            </span>
          </div>
        </div>

        {/* Score Bar */}
        <div
          className="h-1 rounded-full mb-4 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, background: rc.color }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "ROE", value: `${stock.roe}%`, color: roeColor },
            { label: "P/E", value: `${stock.pe}x`, color: "#fff" },
            { label: "D/E", value: `${stock.debtToEquity}x`, color: deColor },
            { label: "EPS Growth", value: `${stock.earningsGrowth}%`, color: epsColor },
            { label: "Rev Growth", value: `${stock.revenueGrowth}%`, color: "#A1A1AA" },
            { label: "Div Yield", value: `${stock.dividendYield}%`, color: "#A1A1AA" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-2.5 text-center"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-xs mb-1" style={{ color: "#A1A1AA" }}>{m.label}</p>
              <p className="text-xs font-bold" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* PEG */}
        <div
          className="rounded-lg p-2.5 text-center mb-3"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-xs" style={{ color: "#A1A1AA" }}>PEG Ratio (P/E ÷ Growth)</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: pegColor }}>
            {peg} — {pegLabel}
          </p>
        </div>

        {/* Moat + Promoter + Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: mc.bg, color: mc.color }}
          >
            {stock.moat}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${promoterColor}15`, color: promoterColor }}
          >
            {stock.promoterHolding}% Promoter
          </span>
          <span className="text-xs font-bold text-white ml-auto">₹{stock.price.toLocaleString()}</span>
        </div>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 pt-3 text-xs font-medium transition-colors text-center"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            color: expanded ? "#22C55E" : "#A1A1AA",
          }}
        >
          {expanded ? "▲ Hide Breakdown" : "▼ Score Breakdown"}
        </button>
      </div>

      {/* Score Breakdown */}
      {expanded && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-3" style={{ color: "#A1A1AA" }}>
            Buffett Score Breakdown
          </p>
          <div className="space-y-2.5">
            {breakdown.map((item) => {
              const pct = (item.pts / item.max) * 100;
              const barColor = pct >= 75 ? "#22C55E" : pct >= 50 ? "#3B82F6" : pct >= 25 ? "#F59E0B" : "#DC2626";
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#A1A1AA" }}>{item.note}</span>
                      <span className="text-xs font-semibold text-white">{item.pts}/{item.max}</span>
                    </div>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: barColor, transition: "width 0.3s ease" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="flex justify-between items-center mt-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "#A1A1AA" }}>Total Score</span>
            <span className="text-sm font-bold">
              <span className="text-white">{score}/100 — </span>
              <span style={{ color: rc.color }}>{rating}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
