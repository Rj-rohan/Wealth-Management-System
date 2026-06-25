"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../context/UserContext";
import { stocks } from "../buffett-screener/data/stocks";
import { calcBuffettScore } from "../buffett-screener/data/scoring";

function getInitialHoldings() {
  try { return JSON.parse(localStorage.getItem("wm_holdings") || "[]"); } catch { return []; }
}

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

  // Budget-aware suggestions: filter stocks by user's monthly budget per stock
  const budget = profile?.monthlyInvestment || 0;
  const maxPE = profile?.investor?.maxStockPE || 40;
  const suggestions = stocks
    .map((s) => ({ ...s, ...calcBuffettScore(s) }))
    .filter((s) => {
      const alreadyOwned = holdings.some((h) => h.ticker === s.ticker);
      const affordable = budget === 0 || s.price <= budget * 0.5; // one stock ≤ 50% of monthly budget
      const fitsProfile = s.pe <= maxPE;
      return !alreadyOwned && affordable && fitsProfile && s.score >= 55;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-3">👤</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Profile Found</h2>
          <p className="text-gray-500 mb-4">Create your investor profile first</p>
          <Link href="/onboarding" className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-700">Set Up Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Portfolio Tracker</h1>
            <p className="text-sm text-gray-500">Track your investments, P&L and get smart suggestions</p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Invested", value: `₹${totalInvested.toLocaleString()}`, color: "text-gray-800" },
            { label: "Current Value", value: `₹${totalCurrent.toLocaleString()}`, color: "text-gray-800" },
            { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString()}`, color: totalPnl >= 0 ? "text-green-600" : "text-red-500" },
            { label: "Returns", value: `${pnlPct}%`, color: Number(pnlPct) >= 0 ? "text-green-600" : "text-red-500" },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Budget Insight */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">{profile.investor.icon}</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">{profile.investor.type} Investor · ₹{Number(budget).toLocaleString()}/month budget</p>
            <p className="text-xs text-blue-600">Equity allocation: ₹{Math.round(budget * profile.investor.allocation.equity / 100).toLocaleString()} · Max P/E for you: {maxPE}x</p>
          </div>
        </div>

        {/* Holdings Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Your Holdings</h2>
            <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full font-medium hover:bg-blue-700">
              + Add Holding
            </button>
          </div>

          {/* Add Form */}
          {showAdd && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              {[
                { key: "ticker", placeholder: "Ticker (e.g. TCS)", type: "text" },
                { key: "qty", placeholder: "Qty", type: "number" },
                { key: "buyPrice", placeholder: "Buy Price (₹)", type: "number" },
                { key: "currentPrice", placeholder: "Current Price (₹)", type: "number" },
              ].map((f) => (
                <input key={f.key} type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              ))}
              <button onClick={addHolding} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Add</button>
            </div>
          )}

          {holdings.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="font-medium">No holdings yet</p>
              <p className="text-sm">Click &quot;Add Holding&quot; to track your stocks</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{["Ticker", "Qty", "Buy Price", "Current Price", "Invested", "Value", "P&L", ""].map((h) => <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {holdings.map((h) => {
                    const invested = h.qty * h.buyPrice;
                    const value = h.qty * h.currentPrice;
                    const pnl = value - invested;
                    const pct = ((pnl / invested) * 100).toFixed(1);
                    return (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-800">{h.ticker}</td>
                        <td className="px-4 py-3 text-gray-600">{h.qty}</td>
                        <td className="px-4 py-3 text-gray-600">₹{Number(h.buyPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">₹{Number(h.currentPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">₹{invested.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">₹{value.toLocaleString()}</td>
                        <td className={`px-4 py-3 font-semibold ${pnl >= 0 ? "text-green-600" : "text-red-500"}`}>{pnl >= 0 ? "+" : ""}₹{pnl.toLocaleString()} ({pct}%)</td>
                        <td className="px-4 py-3"><button onClick={() => removeHolding(h.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Smart Suggestions */}
        <div>
          <h2 className="font-bold text-gray-800 mb-1">💡 Suggestions For You</h2>
          <p className="text-xs text-gray-500 mb-4">
            Based on your {profile.investor.type} profile, ₹{Number(budget).toLocaleString()} budget, and Buffett score ≥ 55. Excludes stocks you already own.
          </p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-400">No new suggestions — your budget may not cover remaining stocks, or you own them all.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{s.name} <span className="text-xs text-gray-400">({s.ticker})</span></p>
                    <p className="text-xs text-gray-500">{s.sector} · ₹{s.price.toLocaleString()} · P/E {s.pe}x · ROE {s.roe}%</p>
                    <p className={`text-xs font-semibold mt-1 ${s.ratingColor}`}>{s.rating} · Score: {s.score}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">~{Math.floor(budget * 0.25 / s.price)} shares</p>
                    <p className="text-xs text-gray-400">with ₹{Math.round(budget * 0.25).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
