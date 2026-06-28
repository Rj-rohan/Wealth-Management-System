"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHART_COLORS, ChartTooltip } from "./chartTheme";

export default function DonutChart({ data = [], height = 240, valueFormatter, showLegend = true, unit = "" }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
          animationDuration={900}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter || ((v) => `${v}${unit}`)} />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: "#8A94A6", fontSize: 12 }}>{value}</span>}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
