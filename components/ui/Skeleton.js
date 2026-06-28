"use client";

export default function Skeleton({ width = "100%", height = 16, rounded = 8, className = "" }) {
  return (
    <span
      className={`block ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        background:
          "linear-gradient(90deg, var(--surface-hover) 25%, var(--surface-raised) 37%, var(--surface-hover) 63%)",
        backgroundSize: "800px 100%",
        animation: "wa-shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}
