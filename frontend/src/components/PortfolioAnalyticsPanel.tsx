/**
 * Portfolio analytics — custodian-level view across all asset classes.
 *
 * Moved out of the dashboard during the merge so that Portfolio is one place:
 * this panel covers valuation, performance, allocation and rebalancing from the
 * wealth-planning engine, alongside the equity tracker panel. The calculations
 * and components are unchanged.
 */

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import AssetAllocationChart from './AssetAllocationChart';
import PerformanceChart from './PerformanceChart';
import RebalancingAlertsPanel from './RebalancingAlerts';
import HoldingsView from './HoldingsView';
import { formatCurrency } from '../utils/formatters';

export default function PortfolioAnalyticsPanel() {
  const {
    user,
    portfolioSummary,
    portfolioPerformance,
    assetAllocation,
    rebalancingAlerts,
    isLoadingPortfolio,
    fetchPortfolioData,
    currency,
  } = useAppStore();

  useEffect(() => {
    if (user) fetchPortfolioData(user.id);
  }, [user?.id]);

  if (isLoadingPortfolio) {
    return (
      <div className="page-state">
        <div className="spinner" />
        <p>Calculating portfolio analytics...</p>
      </div>
    );
  }

  if (!portfolioSummary) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Complete your onboarding to view portfolio analytics.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Portfolio KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          {
            label: 'Portfolio Value',
            value: formatCurrency(portfolioSummary.total_portfolio_value, currency),
            color: 'var(--accent-primary)',
          },
          {
            label: 'Net Worth',
            value: formatCurrency(portfolioSummary.net_worth, currency),
            color: portfolioSummary.net_worth >= 0 ? 'var(--status-healthy)' : 'var(--status-vulnerable)',
          },
          { label: 'Risk Profile', value: portfolioSummary.risk_profile, color: 'var(--text-primary)' },
          {
            label: 'Rebalance Needed',
            value: rebalancingAlerts?.needs_rebalance
              ? `⚠ ${rebalancingAlerts.alert_count} Alerts`
              : '✓ Aligned',
            color: rebalancingAlerts?.needs_rebalance ? 'var(--status-caution)' : 'var(--status-healthy)',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel" style={{ padding: '1rem' }}>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Performance */}
      {portfolioPerformance && (
        <div className="glass-panel">
          <h3
            style={{
              margin: '0 0 1rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            📈 Performance Analytics
          </h3>
          <PerformanceChart performance={portfolioPerformance} />
        </div>
      )}

      {/* Allocation + Rebalancing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {assetAllocation && (
          <div className="glass-panel">
            <h3
              style={{
                margin: '0 0 1rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ⚖️ Asset Allocation
            </h3>
            <AssetAllocationChart allocation={assetAllocation} />
          </div>
        )}

        {rebalancingAlerts && (
          <div className="glass-panel">
            <h3
              style={{
                margin: '0 0 1rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              🔔 Rebalancing Alerts
            </h3>
            <RebalancingAlertsPanel alerts={rebalancingAlerts} />
          </div>
        )}
      </div>

      {/* Holdings */}
      <div className="glass-panel">
        <h3
          style={{
            margin: '0 0 1rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          🏦 Holdings Breakdown
        </h3>
        <HoldingsView summary={portfolioSummary} />
      </div>
    </div>
  );
}
