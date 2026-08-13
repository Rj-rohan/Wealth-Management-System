"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_COLORS, AXIS_PROPS, GRID_PROPS, ChartTooltip } from "./chartTheme";
import { formatCompact } from "@/utils/format";

export default function StackedBar({ data = [], keys = [], height = 260, xKey = "name", colors, valueFormatter }) {
  const palette = colors || CHART_COLORS;
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
        <YAxis {...AXIS_PROPS} tickFormatter={tickFormatter} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip valueFormatter={valueFormatter} />} />
        {keys.map((key, i) => (
          <Bar key={key} dataKey={key} stackId="a" fill={palette[i % palette.length]} radius={i === keys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} animationDuration={900} maxBarSize={46} />
        ))}
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#8A94A6", fontSize: 12 }}>{v}</span>} />
      </BarChart>
    </ResponsiveContainer>
  );
}
