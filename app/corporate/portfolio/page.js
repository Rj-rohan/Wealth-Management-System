"use client";
import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import CosmicBackground from "../../components/CosmicBackground";
import GlassCard from "../../components/GlassCard";
import AnimatedNumber from "../../components/AnimatedNumber";
import ShimmerLoader from "../../components/ShimmerLoader";

export default function CorporatePortfolio() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState("CFO");

  const [form, setForm] = useState({
    instrumentName: "",
    ticker: "",
    quantity: "",
    buyPrice: "",
    targetReturnPct: "15",
    expectedExitDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
    notes: "",
  });

  async function loadInvestments() {
    try {
      const res = await fetch("/api/investments");
      if (res.ok) {
        const data = await res.json();
        setInvestments(data);
      }
    } catch (e) {
      console.error("Failed to load investments", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvestments();

    // Check current mock role
    const cookies = document.cookie.split("; ");
    const mockRoleCookie = cookies.find((row) => row.startsWith("mock_role="));
    if (mockRoleCookie) {
      setActiveRole(mockRoleCookie.split("=")[1]);
    } else {
      setActiveRole("CFO");
    }
  }, []);

  const handleBuy = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const quantity = Number(form.quantity);
    const buyPrice = Number(form.buyPrice);
    const amountInvested = quantity * buyPrice;

    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amountInvested,
        }),
      });

      if (res.ok) {
        setForm({
          instrumentName: "",
          ticker: "",
          quantity: "",
          buyPrice: "",
          targetReturnPct: "15",
          expectedExitDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
          notes: "",
        });
        await loadInvestments();
      } else {
        const err = await res.json();
        setError(err.error || "Purchase failed.");
      }
    } catch (e) {
      setError("Network error deploying capital.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/investments/${id}/approve`, {
        method: "POST",
      });

      if (res.ok) {
        await loadInvestments();
      } else {
        const err = await res.json();
        alert(err.error || "Approval failed.");
      }
    } catch (e) {
      alert("Failed to send approval.");
    }
  };

  const totalInvested = investments
    .filter(i => i.approvalStatus === 'approved')
    .reduce((sum, i) => sum + Number(i.amountInvested), 0);

  const totalCurrent = investments
    .filter(i => i.approvalStatus === 'approved')
    .reduce((sum, i) => sum + (Number(i.currentValue) || Number(i.amountInvested)), 0);

  const profitLoss = totalCurrent - totalInvested;
  const plPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  const approvedHoldings = investments.filter((i) => i.approvalStatus === "approved");
  const pendingHoldings = investments.filter((i) => i.approvalStatus === "pending");

  return (
    <AppShell pageTitle="Corporate Portfolio" pageSubtitle="Deploy corporate treasury surpluses and manage asset sign-offs">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6 relative z-10" id="corporate-portfolio-root">
        
        {/* Consolidated KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Surplus Surrendered / Invested</p>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={totalInvested} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Book asset cost</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Consolidated Net Asset Value</p>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={totalCurrent} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Consolidated holdings valuations</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Unrealized Portfolio Gains (P&L)</p>
            <p className={`text-2xl font-bold ${profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
              {profitLoss >= 0 ? "+" : ""}
              <AnimatedNumber value={profitLoss} prefix="₹" />
            </p>
            <p className={`text-xs ${profitLoss >= 0 ? "text-green-400/80" : "text-red-400/80"} mt-1`}>
              {profitLoss >= 0 ? "▲" : "▼"} {plPercent.toFixed(2)}% absolute return
            </p>
          </GlassCard>
        </div>

        {/* Dynamic Warning for CFO approval */}
        {pendingHoldings.length > 0 && (
          <div className="space-y-3" id="pending-approvals-section">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span>⏳</span> Pending CFO Sign-Off ({pendingHoldings.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingHoldings.map((inv) => (
                <GlassCard key={inv.id} hover={false} style={{ border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.02)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white">{inv.instrumentName} ({inv.ticker})</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Deployment Amount: <strong>₹{Number(inv.amountInvested).toLocaleString()}</strong>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Quantity: {inv.quantity} @ ₹{inv.buyPrice}
                      </p>
                      <p className="text-[10px] text-amber-500 font-medium mt-2">
                        Reason: Outlay exceeds ₹10,00,000 threshold. Requires CFO sign-off.
                      </p>
                    </div>
                    <div>
                      {activeRole === "CFO" ? (
                        <button
                          onClick={() => handleApprove(inv.id)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Sign Off & Deploy
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic block mt-1">
                          Login as CFO to sign off
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase form */}
          <div className="lg:col-span-1">
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Deploy Corporate surplus
              </h3>
              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleBuy} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Company / Fund Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Liquid ETF"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    value={form.instrumentName}
                    onChange={(e) => setForm({ ...form, instrumentName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Security Ticker / Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIQUIDCASE"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    value={form.ticker}
                    onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Acquisition Price</label>
                    <input
                      type="number"
                      required
                      placeholder="₹"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.buyPrice}
                      onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Target Yield %</label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.targetReturnPct}
                      onChange={(e) => setForm({ ...form, targetReturnPct: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Target Maturity</label>
                    <input
                      type="date"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.expectedExitDate}
                      onChange={(e) => setForm({ ...form, expectedExitDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Purchase Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Rationale, limit rules or strategy details..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none resize-none"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                
                <div className="text-[10px] text-gray-500">
                  * Deployments &gt; ₹10,00,000 will be held in pending state for CFO approval.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {submitting ? "Processing..." : "Deploy Surpluses"}
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Holdings Ledger */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Active Holdings
            </h3>
            {loading ? (
              <ShimmerLoader type="list" rows={4} />
            ) : approvedHoldings.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400">No active holdings. Complete a deployment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedHoldings.map((hold) => {
                  const currentValue = Number(hold.currentValue) || Number(hold.amountInvested);
                  const pl = currentValue - Number(hold.amountInvested);
                  const pct = (pl / Number(hold.amountInvested)) * 100;

                  return (
                    <GlassCard key={hold.id} hover={false} style={{ padding: "16px" }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs uppercase font-bold text-violet-400 px-2 py-0.5 bg-violet-400/10 rounded-full">
                              {hold.ticker}
                            </span>
                            {hold.notes && <span className="text-xs text-gray-500 truncate max-w-[200px]">{hold.notes}</span>}
                          </div>
                          <h4 className="font-semibold text-white text-base">{hold.instrumentName}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Quantity: {hold.quantity} @ ₹{hold.buyPrice} • Target return: {hold.targetReturnPct}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Current Valuation</p>
                          <p className="text-lg font-bold text-white">₹{currentValue.toLocaleString()}</p>
                          <p className={`text-xs ${pl >= 0 ? "text-green-400" : "text-red-400"} font-semibold mt-1`}>
                            {pl >= 0 ? "▲ +" : "▼ "}₹{Math.abs(pl).toLocaleString()} ({pl >= 0 ? "+" : ""}{pct.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
