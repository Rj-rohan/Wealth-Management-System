"use client";
import { useState, useEffect, useCallback } from "react";
import { scenarioPlannerService } from "@/services/scenario-planner.service";

export function useScenarioPlanner(clientId) {
  const [baseline, setBaseline] = useState(null);
  const [params, setParams] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) { setBaseline(null); setParams(null); setResults(null); return; }
    let active = true;
    setLoading(true);
    scenarioPlannerService.getBaselineScenario(clientId).then((res) => {
      if (!active) return;
      setBaseline(res);
      setParams({
        monthlySavings: res.monthlySavings,
        monthlyIncome: res.monthlyIncome,
        monthlyExpenses: res.monthlyExpenses,
        investmentReturn: res.investmentReturn,
        inflation: res.inflation,
        retirementAge: res.retirementAge,
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [clientId]);

  const simulate = useCallback(async (newParams) => {
    if (!clientId) return;
    const p = newParams || params;
    setParams(p);
    const res = await scenarioPlannerService.simulate(clientId, p);
    setResults(res);
  }, [clientId, params]);

  useEffect(() => {
    if (params && clientId) simulate(params);
  }, [params, clientId]);

  const updateParam = (key, value) => {
    setParams((prev) => prev ? { ...prev, [key]: value } : null);
  };

  return { baseline, params, results, loading, updateParam, simulate };
}
