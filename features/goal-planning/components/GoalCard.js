"use client";
import { ScoreRing, Badge, ProgressBar } from "@/components/ui";
import { Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";

const STATUS_TONE = { on_track: "success", completed: "success", at_risk: "warning", behind: "danger", not_started: "neutral" };
const PRIORITY_TONE = { high: "danger", medium: "warning", low: "info" };
const TYPE_EMOJI = { retirement: "🏖️", house: "🏠", car: "🚗", education: "🎓", marriage: "💍", vacation: "✈️", emergency_fund: "🛡️", wealth_creation: "💰" };

export default function GoalCard({ goal, onClick }) {
  return (
    <button
      onClick={() => onClick?.(goal)}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
    >
      <div className="flex items-start gap-4">
        <ScoreRing value={goal.progress} max={100} size={56} strokeWidth={5} showValue />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{TYPE_EMOJI[goal.type] || "🎯"}</span>
            <h4 className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{goal.label}</h4>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge tone={STATUS_TONE[goal.status]}>{goal.status.replace(/_/g, " ")}</Badge>
            <Badge tone={PRIORITY_TONE[goal.priority]}>{goal.priority}</Badge>
          </div>
          <div className="mt-3">
            <ProgressBar value={goal.progress} size="sm" color={goal.progress > 75 ? "var(--success)" : goal.progress > 40 ? "var(--primary)" : "var(--warning)"} />
          </div>
          <div className="flex items-center justify-between mt-3 text-xs" style={{ color: "var(--muted)" }}>
            <span>{formatCurrency(goal.currentSavings)} / {formatCurrency(goal.targetAmount)}</span>
            <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(goal.targetDate)}</span>
          </div>
          {goal.monthlyContribution > 0 && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--muted-strong)" }}>
              <TrendingUp size={11} /> {formatCurrency(goal.monthlyContribution)}/mo needed
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
