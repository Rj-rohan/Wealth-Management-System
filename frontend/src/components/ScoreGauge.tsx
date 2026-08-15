import React from 'react';

interface ScoreGaugeProps {
  score: number;
  category: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, category }) => {
  // SVG Arc calculation
  const radius = 60;
  const circumference = Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  let color = 'var(--status-vulnerable)';
  if (score >= 40) color = 'var(--status-caution)';
  if (score >= 65) color = 'var(--status-healthy)';
  if (score >= 85) color = 'var(--status-excellent)';

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', top: '50px', left: '0', width: '100%' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {score}
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color, textTransform: 'uppercase' }}>
          {category}
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;
