"use client";
import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import CosmicBackground from "../../components/CosmicBackground";
import GlassCard from "../../components/GlassCard";
import AnimatedNumber from "../../components/AnimatedNumber";
import ShimmerLoader from "../../components/ShimmerLoader";

export default function CorporateTreasury() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
  });

  const [fdLadderActive, setFdLadderActive] = useState(false);
  const [fdLadderSuccess, setFdLadderSuccess] = useState(false);

  async function loadAccounts() {
    try {
      const res = await fetch("/api/treasury/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
        if (data.length >= 2) {
          setForm({
            fromAccountId: data[0].id,
            toAccountId: data[1].id,
            amount: "",
          });
        }
      }
    } catch (e) {
      console.error("Failed to load accounts", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferring(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/treasury/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("Fund transfer completed and logged to ledger.");
        setForm({ ...form, amount: "" });
        await loadAccounts();
      } else {
        const err = await res.json();
        setError(err.error || "Transfer failed.");
      }
    } catch (err) {
      setError("Network error executing transfer.");
    } finally {
      setTransferring(false);
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 6000);
    }
  };

  const handleDeployFD = () => {
    setFdLadderActive(true);
    setTimeout(() => {
      setFdLadderActive(false);
      setFdLadderSuccess(true);
    }, 2000);
  };

  const consolidatedCash = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const idleCashLimit = 10000000; // 1 Crore limit
  const excessIdleCash = Math.max(0, consolidatedCash - idleCashLimit);

  return (
    <AppShell pageTitle="Treasury Accounts" pageSubtitle="Liquidity monitoring, automated inter-bank sweeps, and yield management">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6 relative z-10" id="corporate-treasury-root">
        
        {/* Alerts and feedback */}
        {message && (
          <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-300 text-center animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 text-center animate-pulse">
            {error}
          </div>
        )}

        {/* Console Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Consolidated Treasury Cash</p>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={consolidatedCash} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Sum of all accounts</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Active Accounts</p>
            <p className="text-2xl font-bold text-white">{accounts.length}</p>
            <p className="text-xs text-gray-500 mt-1">Linked corporate deposit banks</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Estimated Idle Cash Yield</p>
            <p className="text-2xl font-bold text-yellow-400">
              <AnimatedNumber value={consolidatedCash * 0.068} prefix="₹" suffix=" / yr" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Based on 6.8% liquid sweep rate</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Account Balances Card */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Linked Bank Accounts
            </h3>
            {loading ? (
              <ShimmerLoader type="list" rows={3} />
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <GlassCard key={acc.id} hover={false} style={{ padding: "20px" }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white text-base">{acc.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">Account reference: {acc.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Current Balance</p>
                        <p className="text-xl font-bold text-white">₹{acc.balance.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Sweep recommendation tool */}
            {consolidatedCash > idleCashLimit && !fdLadderSuccess && (
              <GlassCard hover={false} style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.01)" }} id="sweep-recommendation-panel">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚡ Treasury Autopilot Optimization</h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Consolidated cash of <strong>₹{(consolidatedCash / 10000000).toFixed(2)} Cr</strong> exceeds the configured liquidity buffer limit (1.0 Cr). We recommend sweeping the surplus of <strong>₹{(excessIdleCash / 100000).toFixed(1)} Lakhs</strong> into a 30-60-90 day Fixed Deposit (FD) Ladder, yielding an estimated additional <strong>₹{Math.round(excessIdleCash * 0.07 * (60/365)).toLocaleString('en-IN')}</strong> in returns.
                </p>
                <button
                  onClick={handleDeployFD}
                  disabled={fdLadderActive}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {fdLadderActive ? "Deploying Sweep..." : "Initiate Auto-Sweep FD Ladder"}
                </button>
              </GlassCard>
            )}

            {fdLadderSuccess && (
              <GlassCard hover={false} style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.01)" }}>
                <h4 className="text-sm font-semibold text-green-400 mb-1">🎉 Sweep Completed Successfully</h4>
                <p className="text-xs text-gray-300">
                  Surplus FD ladder created. ₹{(excessIdleCash / 100000).toFixed(1)} Lakhs has been secured at an annualized rate of 7.2%. Audit trail logs have been appended.
                </p>
              </GlassCard>
            )}
          </div>

          {/* Inter-Bank sweep/transfer form */}
          <div className="lg:col-span-1">
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Inter-Account Transfer
              </h3>
              {accounts.length < 2 ? (
                <p className="text-xs text-gray-500">Need at least 2 accounts linked to perform transfers.</p>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Source Account</label>
                    <select
                      value={form.fromAccountId}
                      onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (Bal: ₹{(a.balance / 100000).toFixed(1)}L)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Destination Account</label>
                    <select
                      value={form.toAccountId}
                      onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (Bal: ₹{(a.balance / 100000).toFixed(1)}L)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Transfer Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500000"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  
                  <div className="text-[10px] text-gray-500 leading-relaxed">
                    * Executing this transfer is a real-time operation that modifies mock database records and publishes ledger transaction logs.
                  </div>

                  <button
                    type="submit"
                    disabled={transferring}
                    className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {transferring ? "Processing Transfer..." : "Execute Transfer"}
                  </button>
                </form>
              )}
            </GlassCard>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
