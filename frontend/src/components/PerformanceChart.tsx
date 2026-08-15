/**
 * PerformanceChart — SVG line chart comparing portfolio vs benchmark returns.
 * Displays TWR, Sharpe Ratio, Beta, Alpha, and volatility metrics.
 */
import { PortfolioPerformance } from '../types';

interface Props {
  performance: PortfolioPerformance;
}

export default function PerformanceChart({ performance }: Props) {
  const {
    monthly_chart, twr_pct, outperformance_pct,
    sharpe_ratio, beta, alpha_pct, volatility_pct, period,
  } = performance;

  if (!monthly_chart || monthly_chart.length === 0) return null;

  // Normalize values for SVG plotting
  const allValues = monthly_chart.flatMap(d => [d.portfolio_value, d.benchmark_value]);
  const minVal = Math.min(...allValues) * 0.995;
  const maxVal = Math.max(...allValues) * 1.005;
  const range = maxVal - minVal;
  const W = 400, H = 120, PAD = { top: 10, right: 10, bottom: 20, left: 10 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xStep = plotW / (monthly_chart.length - 1);
  const toY = (v: number) => PAD.top + plotH - ((v - minVal) / range) * plotH;
  const toX = (i: number) => PAD.left + i * xStep;

  const portfolioPath = monthly_chart.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.portfolio_value)}`).join(' ');
  const benchmarkPath = monthly_chart.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.benchmark_value)}`).join(' ');
  const fillPath = `${portfolioPath} L${toX(monthly_chart.length - 1)},${PAD.top + plotH} L${toX(0)},${PAD.top + plotH} Z`;

  const isOutperforming = outperformance_pct >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
        {[
          { label: 'TWR (YTD)', value: `${twr_pct > 0 ? '+' : ''}${twr_pct}%`, color: twr_pct >= 0 ? 'var(--status-healthy)' : '#e63946' },
          { label: 'vs Benchmark', value: `${outperformance_pct > 0 ? '+' : ''}${outperformance_pct}%`, color: isOutperforming ? 'var(--status-healthy)' : '#e63946' },
          { label: 'Sharpe Ratio', value: sharpe_ratio.toFixed(2), color: sharpe_ratio >= 1 ? 'var(--status-healthy)' : sharpe_ratio >= 0.5 ? 'var(--status-caution)' : '#e63946' },
          { label: 'Beta', value: beta.toFixed(2), color: 'var(--text-primary)' },
          { label: 'Volatility', value: `${volatility_pct}%`, color: volatility_pct < 10 ? 'var(--status-healthy)' : 'var(--status-caution)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.6rem 0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alpha badge */}
      {Math.abs(alpha_pct) > 0.01 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Alpha:</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700,
            color: alpha_pct >= 0 ? 'var(--status-healthy)' : '#e63946',
            background: alpha_pct >= 0 ? 'rgba(46, 196, 182, 0.15)' : 'rgba(230, 57, 70, 0.12)',
            padding: '0.15rem 0.5rem', borderRadius: '4px',
          }}>
            {alpha_pct >= 0 ? '+' : ''}{alpha_pct}% — {alpha_pct >= 0 ? 'Outperforming risk-adjusted benchmark' : 'Underperforming risk-adjusted benchmark'}
          </span>
        </div>
      )}

      {/* SVG Line Chart */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.5rem', overflow: 'hidden' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Fill area */}
          <path d={fillPath} fill="url(#portfolioFill)" />
          {/* Benchmark line */}
          <path d={benchmarkPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
          {/* Portfolio line */}
          <path d={portfolioPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Month labels */}
          {monthly_chart.filter((_, i) => i % 2 === 0).map((d, i) => (
            <text key={d.month} x={toX(i * 2)} y={H - 4} textAnchor="middle" fill="#64748b" fontSize="7">
              {d.month}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '16px', height: '2px', background: '#6366f1' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Your Portfolio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '16px', height: '2px', background: '#94a3b8', borderTop: '1px dashed #94a3b8' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Benchmark</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{period}</span>
      </div>

      <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.7 }}>{performance.disclaimer}</p>
    </div>
  );
}
