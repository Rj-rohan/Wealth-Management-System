"use client";
import { Target } from "lucide-react";
import { Card, CardHeader, ProgressBar, EmptyState } from "@/components/ui";
import { formatCompact } from "@/utils/format";

export default function GoalsList({ goals = [] }) {
  return (
    <Card>
      <CardHeader title="Financial Goals" subtitle="Progress toward objectives" icon={Target} />
      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals set" description="Financial goals will appear here." />
      ) : (
        <div className="space-y-4">
          {goals.map((g) => (
            <div key={g.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{g.label}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {g.progress}% · target {formatCompact(g.target)}
                </span>
              </div>
              <ProgressBar value={g.progress} color={g.progress >= 75 ? "var(--success)" : "var(--primary)"} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
