"use client";
import { useState } from "react";
import { Skeleton, Badge } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import Card, { CardHeader } from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import GaugeChart from "@/components/charts/GaugeChart";
import DonutChart from "@/components/charts/DonutChart";
import RadarChart from "@/components/charts/RadarChart";
import { useRiskAssessment } from "../hooks/useRiskAssessment";
import { Shield, Activity, Target, Clock, Wallet, TrendingUp } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

const LEVEL_TONE = {
  conservative: "success", moderately_conservative: "success",
  balanced: "info", moderately_aggressive: "warning", aggressive: "danger",
};
const LEVEL_LABEL = {
  conservative: "Conservative", moderately_conservative: "Moderately Conservative",
  balanced: "Balanced", moderately_aggressive: "Moderately Aggressive", aggressive: "Aggressive",
};
const CAP_LABEL = { low: "Low", medium: "Medium", high: "High" };
const EXP_LABEL = { none: "None", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" };
const STAB_LABEL = { unstable: "Unstable", somewhat_stable: "Somewhat Stable", stable: "Stable", very_stable: "Very Stable" };
const HOR_LABEL = { short: "Short (<3yr)", medium: "Medium (3-7yr)", long: "Long (7-15yr)", very_long: "Very Long (15+yr)" };

export default function RiskAssessmentWorkspace() {
  const [clientId, setClientId] = useState("");
  const { profile, loading } = useRiskAssessment(clientId);

  const radarData = profile ? [
    { name: "Experience", value: { none: 10, beginner: 30, intermediate: 55, advanced: 75, expert: 95 }[profile.investmentExperience] || 50 },
    { name: "Capacity", value: { low: 25, medium: 55, high: 85 }[profile.riskCapacity] || 50 },
    { name: "Tolerance", value: { low: 25, medium: 55, high: 85 }[profile.riskTolerance] || 50 },
    { name: "Stability", value: { unstable: 15, somewhat_stable: 40, stable: 65, very_stable: 90 }[profile.financialStability] || 50 },
    { name: "Horizon", value: { short: 25, medium: 50, long: 75, very_long: 95 }[profile.investmentHorizon] || 50 },
  ] : [];

  const allocData = profile?.recommendedAllocation ? Object.entries(profile.recommendedAllocation).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    value,
  })) : [];

  return (
    <div className="space-y-5">
      <ClientSelector value={clientId} onChange={setClientId} />

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Shield size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to view their risk assessment</p>
        </div>
      )}

      {clientId && loading && <Skeleton height={500} rounded={16} />}

      {clientId && !loading && profile && (
        <StaggerGroup className="space-y-5">
          {/* Score + Level */}
          <StaggerItem>
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
                <GaugeChart value={profile.riskScore} max={100} label="Risk Score" size={220} />
                <div className="flex-1 text-center sm:text-left">
                  <Badge tone={LEVEL_TONE[profile.riskLevel]} className="text-sm px-3 py-1">
                    {LEVEL_LABEL[profile.riskLevel] || profile.riskLevel}
                  </Badge>
                  <p className="text-sm mt-3" style={{ color: "var(--muted-strong)" }}>
                    Based on a comprehensive assessment of investment experience, risk capacity, risk tolerance, financial stability, and investment horizon.
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Risk Factors */}
              <Card>
                <CardHeader title="Risk Profile Factors" icon={Activity} />
                <RadarChart data={radarData} height={260} />
                <div className="mt-4">
                  <MetricRow label="Investment Experience" value={EXP_LABEL[profile.investmentExperience] || profile.investmentExperience} icon={TrendingUp} />
                  <MetricRow label="Risk Capacity" value={CAP_LABEL[profile.riskCapacity] || profile.riskCapacity} icon={Wallet} />
                  <MetricRow label="Risk Tolerance" value={CAP_LABEL[profile.riskTolerance] || profile.riskTolerance} icon={Shield} />
                  <MetricRow label="Financial Stability" value={STAB_LABEL[profile.financialStability] || profile.financialStability} icon={Activity} />
                  <MetricRow label="Investment Horizon" value={HOR_LABEL[profile.investmentHorizon] || profile.investmentHorizon} icon={Clock} />
                </div>
              </Card>

              {/* Recommended Allocation */}
              <Card>
                <CardHeader title="Recommended Allocation" icon={Target} />
                <DonutChart data={allocData} height={240} valueFormatter={(v) => `${v}%`} unit="%" />
              </Card>
            </div>
          </StaggerItem>

          {/* Suitable Categories */}
          <StaggerItem>
            <Card>
              <CardHeader title="Suitable Investment Categories" icon={Shield} />
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.suitableCategories?.map((cat) => (
                  <Badge key={cat} tone="primary">{cat}</Badge>
                ))}
              </div>
            </Card>
          </StaggerItem>
        </StaggerGroup>
      )}
    </div>
  );
}
