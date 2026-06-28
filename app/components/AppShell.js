"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "../context/UserContext";

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPortfolio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function IconScreener() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconResearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconLetters() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconAICFO() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
    </svg>
  );
}

function IconMarketPulse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconRiskRadar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function IconBranches() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconTreasury() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function IconReports() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

const navItems = [
  { href: "/", label: "Dashboard", Icon: IconDashboard },
  { href: "/portfolio", label: "Portfolio", Icon: IconPortfolio },
  { href: "/buffett-screener", label: "Screener", Icon: IconScreener },
  { href: "/equity-research", label: "Research", Icon: IconResearch },
  { href: "/shareholder-letters", label: "Letters", Icon: IconLetters },
  { href: "/ai-cfo", label: "AI CFO", Icon: IconAICFO },
  { href: "/market-pulse", label: "Market Pulse", Icon: IconMarketPulse },
  { href: "/risk-radar", label: "Risk Radar", Icon: IconRiskRadar },
  { href: "/branch-intelligence", label: "Branches", Icon: IconBranches },
  { href: "/treasury-autopilot", label: "Treasury AI", Icon: IconTreasury },
  { href: "/smart-reports", label: "Reports", Icon: IconReports },
];

const investorTypeAccent = {
  Conservative: "#3B82F6",
  "Aggressive Growth": "#22C55E",
  "Wealth Builder": "#A855F7",
  Balanced: "#F59E0B",
};

export default function AppShell({ children, pageTitle, pageSubtitle }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { profile, clearProfile } = useUser();

  const accentColor = profile ? (investorTypeAccent[profile.investor.type] || "#22C55E") : "#22C55E";

  return (
    <div className="flex h-full" style={{ background: "#0D1117" }}>
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col h-full transition-all duration-200"
        style={{
          width: collapsed ? "60px" : "220px",
          background: "#0D1117",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: "60px" }}
        >
          <div
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: accentColor, color: "#000" }}
          >
            M
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white leading-tight truncate">MyMoneyPlant</p>
              <p className="text-xs" style={{ color: "#A1A1AA" }}>Wealth Platform</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
                style={{
                  background: isActive ? "rgba(34,197,94,0.1)" : "transparent",
                  color: isActive ? "#22C55E" : "#A1A1AA",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#A1A1AA";
                  }
                }}
              >
                <span className="flex-shrink-0">
                  <Icon />
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {!collapsed && isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "#22C55E" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Profile */}
          {profile && !collapsed && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
                >
                  {(profile.name || "U")[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-white truncate">{profile.name || "Investor"}</p>
                  <p className="text-xs truncate" style={{ color: "#A1A1AA" }}>{profile.investor.type}</p>
                </div>
              </div>
              <button
                onClick={clearProfile}
                className="w-full text-xs py-1.5 rounded-md transition-colors"
                style={{ color: "#A1A1AA", background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#DC2626";
                  e.currentTarget.style.background = "rgba(220,38,38,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#A1A1AA";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Reset Profile
              </button>
            </div>
          )}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-3 transition-colors"
            style={{ color: "#A1A1AA" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; }}
          >
            <span
              className="transition-transform duration-200"
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <IconChevron />
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex-shrink-0 flex items-center px-6"
          style={{
            height: "60px",
            background: "rgba(13,17,23,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex-1">
            {pageTitle && (
              <div>
                <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
                {pageSubtitle && (
                  <p className="text-xs" style={{ color: "#A1A1AA" }}>{pageSubtitle}</p>
                )}
              </div>
            )}
          </div>
          {profile && (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: accentColor, color: "#000" }}
                >
                  {(profile.name || "U")[0].toUpperCase()}
                </div>
                <span className="text-xs text-white font-medium">{profile.name || "Investor"}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}
                >
                  {profile.investor.type}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
