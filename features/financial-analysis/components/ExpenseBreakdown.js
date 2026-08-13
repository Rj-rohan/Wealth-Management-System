"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import DonutChart from "@/components/charts/DonutChart";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function ExpenseBreakdown({ data, compact = false }) {
  if (!data?.expenses) return null;

  const { housing, transportation, food, insurance, entertainment, education, healthcare, miscellaneous, total } = data.expenses;

  const chartData = [
    { name: "Housing", value: housing },
    { name: "Transport", value: transportation },
    { name: "Food", value: food },
    { name: "Insurance", value: insurance },
    { name: "Entertainment", value: entertainment },
    { name: "Education", value: education },
    { name: "Healthcare", value: healthcare },
    { name: "Misc", value: miscellaneous },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader title="Expense Breakdown" subtitle={`Total: ${formatCurrency(total)}/mo`} icon={Receipt} />
      <DonutChart data={chartData} height={compact ? 180 : 240} valueFormatter={(v) => formatCurrency(v)} />
      {!compact && (
        <div className="mt-4">
          <MetricRow label="Housing" value={formatCurrency(housing)} />
          <MetricRow label="Transportation" value={formatCurrency(transportation)} />
          <MetricRow label="Food" value={formatCurrency(food)} />
          <MetricRow label="Insurance" value={formatCurrency(insurance)} />
          <MetricRow label="Entertainment" value={formatCurrency(entertainment)} />
          <MetricRow label="Education" value={formatCurrency(education)} />
          <MetricRow label="Healthcare" value={formatCurrency(healthcare)} />
          <MetricRow label="Miscellaneous" value={formatCurrency(miscellaneous)} />
        </div>
      )}
    </Card>
  );
}
