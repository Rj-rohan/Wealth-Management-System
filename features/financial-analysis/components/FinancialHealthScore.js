"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui";
import MetricRow from "@/components/ui/MetricRow";
import { Activity } from "lucide-react";

export default function FinancialHealthScore({ data }) {
  if (!data) return null;

  const { healthScore, savingsRate, debts, emergencyFund } = data;
  const factors = [
    { label: "Savings Rate", value: `${(savingsRate * 100).toFixed(0)}%`, tone: savingsRate > 0.25 ? "success" : savingsRate > 0.1 ? "warning" : "danger" },
    { label: "Debt Ratio", value: `${(debts.debtRatio * 100).toFixed(0)}%`, tone: debts.debtRatio < 0.3 ? "success" : debts.debtRatio < 0.5 ? "warning" : "danger" },
    { label: "EMI Burden", value: `${(debts.emiBurden * 100).toFixed(0)}%`, tone: debts.emiBurden < 0.3 ? "success" : debts.emiBurden < 0.5 ? "warning" : "danger" },
    { label: "Emergency Coverage", value: `${emergencyFund.coverageMonths} mo`, tone: emergencyFund.coverageMonths >= 6 ? "success" : emergencyFund.coverageMonths >= 3 ? "warning" : "danger" },
  ];

  return (
    <Card>
      <CardHeader title="Financial Health Score" icon={Activity} />
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing value={healthScore} max={100} size={120} strokeWidth={8} label="Overall Score" />
        <div className="flex-1 w-full">
          {factors.map((f) => (
            <MetricRow key={f.label} label={f.label} value={f.value} tone={f.tone} />
          ))}
        </div>
      </div>
    </Card>
  );
}
