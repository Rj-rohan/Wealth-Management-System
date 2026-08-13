"use client";

// Circular progress ring for scores and goal completion.
export default function ScoreRing({ value = 0, max = 100, size = 80, strokeWidth = 6, color, label, showValue = true }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const fill = color || (pct >= 0.7 ? "var(--success)" : pct >= 0.4 ? "var(--warning)" : "var(--danger)");
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={fill} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        {showValue && (
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {Math.round(value)}
          </span>
        )}
      </div>
      {label && <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>}
    </div>
  );
}
