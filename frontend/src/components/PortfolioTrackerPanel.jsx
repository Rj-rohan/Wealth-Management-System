/**
 * Portfolio Tracker — self-entered equity positions with P&L and budget-aware
 * suggestions.
 *
 * Positions were previously held in browser localStorage; they are now stored
 * per account through /api/v1/users/:id/tracker/holdings. The P&L arithmetic
 * and the suggestion filter (already-owned, affordable, within the profile's
 * max P/E, Buffett score >= 55) are unchanged.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useInvestorProfile } from "../context/InvestorProfileContext";
import { useAppStore } from "../store/useAppStore";
import { fetchTrackerHoldings, addTrackerHolding, removeTrackerHolding } from "../services/api";
import { stocks } from "../data/stocks";
import { calcBuffettScore } from "../data/scoring";

const inputStyle = {
  background: "var(--surface-raised)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--foreground)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  outline: "none",
};

export default function PortfolioTrackerPanel() {
  const { profile, loaded } = useInvestorProfile();
  const user = useAppStore((s) => s.user);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ticker: "", qty: "", buyPrice: "", currentPrice: "" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    fetchTrackerHoldings(user.id)
      .then((list) => { if (!cancelled) { setHoldings(list); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load your holdings."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  async function addHolding() {
    if (!form.ticker || !form.qty || !form.buyPrice || !form.currentPrice) return;
    setSaving(true);
    setError(null);
    try {
      const created = await addTrackerHolding(user.id, {
        ticker: form.ticker.trim().toUpperCase(),
        qty: Number(form.qty),
        buyPrice: Number(form.buyPrice),
        currentPrice: Number(form.currentPrice),
      });
      setHoldings((prev) => [...prev, created]);
      setForm({ ticker: "", qty: "", buyPrice: "", currentPrice: "" });
      setShowAdd(false);
    } catch (err) {
      setError(err.message || "Could not add that position.");
    } finally {
      setSaving(false);
    }
  }

  async function removeHolding(id) {
    const previous = holdings;
    setHoldings((prev) => prev.filter((h) => h.id !== id));
    try {
      await removeTrackerHolding(user.id, id);
    } catch (err) {
      setHoldings(previous);
      setError(err.message || "Could not remove that position.");
    }
  }

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

  if (loaded && !profile) {
    return (
      <div className="rounded-xl p-10 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          👤
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>Investing style not set</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          Set your investing style to get budget-aware suggestions matched to your risk profile.
        </p>
        <Link
          to="/settings/investing-style"
          className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm no-underline"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          Set Investing Style
        </Link>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Invested", value: `₹${Math.round(totalInvested).toLocaleString("en-IN")}`, color: "var(--foreground)", sub: "cost basis" },
    { label: "Current Value", value: `₹${Math.round(totalCurrent).toLocaleString("en-IN")}`, color: "var(--foreground)", sub: "market value" },
    {
      label: "Total P&L",
      value: `${totalPnl >= 0 ? "+" : ""}₹${Math.round(totalPnl).toLocaleString("en-IN")}`,
      color: totalPnl >= 0 ? "var(--accent)" : "var(--danger)",
      sub: totalPnl >= 0 ? "unrealized gain" : "unrealized loss",
    },
    {
      label: "Returns",
      value: `${Number(pnlPct) >= 0 ? "+" : ""}${pnlPct}%`,
      color: Number(pnlPct) >= 0 ? "var(--accent)" : "var(--danger)",
      sub: "portfolio return",
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--danger-dim)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>{c.label}</p>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Budget Insight */}
      {profile && (
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: "var(--accent-dim)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <span className="text-2xl">{profile.investor.icon}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {profile.investor.type} Investor · ₹{Number(budget).toLocaleString("en-IN")}/month budget
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Equity allocation:{" "}
              <span style={{ color: "var(--accent)" }}>
                ₹{Math.round((budget * profile.investor.allocation.equity) / 100).toLocaleString("en-IN")}
              </span>{" "}
              · Max P/E for you: <span style={{ color: "var(--foreground)" }}>{maxPE}x</span>
            </p>
          </div>
        </div>
      )}

      {/* Holdings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)", margin: 0 }}>Your Holdings</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)", margin: 0 }}>
              {holdings.length} position{holdings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: showAdd ? "var(--accent-dim)" : "var(--accent)",
              color: showAdd ? "var(--accent)" : "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span>{showAdd ? "✕" : "+"}</span>
            {showAdd ? "Cancel" : "Add Holding"}
          </button>
        </div>

        {showAdd && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>New Position</p>
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
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "var(--accent)", color: "#000", border: "none", cursor: saving ? "wait" : "pointer" }}
              >
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : holdings.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "var(--surface)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              📭
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>No holdings yet</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Click &quot;Add Holding&quot; to start tracking your stocks</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--border)" }}>
                    {["Ticker", "Qty", "Buy Price", "Current", "Invested", "Value", "P&L", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
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
                    const pct = invested > 0 ? ((pnl / invested) * 100).toFixed(1) : "0.0";
                    return (
                      <tr
                        key={h.id}
                        style={{ borderBottom: idx < holdings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td className="px-4 py-3.5 font-semibold" style={{ color: "var(--foreground)" }}>{h.ticker}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--muted)" }}>{h.qty}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--muted)" }}>₹{Number(h.buyPrice).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--muted)" }}>₹{Number(h.currentPrice).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--muted)" }}>₹{Math.round(invested).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5 font-medium" style={{ color: "var(--foreground)" }}>₹{Math.round(value).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3.5 font-semibold" style={{ color: pnl >= 0 ? "var(--accent)" : "var(--danger)" }}>
                          {pnl >= 0 ? "+" : ""}₹{Math.round(pnl).toLocaleString("en-IN")}
                          <span className="text-xs font-normal ml-1">({pct}%)</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => removeHolding(h.id)}
                            className="text-xs px-2 py-1 rounded-md"
                            style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "var(--danger-dim)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
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
      {profile && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)", margin: 0 }}>Smart Suggestions</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)", margin: 0 }}>
              Based on your {profile.investor.type} profile, ₹{Number(budget).toLocaleString("en-IN")} budget, and Buffett score ≥ 55.
              Excludes stocks you already own.
            </p>
          </div>
          {suggestions.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No new suggestions — your budget may not cover remaining stocks, or you own them all.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((s) => {
                const ratingColors = {
                  "Strong Buy": "#22C55E",
                  Buy: "#3B82F6",
                  Hold: "#F59E0B",
                  Avoid: "#DC2626",
                };
                const ratingBg = {
                  "Strong Buy": "rgba(34,197,94,0.1)",
                  Buy: "rgba(59,130,246,0.1)",
                  Hold: "rgba(245,158,11,0.1)",
                  Avoid: "rgba(220,38,38,0.1)",
                };
                const rc = ratingColors[s.rating] || "var(--muted)";
                const rb = ratingBg[s.rating] || "rgba(161,161,170,0.1)";
                return (
                  <div
                    key={s.id}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold" style={{ color: "var(--foreground)", margin: 0 }}>{s.name}</p>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>({s.ticker})</span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                        {s.sector} · ₹{s.price.toLocaleString("en-IN")} · P/E {s.pe}x · ROE {s.roe}%
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: rb, color: rc }}>
                        {s.rating} · {s.score}/100
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)", margin: 0 }}>
                        ~{Math.floor((budget * 0.25) / s.price)} shares
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)", margin: 0 }}>
                        ₹{Math.round(budget * 0.25).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
