"use client";

export default function Toggle({ checked = false, onChange, label, description, disabled = false }) {
  const content = (
    <span
      onClick={() => !disabled && onChange?.(!checked)}
      className="relative inline-flex flex-shrink-0 transition-colors duration-200 rounded-full"
      style={{
        width: 42,
        height: 24,
        background: checked ? "var(--primary)" : "var(--surface-hover)",
        border: `1px solid ${checked ? "var(--primary)" : "var(--border-strong)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="absolute top-1/2 rounded-full transition-all duration-200"
        style={{
          width: 18,
          height: 18,
          background: "#fff",
          transform: "translateY(-50%)",
          left: checked ? 21 : 3,
        }}
      />
    </span>
  );

  if (!label) return content;

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        )}
      </div>
      {content}
    </div>
  );
}
