"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { StatsCard, ProgressBar } from "@/components/ui";
import MetricRow from "@/components/ui/MetricRow";
import { CreditCard, Home, Car, GraduationCap, Wallet } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function DebtAnalysis({ data }) {
  if (!data?.debts) return null;

  const { homeLoan, personalLoan, vehicleLoan, creditCard, educationLoan, total, debtRatio, totalEmi, emiBurden, debtReductionProgress } = data.debts;

  const debts = [
    { label: "Home Loan", value: homeLoan, icon: Home },
    { label: "Personal Loan", value: personalLoan, icon: Wallet },
    { label: "Vehicle Loan", value: vehicleLoan, icon: Car },
    { label: "Credit Card", value: creditCard, icon: CreditCard },
    { label: "Education Loan", value: educationLoan, icon: GraduationCap },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatsCard label="Total Debt" value={formatCurrency(total)} icon={CreditCard} tone="danger" />
        <StatsCard label="Debt-to-Asset Ratio" value={`${(debtRatio * 100).toFixed(0)}%`} icon={CreditCard} tone={debtRatio < 0.3 ? "success" : debtRatio < 0.5 ? "warning" : "danger"} />
        <StatsCard label="Monthly EMI" value={formatCurrency(totalEmi)} icon={Wallet} tone={emiBurden < 0.3 ? "success" : "warning"} footnote={`EMI burden: ${(emiBurden * 100).toFixed(0)}% of income`} />
      </div>

      <Card>
        <CardHeader title="Debt Breakdown" subtitle={`${debts.length} active debt${debts.length !== 1 ? "s" : ""}`} icon={CreditCard} />
        {debts.map((d) => (
          <MetricRow key={d.label} label={d.label} value={formatCurrency(d.value)} icon={d.icon} />
        ))}
      </Card>

      <Card>
        <CardHeader title="Debt Reduction Progress" icon={CreditCard} />
        <div className="space-y-2">
          <ProgressBar value={debtReductionProgress} showLabel color={debtReductionProgress > 60 ? "var(--success)" : "var(--warning)"} />
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {debtReductionProgress}% of total debt has been paid off
          </p>
        </div>
      </Card>
    </div>
  );
}
