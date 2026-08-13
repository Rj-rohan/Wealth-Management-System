"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export default function RiskAlerts({ alerts = [] }) {
  if (!alerts.length) return null;

  return (
    <Card>
      <CardHeader title="Risk Alerts" subtitle={`${alerts.length} misaligned`} icon={AlertTriangle} />
      <div className="space-y-1">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{a.clientName}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Expected: {a.expected} • Actual: {a.actual.replace(/_/g, " ")}</p>
            </div>
            <Badge tone="warning">Score: {a.score}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
