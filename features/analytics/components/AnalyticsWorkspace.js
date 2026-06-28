"use client";
import { useState, useEffect } from "react";
import { Users, UserCheck, Wallet, TrendingUp } from "lucide-react";
import { Card, CardHeader, AnimatedNumber, Skeleton } from "@/components/ui";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import Reveal from "@/components/motion/Reveal";
import AreaTrend from "@/components/charts/AreaTrend";
import BarSeries from "@/components/charts/BarSeries";
import DonutChart from "@/components/charts/DonutChart";
import { analyticsService } from "@/services/analytics.service";
import { formatCompact } from "@/utils/format";

export default function AnalyticsWorkspace() {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsService.overview().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={92} rounded={16} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={300} rounded={16} />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Total Clients", value: data.kpis.totalClients, icon: Users, tone: "primary" },
    { label: "Active Clients", value: data.kpis.activeClients, icon: UserCheck, tone: "success" },
    { label: "Assets Under Mgmt", value: data.kpis.totalAUM, icon: Wallet, tone: "warning", currency: true },
    { label: "Avg Net Worth", value: data.kpis.avgNetWorth, icon: TrendingUp, tone: "info", currency: true },
  ];
  const toneColor = { primary: "var(--primary)", success: "var(--success)", info: "var(--info)", warning: "var(--warning)" };
  const toneBg = { primary: "var(--primary-dim)", success: "var(--accent-dim)", info: "rgba(56,189,248,0.14)", warning: "rgba(245,158,11,0.14)" };

  return (
    <div className="space-y-5">
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <StaggerItem key={k.label}>
            <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="flex items-center justify-center w-9 h-9 rounded-xl mb-3" style={{ background: toneBg[k.tone], color: toneColor[k.tone] }}>
                <k.icon size={18} />
              </span>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                <AnimatedNumber value={k.value} format={k.currency ? (n) => formatCompact(n) : undefined} />
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{k.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Reveal>
          <Card>
            <CardHeader title="Client Growth" subtitle="Cumulative clients over time" />
            <AreaTrend data={data.clientGrowth} dataKey="clients" color="#6366F1" />
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHeader title="Meeting Frequency" subtitle="Meetings per month" />
            <BarSeries data={data.meetingFrequency} dataKey="meetings" color="#10B981" />
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader title="Risk Distribution" subtitle="Clients by risk profile" />
            <DonutChart data={data.riskDistribution} />
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHeader title="Client Status Breakdown" subtitle="Pipeline by status" />
            <BarSeries data={data.statusBreakdown} dataKey="value" xKey="name" multicolor />
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader title="Client Age Distribution" subtitle="Clients by age band" />
            <BarSeries data={data.ageDistribution} dataKey="clients" color="#38BDF8" />
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHeader title="Portfolio Allocation" subtitle="Average mix across active clients" />
            <DonutChart data={data.portfolioAllocation} unit="%" valueFormatter={(v) => `${v}%`} />
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
