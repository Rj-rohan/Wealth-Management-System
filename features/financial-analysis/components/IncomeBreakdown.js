"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import DonutChart from "@/components/charts/DonutChart";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function IncomeBreakdown({ data, compact = false }) {
  if (!data?.income) return null;

  const { salary, businessIncome, rentalIncome, investmentIncome, otherIncome, total } = data.income;

  const chartData = [
    { name: "Salary", value: salary },
    { name: "Business", value: businessIncome },
    { name: "Rental", value: rentalIncome },
    { name: "Investment", value: investmentIncome },
    { name: "Other", value: otherIncome },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader title="Income Breakdown" subtitle={`Total: ${formatCurrency(total)}/mo`} icon={DollarSign} />
      <DonutChart data={chartData} height={compact ? 180 : 240} valueFormatter={(v) => formatCurrency(v)} />
      {!compact && (
        <div className="mt-4">
          <MetricRow label="Salary" value={formatCurrency(salary)} tone="success" />
          <MetricRow label="Business Income" value={formatCurrency(businessIncome)} tone={businessIncome > 0 ? "success" : undefined} />
          <MetricRow label="Rental Income" value={formatCurrency(rentalIncome)} tone={rentalIncome > 0 ? "success" : undefined} />
          <MetricRow label="Investment Income" value={formatCurrency(investmentIncome)} tone="info" />
          <MetricRow label="Other Income" value={formatCurrency(otherIncome)} />
        </div>
      )}
    </Card>
  );
}
