"use client";
import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { useGoals } from "../hooks/useGoals";
import GoalCard from "./GoalCard";
import AddGoalModal from "./AddGoalModal";
import { useNotifications } from "@/context/NotificationContext";

export default function GoalPlanningWorkspace() {
  const [clientId, setClientId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { goals, loading, createGoal } = useGoals(clientId);
  const { success } = useNotifications();

  async function handleCreate(payload) {
    await createGoal(payload);
    success("Goal created successfully");
  }

  const byStatus = { on_track: [], at_risk: [], behind: [], completed: [], not_started: [] };
  goals.forEach((g) => byStatus[g.status]?.push(g));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ClientSelector value={clientId} onChange={setClientId} />
        {clientId && <Button icon={Plus} size="sm" onClick={() => setAddOpen(true)}>New Goal</Button>}
      </div>

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Target size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to view their goals</p>
        </div>
      )}

      {clientId && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={180} rounded={16} />)}
        </div>
      )}

      {clientId && !loading && goals.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Target size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>No goals yet. Create one to get started.</p>
          <Button className="mt-4" icon={Plus} onClick={() => setAddOpen(true)}>Create First Goal</Button>
        </div>
      )}

      {clientId && !loading && goals.length > 0 && (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.sort((a, b) => {
            const prio = { high: 0, medium: 1, low: 2 };
            return (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1);
          }).map((g) => (
            <StaggerItem key={g.id}>
              <GoalCard goal={g} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <AddGoalModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
