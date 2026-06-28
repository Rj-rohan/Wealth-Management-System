"use client";

export default function Textarea({ label, error, hint, required = false, rows = 4, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-strong)" }}>
          {label}
          {required && <span style={{ color: "var(--danger)" }}> *</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className="w-full text-sm rounded-xl outline-none transition-all duration-150 px-3.5 py-2.5 resize-y"
        style={{
          background: "var(--surface-raised)",
          border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          color: "var(--foreground)",
        }}
        onFocus={(e) => {
          if (!error) e.target.style.borderColor = "var(--primary)";
        }}
        onBlur={(e) => {
          if (!error) e.target.style.borderColor = "var(--border)";
        }}
        {...props}
      />
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
