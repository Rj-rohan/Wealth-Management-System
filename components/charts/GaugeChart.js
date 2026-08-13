"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chartTheme";

// Semicircle gauge that shows a score value (0–max). Color follows the chart palette.
export default function GaugeChart({ value = 0, max = 100, label = "", size = 200, color }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const fill = color || (pct >= 0.7 ? "#10B981" : pct >= 0.4 ? "#F59E0B" : "#EF4444");
  const data = [
    { name: "filled", value: pct },
    { name: "empty", value: 1 - pct },
  ];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size} height={size / 2 + 20}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={180}
            endAngle={0}
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={0}
            stroke="none"
            animationDuration={900}
          >
            <Cell fill={fill} />
            <Cell fill="rgba(255,255,255,0.06)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-6">
        <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{Math.round(value)}<span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/{max}</span></p>
        {label && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>}
      </div>
    </div>
  );
}
