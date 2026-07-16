"use client";
import { useState, useEffect, useRef } from "react";
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

function IconCompany() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"></path>
      <path d="M9 8h1"></path>
      <path d="M9 12h1"></path>
      <path d="M9 16h1"></path>
      <path d="M14 8h1"></path>
      <path d="M14 12h1"></path>
      <path d="M14 16h1"></path>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
    </svg>
  );
}

function IconAssets() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  );
}

function IconBank() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"></path>
      <path d="M3 10h18"></path>
      <path d="M5 6l7-3 7 3"></path>
      <path d="M4 10v11"></path>
      <path d="M20 10v11"></path>
      <path d="M8 14v3"></path>
      <path d="M12 14v3"></path>
      <path d="M16 14v3"></path>
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
}

const navSections = [
  {
    title: "Retail Investor",
    items: [
      { href: "/", label: "Retail Dashboard", Icon: IconDashboard },
      { href: "/portfolio", label: "Retail Portfolio", Icon: IconPortfolio },
      { href: "/buffett-screener", label: "Screener", Icon: IconScreener },
      { href: "/equity-research", label: "Research", Icon: IconResearch },
      { href: "/shareholder-letters", label: "Letters", Icon: IconLetters }
    ]
  },
  {
    title: "Corporate Module",
    items: [
      { href: "/corporate", label: "Corp Dashboard", Icon: IconDashboard },
      { href: "/corporate/company", label: "Company Profile", Icon: IconCompany },
      { href: "/corporate/assets", label: "Assets", Icon: IconAssets },
      { href: "/corporate/portfolio", label: "Corp Allocation", Icon: IconPortfolio },
      { href: "/corporate/treasury", label: "Treasury Accounts", Icon: IconBank },
      { href: "/corporate/cashflow", label: "Cash Flow Ledger", Icon: IconBook },
      { href: "/corporate/compliance", label: "Audit & Compliance", Icon: IconShield }
    ]
  },
  {
    title: "Advanced AI & Analytics",
    items: [
      { href: "/ai-cfo", label: "AI CFO Advisor", Icon: IconAICFO },
      { href: "/market-pulse", label: "Market Pulse", Icon: IconMarketPulse },
      { href: "/treasury-autopilot", label: "Treasury Forecasting", Icon: IconTreasury },
      { href: "/risk-radar", label: "Risk Stress-Testing", Icon: IconRiskRadar },
      { href: "/branch-intelligence", label: "Branch mapping", Icon: IconBranches },
      { href: "/corporate-reports", label: "Corporate Reports", Icon: IconReports }
    ]
  }
];

const investorTypeAccent = {
  Conservative: "#3B82F6",
  "Aggressive Growth": "#22C55E",
  "Wealth Builder": "#A855F7",
  Balanced: "#F59E0B",
};

export default function AppShell({ children, pageTitle, pageSubtitle, maxWidth = "max-w-7xl" }) {
  const [collapsed, setCollapsed] = useState(true); // default collapsed
  const pathname = usePathname();
  const { profile, clearProfile } = useUser();
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 300); // 300ms delay
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const sidebarWidth = collapsed ? "60px" : "220px";
  const accentColor = profile ? (investorTypeAccent[profile.investor.type] || "#22C55E") : "#22C55E";

  return (
    <div
      className="flex h-full"
      style={{
        background: "#0D1117",
        "--sidebar-width": sidebarWidth
      }}
    >
      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out"
        style={{
          width: "var(--sidebar-width)",
          background: "#0D1117",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", height: "60px" }}
        >
          <div
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: accentColor, color: "#000" }}
          >
            M
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
            collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
          }`}>
            <p className="text-sm font-semibold text-white leading-tight truncate">MyMoneyPlant</p>
            <p className="text-xs truncate" style={{ color: "#A1A1AA" }}>Wealth Platform</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={section.title} className="space-y-1.5">
              <p className={`px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest transition-all duration-300 ease-in-out truncate ${
                collapsed ? "h-0 opacity-0 overflow-hidden" : "h-auto opacity-100"
              }`}>
                {section.title}
              </p>
              {collapsed && sIdx > 0 && <hr className="border-white/5 my-2 mx-1 transition-opacity duration-300" />}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, Icon }) => {
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
                      <span className={`text-sm font-medium transition-all duration-300 ease-in-out whitespace-nowrap truncate ${
                        collapsed ? "w-0 opacity-0 overflow-hidden" : "w-32 opacity-100"
                      }`}>
                        {label}
                      </span>
                      {isActive && (
                        <span
                          className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity duration-300 ${
                            collapsed ? "opacity-0" : "opacity-100"
                          }`}
                          style={{ background: "#22C55E" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Profile */}
          {profile && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
                >
                  {(profile.name || "U")[0].toUpperCase()}
                </div>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                  collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
                }`}>
                  <p className="text-xs font-medium text-white truncate">{profile.name || "Investor"}</p>
                  <p className="text-xs truncate" style={{ color: "#A1A1AA" }}>{profile.investor.type}</p>
                </div>
              </div>
              <button
                onClick={clearProfile}
                className={`w-full text-xs py-1.5 rounded-md transition-all duration-300 text-left ${
                  collapsed ? "h-0 opacity-0 overflow-hidden py-0" : "h-auto opacity-100 py-1.5 px-2"
                }`}
                style={{ color: "#A1A1AA", background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
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
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex-shrink-0 flex items-center border-b border-white/5"
          style={{
            height: "60px",
            background: "rgba(13,17,23,0.9)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className={`w-full ${maxWidth} mx-auto px-6 flex items-center justify-between`}>
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
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
