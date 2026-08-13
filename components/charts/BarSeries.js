"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_COLORS, AXIS_PROPS, GRID_PROPS, ChartTooltip } from "./chartTheme";
import { formatCompact } from "@/utils/format";

export default function BarSeries({ data = [], dataKey, xKey = "name", height = 260, color = CHART_COLORS[0], multicolor = false, valueFormatter }) {
  const tickFormatter = valueFormatter ? (v) => {
    const formatted = valueFormatter(v);
    if (typeof formatted === "string" && formatted.includes("₹")) {
      return formatCompact(v);
    }
    return formatted;
  } : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} allowDecimals={false} tickFormatter={tickFormatter} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip valueFormatter={valueFormatter} />} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} animationDuration={900} maxBarSize={46}>
          {data.map((_, i) => (
            <Cell key={i} fill={multicolor ? CHART_COLORS[i % CHART_COLORS.length] : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
