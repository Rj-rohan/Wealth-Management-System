"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge, ProgressBar } from "@/components/ui";
import MetricRow from "@/components/ui/MetricRow";
import DonutChart from "@/components/charts/DonutChart";
import { FileText, Target, BarChart3, Shield, CheckSquare, StickyNote, Clock, ArrowLeft } from "lucide-react";
import { formatDate } from "@/utils/format";
import Link from "next/link";

const STATUS_TONE = { pending: "warning", completed: "success", in_progress: "info" };

export default function PlanDetail({ plan }) {
  if (!plan) return null;

  const allocationData = plan.assetAllocation
    ? Object.entries(plan.assetAllocation).map(([key, value]) => ({
        name: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        value,
      }))
    : [];

  const completedActions = plan.actionItems?.filter((a) => a.status === "completed").length || 0;
  const totalActions = plan.actionItems?.length || 0;

  return (
    <div className="space-y-5">
      <Link href="/financial-plans" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={15} /> Back to plans
      </Link>

      {/* Header */}
      <div className="rounded-2xl p-6" style={{ background: "radial-gradient(600px circle at 100% 0%, rgba(99,102,241,0.12), transparent 50%), var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
            <FileText size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{plan.title}</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-strong)" }}>{plan.clientName} • Version {plan.version}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge tone={plan.status === "active" ? "success" : plan.status === "draft" ? "neutral" : "warning"}>{plan.status.replace(/_/g, " ")}</Badge>
              <span className="text-xs" style={{ color: "var(--muted)" }}>Last updated {formatDate(plan.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader title="Executive Summary" icon={FileText} />
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-strong)" }}>{plan.executiveSummary}</p>
      </Card>

      {/* Objectives */}
      <Card>
        <CardHeader title="Client Objectives" icon={Target} />
        <ul className="space-y-2">
          {plan.objectives?.map((obj, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--muted-strong)" }}>
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mt-0.5 flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>{i + 1}</span>
              {obj}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Asset Allocation */}
        <Card>
          <CardHeader title="Recommended Asset Allocation" icon={BarChart3} />
          <DonutChart data={allocationData} height={220} valueFormatter={(v) => `${v}%`} unit="%" />
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader title="Risk Assessment" icon={Shield} />
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-strong)" }}>{plan.riskAssessment}</p>
          <div className="mt-4">
            <p className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Strategy</p>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{plan.recommendedStrategy}</p>
          </div>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader title="Action Items" subtitle={`${completedActions}/${totalActions} completed`} icon={CheckSquare} />
        <ProgressBar value={totalActions > 0 ? (completedActions / totalActions) * 100 : 0} size="sm" showLabel />
        <div className="mt-4 space-y-1">
          {plan.actionItems?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.status === "completed" ? "var(--success)" : item.status === "in_progress" ? "var(--info)" : "var(--muted)" }} />
                <span className="text-sm truncate" style={{ color: "var(--foreground)" }}>{item.task}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Badge tone={STATUS_TONE[item.status]}>{item.status.replace(/_/g, " ")}</Badge>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(item.dueDate)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Advisor Notes */}
      <Card>
        <CardHeader title="Advisor Notes" icon={StickyNote} />
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-strong)" }}>{plan.advisorNotes}</p>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader title="Version History" icon={Clock} />
        <div className="space-y-1">
          {plan.versionHistory?.map((v, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>v{v.version}</span>
                <span className="text-sm" style={{ color: "var(--muted-strong)" }}>{v.changes}</span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(v.date)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
