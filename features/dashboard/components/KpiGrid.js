"use client";
import { Users, UserCheck, CalendarClock, MessagesSquare, Wallet, Sparkles } from "lucide-react";
import { AnimatedNumber } from "@/components/ui";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { formatCompact } from "@/utils/format";

export default function KpiGrid({ data, completion = 0 }) {
  const cards = [
    { label: "Total Clients", value: data?.stats.total ?? 0, icon: Users, tone: "primary" },
    { label: "Active Clients", value: data?.stats.active ?? 0, icon: UserCheck, tone: "success" },
    { label: "Upcoming Meetings", value: data?.upcoming.length ?? 0, icon: CalendarClock, tone: "info" },
    { label: "Unread Messages", value: data?.unread ?? 0, icon: MessagesSquare, tone: "warning" },
    { label: "Assets Under Mgmt", value: data?.stats.totalAUM ?? 0, icon: Wallet, tone: "success", currency: true },
    { label: "Profile Completion", value: completion, icon: Sparkles, tone: "primary", suffix: "%" },
  ];
  const toneColor = { primary: "var(--primary)", success: "var(--success)", info: "var(--info)", warning: "var(--warning)" };
  const toneBg = { primary: "var(--primary-dim)", success: "var(--accent-dim)", info: "rgba(56,189,248,0.14)", warning: "rgba(245,158,11,0.14)" };

  return (
    <StaggerGroup className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <StaggerItem key={c.label}>
          <div className="rounded-2xl p-4 h-full" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="flex items-center justify-center w-9 h-9 rounded-xl mb-3" style={{ background: toneBg[c.tone], color: toneColor[c.tone] }}>
              <c.icon size={18} />
            </span>
            <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              <AnimatedNumber value={c.value} format={c.currency ? (n) => formatCompact(n) : (n) => `${Math.round(n).toLocaleString()}${c.suffix || ""}`} />
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.label}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
