"use client";
import { Badge } from "@/components/ui";
import { FileText, Clock, MoreVertical, Copy, Archive } from "lucide-react";
import { formatDate } from "@/utils/format";

const STATUS_TONE = { draft: "neutral", active: "success", under_review: "warning", completed: "info", archived: "neutral" };

export default function PlanCard({ plan, onClick, onDuplicate, onArchive }) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 cursor-pointer group"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
      onClick={() => onClick?.(plan)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
            <FileText size={16} />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{plan.title}</h4>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{plan.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(plan); }} title="Duplicate" className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Copy size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onArchive?.(plan); }} title="Archive" className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Archive size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge tone={STATUS_TONE[plan.status]}>{plan.status.replace(/_/g, " ")}</Badge>
        <span className="text-xs" style={{ color: "var(--muted)" }}>v{plan.version}</span>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--muted)" }}>
        <span className="flex items-center gap-1"><Clock size={11} /> Updated {formatDate(plan.updatedAt)}</span>
      </div>
      <p className="text-xs mt-3 line-clamp-2" style={{ color: "var(--muted-strong)" }}>{plan.executiveSummary}</p>
    </div>
  );
}
