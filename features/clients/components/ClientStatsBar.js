"use client";
import { useEffect, useState } from "react";
import { Users, UserCheck, UserPlus, Wallet } from "lucide-react";
import { AnimatedNumber, Skeleton } from "@/components/ui";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { clientsService } from "@/services/clients.service";
import { formatCompact } from "@/utils/format";

export default function ClientStatsBar({ refreshKey }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    clientsService.stats().then((s) => active && setStats(s));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const cards = stats
    ? [
        { label: "Total Clients", value: stats.total, icon: Users, tone: "primary", isCurrency: false },
        { label: "Active", value: stats.active, icon: UserCheck, tone: "success", isCurrency: false },
        { label: "Prospects", value: stats.prospects, icon: UserPlus, tone: "info", isCurrency: false },
        { label: "Assets Under Mgmt", value: stats.totalAUM, icon: Wallet, tone: "warning", isCurrency: true },
      ]
    : [];

  const toneColor = { primary: "var(--primary)", success: "var(--success)", info: "var(--info)", warning: "var(--warning)" };
  const toneBg = { primary: "var(--primary-dim)", success: "var(--accent-dim)", info: "rgba(56,189,248,0.14)", warning: "rgba(245,158,11,0.14)" };

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={86} rounded={16} />
        ))}
      </div>
    );
  }

  return (
    <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <StaggerItem key={c.label}>
          <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="flex items-center justify-center w-9 h-9 rounded-xl mb-3" style={{ background: toneBg[c.tone], color: toneColor[c.tone] }}>
              <c.icon size={18} />
            </span>
            <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {c.isCurrency ? <AnimatedNumber value={c.value} format={(n) => formatCompact(n)} /> : <AnimatedNumber value={c.value} />}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.label}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
