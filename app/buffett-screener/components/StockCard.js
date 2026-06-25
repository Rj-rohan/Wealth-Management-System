"use client";
import { useState } from "react";
import { calcBuffettScore } from "../data/scoring";

const moatColors = {
  Brand: "bg-purple-100 text-purple-700",
  "Switching Costs": "bg-blue-100 text-blue-700",
  "Network Effect": "bg-indigo-100 text-indigo-700",
  Regulated: "bg-orange-100 text-orange-700",
  "Cost Advantage": "bg-green-100 text-green-700",
};

export default function StockCard({ stock }) {
  const [expanded, setExpanded] = useState(false);
  const { score, breakdown, rating, ratingColor } = calcBuffettScore(stock);
  const scoreColor = score >= 80 ? "bg-green-500" : score >= 65 ? "bg-blue-500" : score >= 50 ? "bg-yellow-400" : "bg-red-400";
  const peg = stock.earningsGrowth > 0 ? (stock.pe / stock.earningsGrowth).toFixed(2) : "N/A";
  const pegColor = peg <= 1 ? "text-green-600" : peg <= 1.5 ? "text-blue-600" : peg <= 2.5 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{stock.name}</h3>
            <p className="text-gray-400 text-sm">{stock.ticker} · {stock.sector} · {stock.fy}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${scoreColor}`}>
              {score}/100
            </span>
            <span className={`text-sm font-bold ${ratingColor}`}>{rating}</span>
          </div>
        </div>

        {/* Score Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all ${scoreColor}`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">ROE</p>
            <p className={`font-bold text-sm ${stock.roe >= 20 ? "text-green-600" : stock.roe >= 12 ? "text-blue-600" : "text-red-500"}`}>{stock.roe}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">P/E</p>
            <p className="font-bold text-sm text-gray-800">{stock.pe}x</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">D/E</p>
            <p className={`font-bold text-sm ${stock.debtToEquity <= 0.5 ? "text-green-600" : stock.debtToEquity <= 1.5 ? "text-yellow-600" : "text-red-500"}`}>{stock.debtToEquity}x</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">EPS Growth</p>
            <p className={`font-bold text-sm ${stock.earningsGrowth >= 15 ? "text-green-600" : "text-gray-700"}`}>{stock.earningsGrowth}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Rev Growth</p>
            <p className="font-bold text-sm text-gray-700">{stock.revenueGrowth}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Div Yield</p>
            <p className="font-bold text-sm text-gray-700">{stock.dividendYield}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 col-span-3">
            <p className="text-xs text-gray-500">PEG Ratio <span className="text-gray-400">(P/E ÷ Growth)</span></p>
            <p className={`font-bold text-sm ${pegColor}`}>{peg} {peg <= 1 ? "— Undervalued" : peg <= 1.5 ? "— Fair" : peg <= 2.5 ? "— Expensive" : "— Overvalued"}</p>
          </div>
        </div>

        {/* Moat + Promoter + Price row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-gray-500">Moat:</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${moatColors[stock.moat] || "bg-gray-100 text-gray-600"}`}>
            {stock.moat}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 ${
            stock.promoterHolding >= 50 ? "bg-green-100 text-green-700" :
            stock.promoterHolding >= 30 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-600"
          }`}>
            🤝 {stock.promoterHolding}%
          </span>
          <span className="text-xs text-gray-500 ml-auto font-semibold">₹{stock.price.toLocaleString()}</span>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium pt-1 border-t border-gray-100 mt-1"
        >
          {expanded ? "▲ Hide Score Breakdown" : "▼ View Score Breakdown"}
        </button>
      </div>

      {/* Score Breakdown */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-4 bg-gray-50 rounded-b-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-2">Buffett Score Breakdown</p>
          <div className="space-y-1.5">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-36 shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${(item.pts / item.max) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-10 text-right">{item.pts}/{item.max}</span>
                <span className="text-xs text-gray-400 w-40 text-right truncate">{item.note}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between">
            <span className="text-xs font-bold text-gray-600">Total Score</span>
            <span className="text-sm font-bold text-gray-900">{score}/100 — <span className={ratingColor}>{rating}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
