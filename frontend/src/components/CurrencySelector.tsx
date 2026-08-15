import React from 'react';
import { useAppStore } from '../store/useAppStore';

const CURRENCIES = [
  { code: 'INR', label: 'INR (₹)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'JPY', label: 'JPY (¥)' },
  { code: 'AUD', label: 'AUD ($)' },
  { code: 'CAD', label: 'CAD ($)' },
];

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useAppStore();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: '1px solid var(--border-color, #ccc)',
        background: 'var(--bg-card, #fff)',
        color: 'var(--text-primary, #000)',
        cursor: 'pointer',
        fontSize: '0.875rem'
      }}
    >
      {CURRENCIES.map(c => (
        <option key={c.code} value={c.code}>{c.label}</option>
      ))}
    </select>
  );
};
