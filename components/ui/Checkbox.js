"use client";
import { Check } from "lucide-react";

export default function Checkbox({ label, checked = false, onChange, className = "" }) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <span
        onClick={() => onChange?.(!checked)}
        className="flex items-center justify-center w-[18px] h-[18px] rounded-md transition-all duration-150"
        style={{
          background: checked ? "var(--primary)" : "var(--surface-raised)",
          border: `1px solid ${checked ? "var(--primary)" : "var(--border-strong)"}`,
        }}
      >
        {checked && <Check size={13} color="#fff" strokeWidth={3} />}
      </span>
      {label && (
        <span className="text-sm" style={{ color: "var(--muted-strong)" }}>
          {label}
        </span>
      )}
    </label>
  );
}
