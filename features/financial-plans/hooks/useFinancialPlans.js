"use client";
import { useState, useEffect, useCallback } from "react";
import { financialPlansService } from "@/services/financial-plans.service";

export function useFinancialPlans(filters = {}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await financialPlansService.list(filters);
    setPlans(res.items);
    setMeta({ total: res.total, page: res.page, totalPages: res.totalPages });
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { plans, loading, meta, reload: load };
}

export function usePlanDetail(planId) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    financialPlansService.getById(planId).then((p) => { setPlan(p); setLoading(false); });
  }, [planId]);

  return { plan, setPlan, loading };
}
