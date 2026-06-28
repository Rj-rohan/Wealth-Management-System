"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  label,
  error,
  hint,
  type = "text",
  icon: Icon,
  required = false,
  className = "",
  id,
  ...props
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;
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
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          type={inputType}
          className="w-full text-sm rounded-xl outline-none transition-all duration-150 py-2.5"
          style={{
            background: "var(--surface-raised)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            color: "var(--foreground)",
            paddingLeft: Icon ? "2.25rem" : "0.875rem",
            paddingRight: isPassword ? "2.5rem" : "0.875rem",
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = "var(--border)";
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
