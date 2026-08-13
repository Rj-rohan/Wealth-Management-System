"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui";
import { ArrowLeftRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import AreaTrend from "@/components/charts/AreaTrend";
import LineMulti from "@/components/charts/LineMulti";
import { formatCurrency } from "@/utils/format";

export default function CashFlowAnalysis({ data, compact = false }) {
  if (!data) return null;

  const { income, expenses, monthlySurplus, savingsRate, cashFlowHistory } = data;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatsCard label="Monthly Income" value={formatCurrency(income.total)} icon={TrendingUp} tone="success" />
          <StatsCard label="Monthly Expenses" value={formatCurrency(expenses.total)} icon={TrendingDown} tone="warning" />
          <StatsCard label="Monthly Surplus" value={formatCurrency(monthlySurplus)} icon={Wallet} tone={monthlySurplus >= 0 ? "success" : "danger"} />
          <StatsCard label="Savings Rate" value={`${(savingsRate * 100).toFixed(0)}%`} icon={ArrowLeftRight} tone="info" />
        </div>
      )}

      <Card>
        <CardHeader title={compact ? "Cash Flow Trend" : "Monthly Cash Flow"} subtitle="Income vs Expenses" icon={ArrowLeftRight} />
        <LineMulti
          data={cashFlowHistory}
          xKey="month"
          height={compact ? 200 : 300}
          lines={[
            { dataKey: "income", name: "Income", color: "#10B981" },
            { dataKey: "expenses", name: "Expenses", color: "#EF4444" },
            { dataKey: "savings", name: "Savings", color: "#6366F1", dashed: true },
          ]}
          valueFormatter={(v) => formatCurrency(v)}
        />
      </Card>
    </div>
  );
}
