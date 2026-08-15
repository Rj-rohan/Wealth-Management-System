/**
 * AssetAllocationChart — Donut chart + table comparing current vs. target allocation.
 * Uses SVG for the donut ring (no external chart dep required).
 * Highlights asset classes that need rebalancing in amber/red.
 */
import { AssetAllocation } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_COLORS: Record<string, string> = {
  Stocks: '#6366f1',
  'Mutual Funds': '#8b5cf6',
  Bonds: '#2ec4b6',
  Gold: '#f4a261',
  Cash: '#94a3b8',
  'Real Estate': '#10b981',
  'Fixed Deposits': '#3b82f6',
  EPF: '#f59e0b',
  PPF: '#ec4899',
  NPS: '#06b6d4',
  Crypto: '#f97316',
  Other: '#64748b',
};

const getColor = (cat: string) => CATEGORY_COLORS[cat] ?? '#64748b';

interface Props {
  allocation: AssetAllocation;
}

export default function AssetAllocationChart({ allocation }: Props) {
  const { currency } = useAppStore();
  const { breakdown, total_portfolio_value, needs_rebalance, total_drift_pct, risk_profile } = allocation;

  const validItems = breakdown.filter(b => b.current_pct > 0);
  let cumulativePct = 0;
  const CIRCUMFERENCE = 2 * Math.PI * 40;

  const slices = validItems.map(item => {
    const offset = cumulativePct;
    cumulativePct += item.current_pct;
    return {
      ...item,
      dashArray: `${(item.current_pct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashOffset: -((offset / 100) * CIRCUMFERENCE),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Risk Profile: {risk_profile}
        </span>
        {needs_rebalance && (
          <div style={{
            background: 'rgba(244, 162, 97, 0.15)', border: '1px solid #f4a261',
            borderRadius: '6px', padding: '0.3rem 0.7rem',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#f4a261', fontWeight: 600 }}>
              ⚠ Drift: {total_drift_pct}% — Rebalancing Needed
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
            {slices.map((slice) => (
              <circle
                key={slice.category}
                cx="50" cy="50" r="40"
                fill="none"
                stroke={getColor(slice.category)}
                strokeWidth="18"
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            ))}
            <text x="50" y="47" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">
              {formatCurrency(total_portfolio_value, currency).replace(/(\.00|,\d{3})+/, 'k').replace(/000$/, '')}
            </text>
            <text x="50" y="58" textAnchor="middle" fill="#94a3b8" fontSize="6">Portfolio</text>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {validItems.map(item => (
            <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: getColor(item.category), flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>{item.category}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.current_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', gap: '0.25rem',
          fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase',
          letterSpacing: '0.04em', padding: '0 0.5rem',
        }}>
          <span>Asset Class</span><span style={{ textAlign: 'right' }}>Now</span>
          <span style={{ textAlign: 'right' }}>Target</span><span style={{ textAlign: 'right' }}>Drift</span>
        </div>
        {breakdown.map(item => (
          <div key={item.category} style={{
            display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', gap: '0.25rem',
            background: item.needs_rebalance ? 'rgba(244, 162, 97, 0.08)' : 'rgba(0,0,0,0.15)',
            borderRadius: '6px', padding: '0.4rem 0.5rem', alignItems: 'center',
            border: item.needs_rebalance ? '1px solid rgba(244,162,97,0.3)' : '1px solid transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: getColor(item.category), flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem' }}>{item.category}</span>
              {item.needs_rebalance && <span style={{ fontSize: '0.6rem', color: '#f4a261' }}>⚠</span>}
            </div>
            <span style={{ fontSize: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{item.current_pct}%</span>
            <span style={{ fontSize: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.target_pct}%</span>
            <span style={{
              fontSize: '0.7rem', textAlign: 'right',
              color: item.needs_rebalance ? '#f4a261' : 'var(--text-secondary)',
              fontWeight: item.needs_rebalance ? 600 : 400,
            }}>
              {item.drift_pct > 0 ? `${item.drift_pct}%` : '—'}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.7 }}>{allocation.disclaimer}</p>
    </div>
  );
}
