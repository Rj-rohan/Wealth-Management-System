"use client";
import { CalendarDays, Sparkles } from "lucide-react";
import { greeting, fullToday } from "@/utils/format";
import ProgressBar from "@/components/ui/ProgressBar";

export default function WelcomeSection({ name, completion = 0 }) {
  return (
    <div
      className="rounded-xl p-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(700px circle at 90% -10%, rgba(22,217,106,0.12), transparent 50%), var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--muted)" }}>
            <CalendarDays size={13} /> {fullToday()}
          </p>
          <h2 className="text-2xl font-bold mt-1.5" style={{ color: "var(--foreground)" }}>
            {greeting()}, {name || "Advisor"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-strong)" }}>
            Here's what's happening across your advisory practice today.
          </p>
        </div>

        <div
          className="rounded-xl p-4 w-full sm:w-64"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--muted-strong)" }}>
              <Sparkles size={13} style={{ color: "var(--primary)" }} /> Profile completion
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {completion}%
            </span>
          </div>
          <ProgressBar value={completion} />
        </div>
      </div>
    </div>
  );
}
