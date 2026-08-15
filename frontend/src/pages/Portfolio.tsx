/**
 * Portfolio.
 *
 * Both teams built a portfolio view of a different kind, and both are kept:
 *
 *   Analytics — custodian-level holdings across every asset class, driving
 *               valuation, performance, allocation and rebalancing.
 *   Tracker   — self-entered equity positions with cost basis, live P&L and
 *               budget-aware suggestions from the Buffett scoring model.
 *
 * They answer different questions, so they are tabs of one page rather than two
 * competing pages.
 */

import { useState } from 'react';
import AppShell from '../components/AppShell';
import PortfolioAnalyticsPanel from '../components/PortfolioAnalyticsPanel';
import PortfolioTrackerPanel from '../components/PortfolioTrackerPanel';

type Tab = 'analytics' | 'tracker';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: '📊 Analytics' },
  { id: 'tracker', label: '💹 Equity Tracker' },
];

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

  return (
    <AppShell pageTitle="Portfolio" pageSubtitle="Holdings, performance, P&L and rebalancing">
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            padding: '4px',
            width: 'fit-content',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                border: 'none',
                borderRadius: '7px',
                padding: '0.45rem 1.25rem',
                color: activeTab === tab.id ? '#04140a' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'analytics' ? <PortfolioAnalyticsPanel /> : <PortfolioTrackerPanel />}
      </div>
    </AppShell>
  );
}
