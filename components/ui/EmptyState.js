"use client";
import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      <span
        className="flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
        style={{ background: "var(--surface-hover)", color: "var(--muted)" }}
      >
        <Icon size={22} />
      </span>
      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
