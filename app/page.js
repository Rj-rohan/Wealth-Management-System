"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "./context/UserContext";

const features = [
  {
    href: "/buffett-screener",
    icon: "🧠",
    title: "Warren Buffett Screener",
    desc: "Score stocks using Buffett's Secret Sauce — ROE, moat, debt, earnings growth, and valuation.",
    badge: "Live",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    href: "/portfolio",
    icon: "📊",
    title: "Portfolio Tracker",
    desc: "Track your holdings, P&L, and get budget-aware stock suggestions tailored to your profile.",
    badge: "Live",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    href: "/equity-research",
    icon: "📰",
    title: "Equity Research",
    desc: "Deep-dive sector research on Power, Tyres, Banking, FMCG & IT — Buffett + Motilal insights.",
    badge: "Live",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    href: "/shareholder-letters",
    icon: "📬",
    title: "Shareholder Letters",
    desc: "Key lessons from Buffett's 1998–2017 letters with Indian market context, filtered for your type.",
    badge: "Live",
    badgeColor: "bg-green-100 text-green-700",
  },
];

const typeColors = {
  Conservative: "bg-blue-50 border-blue-200 text-blue-800",
  "Aggressive Growth": "bg-green-50 border-green-200 text-green-800",
  "Wealth Builder": "bg-purple-50 border-purple-200 text-purple-800",
  Balanced: "bg-amber-50 border-amber-200 text-amber-800",
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
  const colors = typeColors[profile.investor.type] || typeColors["Balanced"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">🌱 MyMoneyPlant</span>
          </div>
          <button onClick={clearProfile} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Reset Profile
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Banner */}
        <div className={`border rounded-xl p-5 ${colors}`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{profile.investor.icon}</span>
              <div>
                <p className="text-sm opacity-70">Welcome back,</p>
                <h2 className="text-xl font-bold">{profile.name || "Investor"}</h2>
                <p className="text-sm font-semibold">{profile.investor.type} Investor · Age {profile.age} · {profile.goal} goal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60 uppercase tracking-wide">Monthly Budget</p>
              <p className="text-2xl font-bold">₹{Number(budget).toLocaleString()}</p>
              <p className="text-xs opacity-70">₹{equityBudget.toLocaleString()} for equity</p>
            </div>
          </div>

          {/* Allocation Bar */}
          <div className="mt-4">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-1.5">
              <div className="bg-blue-500" style={{ width: `${profile.investor.allocation.equity}%` }} />
              <div className="bg-gray-400" style={{ width: `${profile.investor.allocation.debt}%` }} />
              <div className="bg-yellow-400" style={{ width: `${profile.investor.allocation.gold}%` }} />
            </div>
            <div className="flex gap-4 text-xs opacity-70">
              <span>🔵 Equity {profile.investor.allocation.equity}%</span>
              <span>⚪ Debt {profile.investor.allocation.debt}%</span>
              <span>🟡 Gold {profile.investor.allocation.gold}%</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="text-xs italic opacity-80">&quot;{profile.investor.buffettAdvice}&quot; — Warren Buffett</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Investment Horizon", val: `${profile.horizon} years`, icon: "📅" },
            { label: "Risk Appetite", val: profile.riskAppetite.charAt(0).toUpperCase() + profile.riskAppetite.slice(1), icon: "⚖️" },
            { label: "Existing Portfolio", val: `₹${Number(profile.existingPortfolio || 0).toLocaleString()}`, icon: "💼" },
            { label: "Recommended Max P/E", val: `${profile.investor.maxStockPE}x`, icon: "📈" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-lg">{s.icon}</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{s.val}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Investment Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <Link key={f.title} href={f.href} className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{f.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${f.badgeColor}`}>{f.badge}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Buffett Quote */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 text-lg font-medium italic">
            &quot;It&apos;s far better to buy a wonderful company at a fair price than a fair company at a wonderful price.&quot;
          </p>
          <p className="text-amber-600 text-sm mt-2">— Warren Buffett</p>
        </div>
      </div>
    </div>
  );
}
