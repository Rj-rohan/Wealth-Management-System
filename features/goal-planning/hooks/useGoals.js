"use client";
import { useState, useEffect, useCallback } from "react";
import { goalsService } from "@/services/goals.service";

export function useGoals(clientId) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!clientId) { setGoals([]); return; }
    setLoading(true);
    const data = await goalsService.listByClient(clientId);
    setGoals(data);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const createGoal = async (payload) => {
    const goal = await goalsService.create({ ...payload, clientId });
    setGoals((prev) => [...prev, goal]);
    return goal;
  };

  const updateGoal = async (goalId, payload) => {
    const updated = await goalsService.update(goalId, payload);
    setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    return updated;
  };

  const deleteGoal = async (goalId) => {
    await goalsService.delete(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  return { goals, loading, createGoal, updateGoal, deleteGoal, reload: load };
}
