"use client";

export default function ProgressBar({ value = 0, size = "md", showLabel = false, color = "var(--primary)" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? 6 : size === "lg" ? 12 : 8;

  return (
    <div className="w-full">
      <div className="rounded-full overflow-hidden w-full" style={{ height, background: "var(--surface-hover)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--muted)" }}>
          {clamped}% complete
        </p>
      )}
    </div>
  );
}
