"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import GaugeChart from "@/components/charts/GaugeChart";
import { Shield } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function EmergencyFundCard({ data, full = false }) {
  if (!data?.emergencyFund) return null;

  const { current, recommended, coverageMonths } = data.emergencyFund;
  const pct = recommended > 0 ? Math.min(100, (current / recommended) * 100) : 0;
  const color = coverageMonths >= 6 ? "var(--success)" : coverageMonths >= 3 ? "var(--warning)" : "var(--danger)";

  return (
    <Card>
      <CardHeader title="Emergency Fund" subtitle={`${coverageMonths} months coverage`} icon={Shield} />
      <div className={full ? "flex flex-col items-center gap-6 py-4" : ""}>
        <GaugeChart value={pct} max={100} label="Fund adequacy" size={full ? 220 : 170} color={color} />
        <div className={full ? "w-full max-w-md" : "mt-4"}>
          <MetricRow label="Current Fund" value={formatCurrency(current)} tone={coverageMonths >= 6 ? "success" : "warning"} />
          <MetricRow label="Recommended (6 mo)" value={formatCurrency(recommended)} />
          <MetricRow label="Coverage" value={`${coverageMonths} months`} tone={coverageMonths >= 6 ? "success" : coverageMonths >= 3 ? "warning" : "danger"} />
        </div>
      </div>
    </Card>
  );
}
