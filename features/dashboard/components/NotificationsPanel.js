"use client";
import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { NOTIFICATIONS } from "../constants";

const CONFIG = {
  warning: { icon: AlertTriangle, color: "var(--warning)", bg: "rgba(245,158,11,0.14)" },
  success: { icon: CheckCircle2, color: "var(--success)", bg: "var(--accent-dim)" },
  info: { icon: Info, color: "var(--info)", bg: "rgba(56,189,248,0.14)" },
};

export default function NotificationsPanel() {
  return (
    <Card>
      <CardHeader title="Notifications" subtitle="Things that need your attention" icon={Bell} />
      {NOTIFICATIONS.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
      ) : (
        <div className="space-y-2">
        {NOTIFICATIONS.map((n) => {
          const cfg = CONFIG[n.type] || CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {n.text}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {n.detail}
                </p>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </Card>
  );
}
