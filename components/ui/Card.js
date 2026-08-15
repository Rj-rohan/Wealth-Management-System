"use client";

export default function Card({ children, className = "", padding = "p-5", hover = false, style = {}, ...props }) {
  return (
    <div
      className={`rounded-xl transition-all duration-200 ${padding} ${className}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
        ...style,
      }}
      onMouseEnter={hover ? (e) => (e.currentTarget.style.borderColor = "var(--border-strong)") : undefined}
      onMouseLeave={hover ? (e) => (e.currentTarget.style.borderColor = "var(--border)") : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
          >
            <Icon size={16} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
