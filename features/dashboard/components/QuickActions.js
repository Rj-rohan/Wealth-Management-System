"use client";
import { useRouter } from "next/navigation";
import { UserCog, CalendarRange, Award, Settings, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";

const ACTIONS = [
  { label: "Complete Profile", icon: UserCog, href: "/profile" },
  { label: "Update Availability", icon: CalendarRange, href: "/profile?tab=availability" },
  { label: "Add Certification", icon: Award, href: "/profile?tab=certifications" },
  { label: "Open Settings", icon: Settings, href: "/settings" },
];

export default function QuickActions() {
  const router = useRouter();
  return (
    <Card>
      <CardHeader title="Quick Actions" subtitle="Jump straight to what matters" />
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map(({ label, icon: Icon, href }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className="flex items-center gap-2.5 rounded-xl p-3 text-left transition-all duration-150"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
              <Icon size={16} />
            </span>
            <span className="text-sm font-medium flex-1" style={{ color: "var(--foreground)" }}>
              {label}
            </span>
            <ChevronRight size={15} style={{ color: "var(--muted)" }} />
          </button>
        ))}
      </div>
    </Card>
  );
}
