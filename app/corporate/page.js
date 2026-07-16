"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";
import ShimmerLoader from "../components/ShimmerLoader";

const sectionAccents = {
  profile: "#3B82F6",
  assets: "#10B981",
  investments: "#8B5CF6",
  treasury: "#F59E0B",
  cashflow: "#EC4899",
  compliance: "#EF4444",
};

export default function CorporateDashboard() {
  const [data, setData] = useState({
    assets: 0,
    investments: 0,
    cash: 0,
    deadlinesCount: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [assetsRes, investmentsRes, accountsRes, deadlinesRes] = await Promise.all([
          fetch("/api/assets"),
          fetch("/api/investments"),
          fetch("/api/treasury/accounts"),
          fetch("/api/compliance/deadlines"),
        ]);

        const assets = assetsRes.ok ? await assetsRes.json() : [];
        const investments = investmentsRes.ok ? await investmentsRes.json() : [];
        const accounts = accountsRes.ok ? await accountsRes.json() : [];
        const deadlines = deadlinesRes.ok ? await deadlinesRes.json() : [];

        const totalAssets = assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
        const totalInvestments = investments.reduce((sum, i) => sum + (Number(i.amountInvested) || 0), 0);
        const totalCash = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
        const pendingDeadlines = deadlines.filter(d => d.status === "pending").length;

        setData({
          assets: totalAssets,
          investments: totalInvestments,
          cash: totalCash,
          deadlinesCount: pendingDeadlines,
          loading: false,
        });
      } catch (e) {
        console.error("Failed to load corporate stats", e);
        setData(prev => ({ ...prev, loading: false }));
      }
    }
    loadStats();
  }, []);

  const totalWealth = data.cash + data.investments + data.assets;

  const quickLinks = [
    {
      href: "/corporate/company",
      title: "Company Profile",
      desc: "Configure corporate identity, tax brackets, and authorization credentials.",
      accent: sectionAccents.profile,
      icon: "🏢",
    },
    {
      href: "/corporate/assets",
      title: "Corporate Assets",
      desc: "Manage physical, digital, and financial assets with depreciation analytics.",
      accent: sectionAccents.assets,
      icon: "🏗️",
    },
    {
      href: "/corporate/portfolio",
      title: "Corporate Allocation",
      desc: "Deploy treasury capital into equity, bonds, or secure commercial paper.",
      accent: sectionAccents.investments,
      icon: "📈",
    },
    {
      href: "/corporate/treasury",
      title: "Treasury Accounts",
      desc: "Monitor bank holdings, trigger sweeps, and build yield-bearing FD ladders.",
      accent: sectionAccents.treasury,
      icon: "🏦",
    },
    {
      href: "/corporate/cashflow",
      title: "Cash Flow Ledger",
      desc: "Log company inflows, outflows, and reconcile with bank statement uploads.",
      accent: sectionAccents.cashflow,
      icon: "📊",
    },
    {
      href: "/corporate/compliance",
      title: "Compliance & Auditing",
      desc: "Review cryptographic immutable logs and track statutory tax deadlines.",
      accent: sectionAccents.compliance,
      icon: "🛡️",
    },
  ];

  return (
    <AppShell pageTitle="Corporate Command Center" pageSubtitle="Enterprise wealth & treasury dashboard">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-8 relative z-10" id="corporate-dashboard-root">
        
        {/* Top Summary Card */}
        <GlassCard hover={false} style={{ padding: "32px" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Total Enterprise Liquidity
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {data.loading ? (
                  <span>Loading...</span>
                ) : (
                  <AnimatedNumber value={totalWealth} prefix="₹" formatIndian={true} />
                )}
              </h2>
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <span>●</span> Multi-account consolidated ledger active
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
              <div>
                <p className="text-xs text-gray-400 mb-1">Cash Balance</p>
                <p className="text-lg font-bold text-white">
                  {data.loading ? "..." : `₹${(data.cash / 100000).toFixed(1)}L`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Invested Capital</p>
                <p className="text-lg font-bold text-white">
                  {data.loading ? "..." : `₹${(data.investments / 100000).toFixed(1)}L`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Asset Value</p>
                <p className="text-lg font-bold text-white">
                  {data.loading ? "..." : `₹${(data.assets / 100000).toFixed(1)}L`}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Warning alerts if compliance deadlines are pending */}
        {!data.loading && data.deadlinesCount > 0 && (
          <div 
            className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-200 text-sm animate-pulse"
            id="compliance-alert-banner"
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span><strong>Action Required:</strong> You have {data.deadlinesCount} pending compliance deadlines requiring attention.</span>
            </div>
            <Link 
              href="/corporate/compliance"
              className="text-xs font-semibold underline hover:text-white"
            >
              Resolve Filing
            </Link>
          </div>
        )}

        {/* Corporate tools navigation grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Treasury & Corporate Portals
          </h3>
          {data.loading ? (
            <ShimmerLoader type="grid" rows={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="corporate-portal-grid">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block group"
                >
                  <GlassCard
                    style={{ height: "100%", cursor: "pointer" }}
                    hover={true}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl p-2 rounded-lg bg-white/5">{link.icon}</span>
                      <h4 className="font-semibold text-white group-hover:text-white transition-colors">
                        {link.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {link.desc}
                    </p>
                    <div className="mt-4 flex items-center justify-end">
                      <span 
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: `${link.accent}15`, color: link.accent }}
                      >
                        Enter Portal →
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
