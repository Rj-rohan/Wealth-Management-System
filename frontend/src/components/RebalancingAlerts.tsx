/**
 * RebalancingAlerts — Displays prioritized drift alerts with action amounts.
 * Strictly advisory: never recommends specific securities, only asset classes.
 * Aligns with the research safety guardrails.
 */
import { RebalancingAlerts as RebalancingAlertsType } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';

interface Props {
  alerts: RebalancingAlertsType;
}

export default function RebalancingAlertsPanel({ alerts }: Props) {
  const { currency } = useAppStore();
  const { needs_rebalance, total_drift_pct, alert_count, alerts: items, risk_profile } = alerts;

  if (!needs_rebalance || items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
        <p style={{ margin: 0, fontWeight: 600 }}>Portfolio Aligned</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Your allocation is within target drift thresholds for a {risk_profile} portfolio.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Summary header */}
      <div style={{
        background: 'rgba(244, 162, 97, 0.12)', border: '1px solid rgba(244, 162, 97, 0.4)',
        borderRadius: '8px', padding: '0.75rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f4a261' }}>
            {alert_count} Rebalancing {alert_count === 1 ? 'Action' : 'Actions'} Required
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Total portfolio drift: {total_drift_pct}% from {risk_profile} target
          </div>
        </div>
        <div style={{ fontSize: '1.5rem' }}>⚖️</div>
      </div>

      {/* Alert cards */}
      {items.map(alert => (
        <div key={alert.category} style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.875rem',
          borderLeft: `3px solid ${alert.action === 'REDUCE' ? '#e63946' : '#2ec4b6'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                borderRadius: '4px', textTransform: 'uppercase',
                background: alert.action === 'REDUCE' ? 'rgba(230,57,70,0.2)' : 'rgba(46,196,182,0.2)',
                color: alert.action === 'REDUCE' ? '#e63946' : '#2ec4b6',
              }}>
                {alert.action === 'REDUCE' ? '↓ Reduce' : '↑ Increase'}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{alert.category}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Drift: {alert.drift_pct}%
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
            {alert.message}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Current: <strong style={{ color: 'var(--text-primary)' }}>{alert.current_pct}%</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Target: <strong style={{ color: 'var(--text-primary)' }}>{alert.target_pct}%</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Est. Amount: <strong style={{ color: 'var(--accent-primary)' }}>
                {formatCurrency(alert.amount_to_move, currency)}
              </strong>
            </span>
          </div>
        </div>
      ))}

      {/* Safety disclaimer */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '6px', padding: '0.6rem 0.75rem',
      }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-primary)' }}>Advisory Only:</strong> {alerts.disclaimer}
        </p>
      </div>
    </div>
  );
}
