"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_COLORS, AXIS_PROPS, GRID_PROPS, ChartTooltip } from "./chartTheme";
import { formatCompact } from "@/utils/format";

export default function LineMulti({ data = [], lines = [], height = 260, xKey = "name", valueFormatter }) {
  const tickFormatter = valueFormatter ? (v) => {
    const formatted = valueFormatter(v);
    if (typeof formatted === "string" && formatted.includes("₹")) {
      return formatCompact(v);
    }
    return formatted;
  } : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} tickFormatter={tickFormatter} />
        <Tooltip cursor={{ stroke: "rgba(255,255,255,0.15)" }} content={<ChartTooltip valueFormatter={valueFormatter} />} />
        {lines.map((line, i) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            strokeDasharray={line.dashed ? "6 4" : undefined}
            animationDuration={1000}
          />
        ))}
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#8A94A6", fontSize: 12 }}>{v}</span>} />
      </LineChart>
    </ResponsiveContainer>
  );
}
