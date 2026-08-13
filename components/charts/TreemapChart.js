"use client";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, ChartTooltip } from "./chartTheme";

function CustomContent({ x, y, width, height, name, value, index, depth, valueFormatter }) {
  if (width < 30 || height < 24) return null;
  const displayVal = valueFormatter ? valueFormatter(value) : (typeof value === "number" ? value.toLocaleString() : value);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.85} stroke="var(--surface)" strokeWidth={2} />
      {width > 55 && height > 36 && (
        <>
          <text x={x + 8} y={y + 18} fill="#fff" fontSize={11} fontWeight={600}>{name}</text>
          <text x={x + 8} y={y + 32} fill="rgba(255,255,255,0.7)" fontSize={10}>{displayVal}</text>
        </>
      )}
    </g>
  );
}

export default function TreemapChart({ data = [], height = 260, valueFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap data={data} dataKey="value" nameKey="name" content={<CustomContent valueFormatter={valueFormatter} />} animationDuration={900}>
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
      </Treemap>
    </ResponsiveContainer>
  );
}
