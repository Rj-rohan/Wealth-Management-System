"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";

// Lightweight local task list (demo). Persisted per session only.
const SEED = [
  { id: 1, text: "Prepare Q3 portfolio review deck", done: false },
  { id: 2, text: "Follow up with pending prospects", done: false },
  { id: 3, text: "Review flagged compliance documents", done: false },
  { id: 4, text: "Confirm tomorrow's appointments", done: true },
];

export default function TodaysPriorities() {
  const [tasks, setTasks] = useState(SEED);
  const toggle = (id) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <Card>
      <CardHeader title="Today's Priorities" subtitle={`${remaining} task${remaining === 1 ? "" : "s"} remaining`} icon={ListChecks} />
      <div className="space-y-1.5">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <motion.span
              animate={{ background: t.done ? "var(--primary)" : "var(--surface-raised)", borderColor: t.done ? "var(--primary)" : "var(--border-strong)" }}
              className="flex items-center justify-center w-[18px] h-[18px] rounded-md flex-shrink-0"
              style={{ border: "1px solid var(--border-strong)" }}
            >
              {t.done && <Check size={12} color="#fff" strokeWidth={3} />}
            </motion.span>
            <span className="text-sm" style={{ color: t.done ? "var(--muted)" : "var(--foreground)", textDecoration: t.done ? "line-through" : "none" }}>
              {t.text}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
