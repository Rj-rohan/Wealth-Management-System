/**
 * Application shell — sidebar navigation, top bar, page container.
 *
 * One shell for the whole platform. The sidebar groups every feature from both
 * original products into five sections, so wealth planning and market research
 * read as one application rather than two products side by side.
 *
 * Collapse state lives in the app store rather than local state, so it survives
 * navigation between pages.
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useInvestorProfile } from '../context/InvestorProfileContext';
import { CurrencySelector } from './CurrencySelector';

interface IconProps {
  path: ReactNode;
}

function Icon({ path }: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}

const icons = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  portfolio: (
    <>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </>
  ),
  goals: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  screener: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  research: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  letters: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  star: <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />,
  pulse: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  risk: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
  branches: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  treasury: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  ),
  reports: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  chevron: <polyline points="15 18 9 12 15 6" />,
};

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      { to: '/portfolio', label: 'Portfolio', icon: icons.portfolio },
    ],
  },
  {
    title: 'Planning',
    items: [{ to: '/planning/goals', label: 'Goals & Retirement', icon: icons.goals }],
  },
  {
    title: 'Research',
    items: [
      { to: '/research/screener', label: 'Stock Screener', icon: icons.screener },
      { to: '/research/equity', label: 'Equity Research', icon: icons.research },
      { to: '/research/letters', label: 'Shareholder Letters', icon: icons.letters },
      { to: '/research/methodology', label: 'Methodology', icon: icons.star },
      { to: '/research/watchlist', label: 'Watchlist', icon: icons.star },
    ],
  },
  {
    title: 'Markets',
    items: [
      { to: '/markets/pulse', label: 'Market Pulse', icon: icons.pulse },
      { to: '/markets/risk', label: 'Risk Radar', icon: icons.risk },
      { to: '/markets/treasury', label: 'Treasury AI', icon: icons.treasury },
      { to: '/markets/branches', label: 'Branch Intelligence', icon: icons.branches },
      { to: '/markets/reports', label: 'Smart Reports', icon: icons.reports },
    ],
  },
  {
    title: 'Advisory',
    items: [{ to: '/ai-cfo', label: 'AI CFO', icon: icons.star }],
  },
];

const INVESTOR_TYPE_ACCENT: Record<string, string> = {
  Conservative: '#3B82F6',
  'Aggressive Growth': '#22C55E',
  'Wealth Builder': '#A855F7',
  Balanced: '#F59E0B',
};

interface AppShellProps {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function AppShell({ children, pageTitle, pageSubtitle }: AppShellProps) {
  const { user, logout, sidebarCollapsed, toggleSidebar } = useAppStore();
  const { profile } = useInvestorProfile();
  const location = useLocation();
  const collapsed = sidebarCollapsed;

  const accentColor = profile ? INVESTOR_TYPE_ACCENT[profile.investor.type] || '#22C55E' : '#22C55E';

  return (
    <div className="flex h-full" style={{ background: 'var(--background)' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col h-full transition-all duration-200"
        style={{
          width: collapsed ? '60px' : '232px',
          background: 'var(--background)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-5 no-underline"
          style={{ borderBottom: '1px solid var(--border)', minHeight: '60px' }}
        >
          <div
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: accentColor, color: '#000' }}
          >
            W
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
                Wealth Management
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                System
              </p>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <p
                  className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(161,161,170,0.6)' }}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon }) => {
                  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
                  return (
                    <Link
                      key={to}
                      to={to}
                      title={collapsed ? label : undefined}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 no-underline"
                      style={{
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--muted)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = 'var(--foreground)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--muted)';
                        }
                      }}
                    >
                      <span className="flex-shrink-0">
                        <Icon path={icon} />
                      </span>
                      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
                      {!collapsed && isActive && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--accent)' }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {user && !collapsed && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
                >
                  {(user.name || 'U')[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {profile ? profile.investor.type : user.segment}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full text-xs py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--danger)';
                  e.currentTarget.style.background = 'var(--danger-dim)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Sign Out
              </button>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center py-3 transition-colors"
            style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span
              className="transition-transform duration-200"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <Icon path={icons.chevron} />
            </span>
          </button>
        </div>
      </aside>

      {/* ─── Main column ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header
          className="flex-shrink-0 flex items-center gap-4 px-6"
          style={{
            height: '60px',
            background: 'rgba(13,17,23,0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex-1 min-w-0">
            {pageTitle && (
              <div>
                <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)', margin: 0 }}>
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="text-xs truncate" style={{ color: 'var(--muted)', margin: 0 }}>
                    {pageSubtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <span className="adv-disclaimer">Advisory simulation only — not financial advice</span>
          </div>

          <CurrencySelector />

          {user && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: accentColor, color: '#000' }}
              >
                {(user.name || 'U')[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--foreground)' }}>
                {user.name}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
              >
                {profile ? profile.investor.type : user.segment}
              </span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
