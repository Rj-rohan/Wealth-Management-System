"use client";

// Styled range slider for scenario planner controls.
export default function RangeSlider({ label, value, min = 0, max = 100, step = 1, onChange, format, unit = "" }) {
  const safeMin = Number.isNaN(min) || min === null || min === undefined ? 0 : Number(min);
  const safeMax = Number.isNaN(max) || max === null || max === undefined ? 100 : Number(max);
  const safeVal = Number.isNaN(value) || value === null || value === undefined ? safeMin : Number(value);
  const denom = safeMax - safeMin;
  const pct = denom !== 0 ? ((safeVal - safeMin) / denom) * 100 : 0;
  const display = format ? format(safeVal) : `${safeVal}${unit}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>{label}</label>
        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={step}
          value={safeVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
            outline: "none",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: "var(--muted)" }}>
        <span>{format ? format(safeMin) : `${safeMin}${unit}`}</span>
        <span>{format ? format(safeMax) : `${safeMax}${unit}`}</span>
      </div>
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          border: 2px solid var(--surface);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          border: 2px solid var(--surface);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
