"use client";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({ label, value, icon: Icon, tone = "primary", trend, trendDirection = "up", footnote }) {
  const tones = {
    primary: { bg: "var(--primary-dim)", color: "var(--primary)" },
    success: { bg: "var(--accent-dim)", color: "var(--success)" },
    warning: { bg: "rgba(245,158,11,0.14)", color: "var(--warning)" },
    info: { bg: "rgba(56,189,248,0.14)", color: "var(--info)" },
    danger: { bg: "var(--danger-dim)", color: "var(--danger)" },
  };
  const t = tones[tone] || tones.primary;
  const TrendIcon = trendDirection === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div className="flex items-start justify-between">
        {Icon && (
          <span className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: t.bg, color: t.color }}>
            <Icon size={18} />
          </span>
        )}
        {trend != null && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md"
            style={{
              color: trendDirection === "down" ? "var(--danger)" : "var(--success)",
              background: trendDirection === "down" ? "var(--danger-dim)" : "var(--accent-dim)",
            }}
          >
            <TrendIcon size={12} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      {footnote && (
        <p className="text-xs mt-2 pt-2" style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
          {footnote}
        </p>
      )}
    </div>
  );
}
