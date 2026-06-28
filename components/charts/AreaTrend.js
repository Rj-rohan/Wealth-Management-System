"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, AXIS_PROPS, GRID_PROPS, ChartTooltip } from "./chartTheme";

export default function AreaTrend({ data = [], dataKey, xKey = "name", height = 260, color = CHART_COLORS[0], valueFormatter }) {
  const gradientId = `grad-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} allowDecimals={false} />
        <Tooltip cursor={{ stroke: "rgba(255,255,255,0.15)" }} content={<ChartTooltip valueFormatter={valueFormatter} />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} animationDuration={1000} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
