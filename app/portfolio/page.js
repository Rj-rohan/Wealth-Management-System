"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../context/UserContext";
import { stocks } from "../buffett-screener/data/stocks";
import { calcBuffettScore } from "../buffett-screener/data/scoring";
import AppShell from "../components/AppShell";

function getInitialHoldings() {
  try { return JSON.parse(localStorage.getItem("wm_holdings") || "[]"); } catch { return []; }
}

const inputStyle = {
  background: "#1C2128",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  outline: "none",
};

export default function Portfolio() {
  const { profile } = useUser();
  const [holdings, setHoldings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ticker: "", qty: "", buyPrice: "", currentPrice: "" });

  useEffect(() => { setHoldings(getInitialHoldings()); }, []);

  function saveHoldings(list) {
    setHoldings(list);
    localStorage.setItem("wm_holdings", JSON.stringify(list));
  }

  function addHolding() {
    if (!form.ticker || !form.qty || !form.buyPrice || !form.currentPrice) return;
    const newHolding = { id: Date.now(), ...form, qty: Number(form.qty), buyPrice: Number(form.buyPrice), currentPrice: Number(form.currentPrice) };
    saveHoldings([...holdings, newHolding]);
    setForm({ ticker: "", qty: "", buyPrice: "", currentPrice: "" });
    setShowAdd(false);
  }

  function removeHolding(id) { saveHoldings(holdings.filter((h) => h.id !== id)); }

  const totalInvested = holdings.reduce((s, h) => s + h.qty * h.buyPrice, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.qty * h.currentPrice, 0);
  const totalPnl = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : 0;

  const budget = profile?.monthlyInvestment || 0;
  const maxPE = profile?.investor?.maxStockPE || 40;
  const suggestions = stocks
    .map((s) => ({ ...s, ...calcBuffettScore(s) }))
    .filter((s) => {
      const alreadyOwned = holdings.some((h) => h.ticker === s.ticker);
      const affordable = budget === 0 || s.price <= budget * 0.5;
      const fitsProfile = s.pe <= maxPE;
      return !alreadyOwned && affordable && fitsProfile && s.score >= 55;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            👤
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Profile Found</h2>
          <p className="text-sm mb-5" style={{ color: "#A1A1AA" }}>Create your investor profile first</p>
          <Link
            href="/onboarding"
            className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: "#22C55E", color: "#000" }}
          >
            Set Up Profile
          </Link>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Invested", value: `₹${totalInvested.toLocaleString()}`, color: "#ffffff", sub: "cost basis" },
    { label: "Current Value", value: `₹${totalCurrent.toLocaleString()}`, color: "#ffffff", sub: "market value" },
    {
      label: "Total P&L",
      value: `${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString()}`,
      color: totalPnl >= 0 ? "#22C55E" : "#DC2626",
      sub: totalPnl >= 0 ? "unrealized gain" : "unrealized loss"
    },
    {
      label: "Returns",
      value: `${Number(pnlPct) >= 0 ? "+" : ""}${pnlPct}%`,
      color: Number(pnlPct) >= 0 ? "#22C55E" : "#DC2626",
      sub: "portfolio return"
    },
  ];

  return (
    <AppShell pageTitle="Portfolio Tracker" pageSubtitle="Holdings, P&L and smart suggestions">
      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-4"
              style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: "#A1A1AA" }}>{c.label}</p>
              <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Budget Insight */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <span className="text-2xl">{profile.investor.icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">
              {profile.investor.type} Investor · ₹{Number(budget).toLocaleString()}/month budget
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
              Equity allocation: <span style={{ color: "#22C55E" }}>₹{Math.round(budget * profile.investor.allocation.equity / 100).toLocaleString()}</span>
              {" "}· Max P/E for you: <span className="text-white">{maxPE}x</span>
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Your Holdings</h2>
              <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{holdings.length} position{holdings.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: showAdd ? "rgba(34,197,94,0.2)" : "#22C55E", color: showAdd ? "#22C55E" : "#000" }}
            >
              <span>{showAdd ? "✕" : "+"}</span>
              {showAdd ? "Cancel" : "Add Holding"}
            </button>
          </div>

          {/* Add Form */}
          {showAdd && (
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-medium mb-3" style={{ color: "#A1A1AA" }}>New Position</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                {[
                  { key: "ticker", placeholder: "Ticker (e.g. TCS)", type: "text" },
                  { key: "qty", placeholder: "Quantity", type: "number" },
                  { key: "buyPrice", placeholder: "Buy Price (₹)", type: "number" },
                  { key: "currentPrice", placeholder: "Current Price (₹)", type: "number" },
                ].map((f) => (
                  <input
                    key={f.key}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                ))}
                <button
                  onClick={addHolding}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: "#22C55E", color: "#000" }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {holdings.length === 0 ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{ background: "#161B22", border: "1px dashed rgba(255,255,255,0.1)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                📭
              </div>
              <p className="font-semibold text-white mb-1">No holdings yet</p>
              <p className="text-sm" style={{ color: "#A1A1AA" }}>Click &quot;Add Holding&quot; to start tracking your stocks</p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#1C2128", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Ticker", "Qty", "Buy Price", "Current", "Invested", "Value", "P&L", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#A1A1AA" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, idx) => {
                      const invested = h.qty * h.buyPrice;
                      const value = h.qty * h.currentPrice;
                      const pnl = value - invested;
                      const pct = ((pnl / invested) * 100).toFixed(1);
                      return (
                        <tr
                          key={h.id}
                          style={{
                            borderBottom: idx < holdings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td className="px-4 py-3.5 font-semibold text-white">{h.ticker}</td>
                          <td className="px-4 py-3.5" style={{ color: "#A1A1AA" }}>{h.qty}</td>
                          <td className="px-4 py-3.5" style={{ color: "#A1A1AA" }}>₹{Number(h.buyPrice).toLocaleString()}</td>
                          <td className="px-4 py-3.5" style={{ color: "#A1A1AA" }}>₹{Number(h.currentPrice).toLocaleString()}</td>
                          <td className="px-4 py-3.5" style={{ color: "#A1A1AA" }}>₹{invested.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-white font-medium">₹{value.toLocaleString()}</td>
                          <td className="px-4 py-3.5 font-semibold" style={{ color: pnl >= 0 ? "#22C55E" : "#DC2626" }}>
                            {pnl >= 0 ? "+" : ""}₹{pnl.toLocaleString()}
                            <span className="text-xs font-normal ml-1">({pct}%)</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => removeHolding(h.id)}
                              className="text-xs px-2 py-1 rounded-md transition-colors"
                              style={{ color: "#A1A1AA" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; e.currentTarget.style.background = "transparent"; }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Smart Suggestions */}
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Smart Suggestions</h2>
            <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
              Based on your {profile.investor.type} profile, ₹{Number(budget).toLocaleString()} budget, and Buffett score ≥ 55. Excludes stocks you already own.
            </p>
          </div>
          {suggestions.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-sm" style={{ color: "#A1A1AA" }}>
                No new suggestions — your budget may not cover remaining stocks, or you own them all.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((s) => {
                const ratingColors = {
                  "Strong Buy": "#22C55E",
                  "Buy": "#3B82F6",
                  "Hold": "#F59E0B",
                  "Avoid": "#DC2626",
                };
                const ratingBg = {
                  "Strong Buy": "rgba(34,197,94,0.1)",
                  "Buy": "rgba(59,130,246,0.1)",
                  "Hold": "rgba(245,158,11,0.1)",
                  "Avoid": "rgba(220,38,38,0.1)",
                };
                const rc = ratingColors[s.rating] || "#A1A1AA";
                const rb = ratingBg[s.rating] || "rgba(161,161,170,0.1)";
                return (
                  <div
                    key={s.id}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white">{s.name}</p>
                        <span className="text-xs" style={{ color: "#A1A1AA" }}>({s.ticker})</span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "#A1A1AA" }}>
                        {s.sector} · ₹{s.price.toLocaleString()} · P/E {s.pe}x · ROE {s.roe}%
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: rb, color: rc }}
                      >
                        {s.rating} · {s.score}/100
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">~{Math.floor(budget * 0.25 / s.price)} shares</p>
                      <p className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>₹{Math.round(budget * 0.25).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
