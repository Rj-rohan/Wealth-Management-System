import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NetWorthHistory } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';

interface NetWorthChartProps {
  data: NetWorthHistory[];
}

const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
  const { currency } = useAppStore();
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="var(--text-secondary)" 
            tickFormatter={(str) => {
              const date = new Date(str);
              return `${date.toLocaleString('default', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;
            }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tickFormatter={(val) => {
              const formatted = formatCurrency(val, currency);
              return formatted.replace(/(\.00|,\d{3})+/, 'k').replace(/000$/, ''); // rough approximation for k
            }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            formatter={(value: number) => [formatCurrency(value, currency), 'Net Worth']}
          />
          <Area 
            type="monotone" 
            dataKey="net_worth" 
            stroke="var(--accent-teal)" 
            fillOpacity={1} 
            fill="url(#colorNetWorth)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetWorthChart;
