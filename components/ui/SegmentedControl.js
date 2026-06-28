"use client";
import { motion } from "framer-motion";

// Animated segmented control with a sliding active indicator.
export default function SegmentedControl({ options = [], value, onChange, size = "md" }) {
  const pad = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  return (
    <div className="inline-flex rounded-xl p-1" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const Icon = typeof opt === "object" ? opt.icon : null;
        const active = val === value;
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors ${pad}`}
            style={{ color: active ? "var(--foreground)" : "var(--muted)" }}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => (typeof o === "string" ? o : o.value)).join("-")}`}
                className="absolute inset-0 rounded-lg"
                style={{ background: "var(--surface-hover)", border: "1px solid var(--border-strong)" }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {Icon && <Icon size={14} className="relative" />}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
