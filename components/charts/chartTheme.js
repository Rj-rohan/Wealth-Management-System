// Shared palette + tooltip styling for all Recharts visualisations.
export const CHART_COLORS = ["#6366F1", "#10B981", "#38BDF8", "#F59E0B", "#A855F7", "#EF4444", "#14B8A6"];

export const AXIS_PROPS = {
  stroke: "rgba(255,255,255,0.25)",
  tick: { fill: "#8A94A6", fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

export const GRID_PROPS = {
  stroke: "rgba(255,255,255,0.06)",
  strokeDasharray: "3 3",
  vertical: false,
};

export function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}
    >
      {label != null && (
        <p className="text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="text-xs flex items-center gap-1.5" style={{ color: "var(--muted-strong)" }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{valueFormatter ? valueFormatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}
