"use client";
import { Wallet, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, PieChart } from "lucide-react";
import { Card, CardHeader, AnimatedNumber } from "@/components/ui";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import DonutChart from "@/components/charts/DonutChart";
import { formatCompact } from "@/utils/format";

const ALLOC_LABELS = { equity: "Equity", fixedIncome: "Fixed Income", cash: "Cash", alternatives: "Alternatives", realEstate: "Real Estate" };

export default function FinancialSnapshot({ client }) {
  const metrics = [
    { label: "Net Worth", value: client.netWorth, icon: Wallet, tone: "primary" },
    { label: "Total Assets", value: client.assets, icon: TrendingUp, tone: "success" },
    { label: "Liabilities", value: client.liabilities, icon: TrendingDown, tone: "danger" },
    { label: "Annual Income", value: client.income, icon: ArrowUpCircle, tone: "info" },
    { label: "Annual Expenses", value: client.expenses, icon: ArrowDownCircle, tone: "warning" },
  ];
  const toneColor = { primary: "var(--primary)", success: "var(--success)", danger: "var(--danger)", info: "var(--info)", warning: "var(--warning)" };
  const toneBg = { primary: "var(--primary-dim)", success: "var(--accent-dim)", danger: "var(--danger-dim)", info: "rgba(56,189,248,0.14)", warning: "rgba(245,158,11,0.14)" };

  const allocationData = Object.entries(client.allocation || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: ALLOC_LABELS[k] || k, value: v }));

  return (
    <div className="space-y-5">
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <StaggerItem key={m.label}>
            <div className="rounded-2xl p-4 h-full" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="flex items-center justify-center w-9 h-9 rounded-xl mb-3" style={{ background: toneBg[m.tone], color: toneColor[m.tone] }}>
                <m.icon size={17} />
              </span>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                <AnimatedNumber value={m.value} format={(n) => formatCompact(n)} />
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{m.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <Card>
        <CardHeader title="Investment Allocation" subtitle="Current portfolio mix" icon={PieChart} />
        {allocationData.length ? (
          <DonutChart data={allocationData} unit="%" valueFormatter={(v) => `${v}%`} />
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No allocation data.</p>
        )}
      </Card>
    </div>
  );
}
