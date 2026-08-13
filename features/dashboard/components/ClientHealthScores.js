"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui";
import { Activity } from "lucide-react";
import Link from "next/link";

export default function ClientHealthScores({ clients = [] }) {
  if (!clients.length) return null;

  return (
    <Card>
      <CardHeader title="Client Health Scores" icon={Activity} action={
        <Link href="/financial-analysis" className="text-xs font-medium" style={{ color: "var(--primary)" }}>View all</Link>
      } />
      <div className="space-y-3">
        {clients.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <ScoreRing value={c.score} max={100} size={40} strokeWidth={4} showValue />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{c.name}</p>
            </div>
            <span className="text-xs font-medium" style={{ color: c.score >= 70 ? "var(--success)" : c.score >= 40 ? "var(--warning)" : "var(--danger)" }}>
              {c.score}/100
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
