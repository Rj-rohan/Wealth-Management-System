"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui";
import { TrendingUp, Landmark, ArrowDownRight, ArrowUpRight } from "lucide-react";
import AreaTrend from "@/components/charts/AreaTrend";
import StackedBar from "@/components/charts/StackedBar";
import { formatCurrency } from "@/utils/format";

export default function NetWorthAnalysis({ data, compact = false }) {
  if (!data) return null;

  const { totalAssets, totalLiabilities, netWorth, netWorthTimeline } = data;
  const first = netWorthTimeline?.[0]?.netWorth || 0;
  const last = netWorthTimeline?.[netWorthTimeline.length - 1]?.netWorth || 0;
  const growth = first > 0 ? (((last - first) / first) * 100).toFixed(1) : 0;
  const growthDir = last >= first ? "up" : "down";

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard label="Total Assets" value={formatCurrency(totalAssets)} icon={Landmark} tone="success" trend={`${growth}%`} trendDirection={growthDir} />
          <StatsCard label="Total Liabilities" value={formatCurrency(totalLiabilities)} icon={ArrowDownRight} tone="danger" />
          <StatsCard label="Net Worth" value={formatCurrency(netWorth)} icon={TrendingUp} tone="primary" trend={`${growth}%`} trendDirection={growthDir} />
        </div>
      )}

      <Card>
        <CardHeader title={compact ? "Net Worth Trend" : "Net Worth Timeline"} subtitle="24-month history" icon={TrendingUp} />
        <AreaTrend data={netWorthTimeline} dataKey="netWorth" xKey="month" height={compact ? 200 : 300} valueFormatter={(v) => formatCurrency(v)} />
      </Card>

      {!compact && (
        <Card>
          <CardHeader title="Assets vs Liabilities" subtitle="Monthly comparison" icon={Landmark} />
          <StackedBar data={netWorthTimeline.filter((_, i) => i % 2 === 0)} keys={["assets", "liabilities"]} xKey="month" height={280} colors={["#10B981", "#EF4444"]} valueFormatter={(v) => formatCurrency(v)} />
        </Card>
      )}
    </div>
  );
}
