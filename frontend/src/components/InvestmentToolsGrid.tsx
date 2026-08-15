/**
 * Research and markets tool launcher.
 *
 * Carried over from the markets product's home screen and repointed at the
 * unified routes. It duplicates the sidebar deliberately: the sidebar is for
 * navigation, this grid explains what each tool does.
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Tool {
  to: string;
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const TOOLS: Tool[] = [
  {
    to: '/research/screener',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    title: 'Buffett Screener',
    desc: "Score stocks using Buffett's Secret Sauce — ROE, moat, debt, earnings growth, and valuation.",
    accent: '#22C55E',
  },
  {
    to: '/portfolio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Portfolio Tracker',
    desc: 'Track your holdings, P&L, and get budget-aware stock suggestions tailored to your profile.',
    accent: '#A855F7',
  },
  {
    to: '/research/equity',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: 'Equity Research',
    desc: 'Deep-dive sector research on Power, Tyres, Banking, FMCG & IT — Buffett + Motilal insights.',
    accent: '#3B82F6',
  },
  {
    to: '/research/letters',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Shareholder Letters',
    desc: "Key lessons from Buffett's 1998–2017 letters with Indian market context, filtered for your type.",
    accent: '#D4AF37',
  },
  {
    to: '/research/methodology',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
      </svg>
    ),
    title: 'Buffett Methodology',
    desc: 'The 6 core principles and 100-point scoring formula behind every stock rating on this platform.',
    accent: '#F59E0B',
  },
  {
    to: '/research/watchlist',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
      </svg>
    ),
    title: 'Watchlist',
    desc: "Track companies you've assessed with Buffett's methodology. Sort, search, and manage your shortlist.",
    accent: '#D4AF37',
  },
  {
    to: '/markets/pulse',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Market Pulse',
    desc: 'Live quotes for your tracked symbols and the headlines moving Indian markets today.',
    accent: '#22C55E',
  },
  {
    to: '/markets/risk',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Risk Radar',
    desc: 'Stress-test your portfolio against crashes, rate hikes, currency shocks and liquidity crunches.',
    accent: '#DC2626',
  },
];

export default function InvestmentToolsGrid() {
  return (
    <div>
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--muted)', margin: '0 0 1rem' }}
      >
        Research & Market Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TOOLS.map((f) => (
          <Link
            key={f.title}
            to={f.to}
            className="group block rounded-xl p-5 transition-all duration-200 no-underline"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = `1px solid ${f.accent}40`;
              e.currentTarget.style.background = 'var(--surface-raised)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid var(--border)';
              e.currentTarget.style.background = 'var(--surface)';
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${f.accent}18`, color: f.accent }}
            >
              {f.icon}
            </div>
            <h3 className="font-semibold mb-1.5" style={{ color: 'var(--foreground)', margin: '0 0 0.375rem' }}>
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)', margin: 0 }}>
              {f.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
