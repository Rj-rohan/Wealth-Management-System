"use client";
import { ChevronDown } from "lucide-react";

export default function Select({
  label,
  error,
  options = [],
  placeholder = "Select…",
  required = false,
  className = "",
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-strong)" }}>
          {label}
          {required && <span style={{ color: "var(--danger)" }}> *</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className="w-full text-sm rounded-xl outline-none transition-all duration-150 pl-3.5 pr-9 py-2.5 appearance-none cursor-pointer"
          style={{
            background: "var(--surface-raised)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            color: "var(--foreground)",
          }}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const labelText = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={value} value={value} style={{ background: "#1c222a" }}>
                {labelText}
              </option>
            );
          })}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>
          <ChevronDown size={16} />
        </span>
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
