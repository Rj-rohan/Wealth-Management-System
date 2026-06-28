"use client";

// Controlled tab bar. tabs: [{ id, label, icon }]
export default function Tabs({ tabs = [], active, onChange, className = "" }) {
  return (
    <div
      className={`flex gap-1 overflow-x-auto ${className}`}
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className="relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150"
            style={{ color: isActive ? "var(--primary)" : "var(--muted)" }}
          >
            {Icon && <Icon size={15} />}
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: "var(--primary)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
