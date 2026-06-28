"use client";

const TONES = {
  neutral: { bg: "var(--surface-hover)", color: "var(--muted-strong)" },
  primary: { bg: "var(--primary-dim)", color: "var(--primary)" },
  success: { bg: "var(--accent-dim)", color: "var(--success)" },
  warning: { bg: "rgba(245,158,11,0.14)", color: "var(--warning)" },
  danger: { bg: "var(--danger-dim)", color: "var(--danger)" },
  info: { bg: "rgba(56,189,248,0.14)", color: "var(--info)" },
};

export default function Badge({ children, tone = "neutral", icon: Icon, className = "" }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
      style={{ background: t.bg, color: t.color }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
