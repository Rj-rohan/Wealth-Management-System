"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge, ScoreRing } from "@/components/ui";
import { Target } from "lucide-react";
import Link from "next/link";

export default function GoalAchievementSummary({ summary }) {
  if (!summary) return null;

  const items = [
    { label: "Completed", value: summary.completed, tone: "success" },
    { label: "On Track", value: summary.onTrack, tone: "info" },
    { label: "At Risk", value: summary.atRisk, tone: "warning" },
    { label: "Behind", value: summary.behind, tone: "danger" },
  ];

  const pct = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <Card>
      <CardHeader title="Goal Achievement" subtitle={`${summary.total} total goals`} icon={Target} action={
        <Link href="/goals" className="text-xs font-medium" style={{ color: "var(--primary)" }}>View all</Link>
      } />
      <div className="flex items-center gap-4">
        <ScoreRing value={pct} max={100} size={64} strokeWidth={5} label="Complete" />
        <div className="flex flex-wrap gap-2">
          {items.map((i) => (
            <Badge key={i.label} tone={i.tone}>{i.label}: {i.value}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
