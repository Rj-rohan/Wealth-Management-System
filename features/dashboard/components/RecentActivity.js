"use client";
import { Activity, UserCog, Award, CalendarRange, ShieldCheck } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { RECENT_ACTIVITY } from "../constants";

const ICONS = {
  profile: UserCog,
  certification: Award,
  availability: CalendarRange,
  security: ShieldCheck,
};

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader title="Recent Activity" subtitle="Latest changes to your account" icon={Activity} />
      {RECENT_ACTIVITY.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Your recent account activity will show up here." />
      ) : (
        <div className="space-y-1">
        {RECENT_ACTIVITY.map((item, idx) => {
          const Icon = ICONS[item.type] || Activity;
          const last = idx === RECENT_ACTIVITY.length - 1;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ background: "var(--surface-raised)", color: "var(--primary)", border: "1px solid var(--border)" }}
                >
                  <Icon size={14} />
                </span>
                {!last && <span className="flex-1 w-px my-1" style={{ background: "var(--border)" }} />}
              </div>
              <div className="pb-4">
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  {item.text}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {item.time}
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
