"use client";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: {
    background: "var(--primary)",
    color: "#061009",
    border: "1px solid var(--primary)",
  },
  secondary: {
    background: "var(--surface-hover)",
    color: "var(--foreground)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--muted-strong)",
    border: "1px solid transparent",
  },
  outline: {
    background: "transparent",
    color: "var(--foreground)",
    border: "1px solid var(--border-strong)",
  },
  danger: {
    background: "var(--danger)",
    color: "#fff",
    border: "1px solid var(--danger)",
  },
  "danger-soft": {
    background: "var(--danger-dim)",
    color: "var(--danger)",
    border: "1px solid rgba(239,68,68,0.25)",
  },
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 rounded-md gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-lg gap-2",
  lg: "text-sm px-5 py-3 rounded-lg gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  type = "button",
  className = "",
  ...props
}) {
  const style = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none ${SIZES[size]} ${
        fullWidth ? "w-full" : ""
      } ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:brightness-110 active:scale-[0.98]"} ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" style={{ animation: "wa-spin 0.7s linear infinite" }} />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </button>
  );
}
