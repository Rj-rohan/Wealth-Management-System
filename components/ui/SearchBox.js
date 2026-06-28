"use client";
import { Search } from "lucide-react";

export default function SearchBox({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
        <Search size={15} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-xl outline-none pl-9 pr-3 py-2 transition-all duration-150"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}
