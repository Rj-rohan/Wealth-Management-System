"use client";

// Dense label-value metric row for financial details and portfolio metrics.
export default function MetricRow({ label, value, sub, tone, icon: Icon, className = "" }) {
  const toneColor = {
    success: "var(--success)",
    danger: "var(--danger)",
    warning: "var(--warning)",
    info: "var(--info)",
    primary: "var(--primary)",
  };

  return (
    <div className={`flex items-center justify-between py-2.5 ${className}`} style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />}
        <span className="text-sm truncate" style={{ color: "var(--muted-strong)" }}>{label}</span>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <span className="text-sm font-semibold" style={{ color: tone ? toneColor[tone] : "var(--foreground)" }}>{value}</span>
        {sub && <p className="text-xs" style={{ color: "var(--muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}
