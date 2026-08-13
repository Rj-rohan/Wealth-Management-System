"use client";
import { useState, useEffect } from "react";
import { financialAnalysisService } from "@/services/financial-analysis.service";

export function useFinancialAnalysis(clientId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) { setData(null); return; }
    let active = true;
    setLoading(true);
    financialAnalysisService.getFullAnalysis(clientId).then((res) => {
      if (active) { setData(res); setLoading(false); }
    });
    return () => { active = false; };
  }, [clientId]);

  return { data, loading };
}
