"use client";
import { Radar, RadarChart as ReRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, ChartTooltip } from "./chartTheme";
import { formatCompact } from "@/utils/format";

export default function RadarChart({ data = [], dataKey = "value", height = 280, color = CHART_COLORS[0], valueFormatter }) {
  const tickFormatter = valueFormatter ? (v) => {
    const formatted = valueFormatter(v);
    if (typeof formatted === "string" && formatted.includes("₹")) {
      return formatCompact(v);
    }
    return formatted;
  } : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="name" tick={{ fill: "#8A94A6", fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fill: "#8A94A6", fontSize: 10 }} axisLine={false} tickFormatter={tickFormatter} />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        <Radar dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} animationDuration={900} />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
