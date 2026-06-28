"use client";
import { Loader2 } from "lucide-react";

export default function Spinner({ size = 20, label, fullscreen = false }) {
  const spinner = (
    <span className="inline-flex items-center gap-2" style={{ color: "var(--muted)" }}>
      <Loader2 size={size} style={{ animation: "wa-spin 0.7s linear infinite" }} />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );

  if (fullscreen) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[60vh]">{spinner}</div>
    );
  }
  return spinner;
}
