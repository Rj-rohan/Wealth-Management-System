"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "./context/UserContext";
import AppShell from "./components/AppShell";

const features = [
  {
    href: "/buffett-screener",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    title: "Buffett Screener",
    desc: "Score stocks using Buffett's Secret Sauce — ROE, moat, debt, earnings growth, and valuation.",
    accent: "#22C55E",
  },
  {
    href: "/portfolio",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Portfolio Tracker",
    desc: "Track your holdings, P&L, and get budget-aware stock suggestions tailored to your profile.",
    accent: "#A855F7",
  },
  {
    href: "/equity-research",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Equity Research",
    desc: "Deep-dive sector research on Power, Tyres, Banking, FMCG & IT — Buffett + Motilal insights.",
    accent: "#3B82F6",
  },
  {
    href: "/shareholder-letters",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Shareholder Letters",
    desc: "Key lessons from Buffett's 1998–2017 letters with Indian market context, filtered for your type.",
    accent: "#D4AF37",
  },
];

const typeAccents = {
  Conservative: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
  "Aggressive Growth": { color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
  "Wealth Builder": { color: "#A855F7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" },
  Balanced: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
};

export default function Home() {
  const { profile, loaded, clearProfile } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loaded && !profile) router.push("/onboarding");
  }, [loaded, profile, router]);

  if (!loaded || !profile) return null;

  const budget = profile.monthlyInvestment || 0;
  const equityBudget = Math.round(budget * profile.investor.allocation.equity / 100);
  const debtBudget = Math.round(budget * profile.investor.allocation.debt / 100);
  const goldBudget = Math.round(budget * profile.investor.allocation.gold / 100);
  const accent = typeAccents[profile.investor.type] || typeAccents["Balanced"];
  const existingPortfolio = Number(profile.existingPortfolio || 0);

  const quickStats = [
    { label: "Investment Horizon", value: `${profile.horizon} yrs`, sub: "time in market" },
    { label: "Risk Level", value: profile.riskAppetite.charAt(0).toUpperCase() + profile.riskAppetite.slice(1), sub: "appetite" },
    { label: "Existing Portfolio", value: existingPortfolio > 0 ? `₹${(existingPortfolio / 100000).toFixed(1)}L` : "₹0", sub: "current value" },
    { label: "Max P/E", value: `${profile.investor.maxStockPE}x`, sub: "recommended" },
  ];

  return (
    <AppShell pageTitle="Dashboard" pageSubtitle="Your investment command center">
      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">

        {/* Investor Profile Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
              >
                {profile.investor.icon}
              </div>
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: "#A1A1AA" }}>Welcome back</p>
                <h2 className="text-xl font-bold text-white">{profile.name || "Investor"}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: accent.bg, color: accent.color, border: `1px solid ${accent.border}` }}
                  >
                    {profile.investor.type}
                  </span>
                  <span className="text-xs" style={{ color: "#A1A1AA" }}>Age {profile.age}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                  <span className="text-xs" style={{ color: "#A1A1AA" }}>{profile.goal} goal</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "#A1A1AA" }}>Monthly Budget</p>
              <p className="text-3xl font-bold text-white">₹{Number(budget).toLocaleString()}</p>
              <p className="text-sm mt-0.5" style={{ color: "#22C55E" }}>₹{equityBudget.toLocaleString()} equity</p>
            </div>
          </div>

          {/* Allocation Bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A1A1AA" }}>Asset Allocation</p>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="rounded-full transition-all"
                style={{ width: `${profile.investor.allocation.equity}%`, background: "#22C55E" }}
              />
              <div
                className="rounded-full transition-all"
                style={{ width: `${profile.investor.allocation.debt}%`, background: "#A1A1AA" }}
              />
              <div
                className="rounded-full transition-all"
                style={{ width: `${profile.investor.allocation.gold}%`, background: "#D4AF37" }}
              />
            </div>
            <div className="flex gap-5 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
                <span className="text-xs" style={{ color: "#A1A1AA" }}>Equity {profile.investor.allocation.equity}%</span>
                <span className="text-xs font-medium text-white ml-1">₹{equityBudget.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#A1A1AA" }} />
                <span className="text-xs" style={{ color: "#A1A1AA" }}>Debt {profile.investor.allocation.debt}%</span>
                <span className="text-xs font-medium text-white ml-1">₹{debtBudget.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#D4AF37" }} />
                <span className="text-xs" style={{ color: "#A1A1AA" }}>Gold {profile.investor.allocation.gold}%</span>
                <span className="text-xs font-medium text-white ml-1">₹{goldBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs italic" style={{ color: "#A1A1AA" }}>
              &quot;{profile.investor.buffettAdvice}&quot; <span style={{ color: "#D4AF37" }}>— Warren Buffett</span>
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickStats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: "#A1A1AA" }}>{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#A1A1AA" }}>
            Investment Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group block rounded-xl p-5 transition-all duration-200"
                style={{
                  background: "#161B22",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${f.accent}40`;
                  e.currentTarget.style.background = "#1C2128";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
                  e.currentTarget.style.background = "#161B22";
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200"
                    style={{ background: `${f.accent}18`, color: f.accent }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                  >
                    Live
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Buffett Quote */}
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5" style={{ color: "#D4AF37" }}>&ldquo;</span>
            <div>
              <p className="text-sm leading-relaxed italic text-white">
                It&apos;s far better to buy a wonderful company at a fair price than a fair company at a wonderful price.
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: "#D4AF37" }}>— Warren Buffett</p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
