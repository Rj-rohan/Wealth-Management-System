"use client";
import { useState, useEffect } from "react";
import { recommendationsService } from "@/services/recommendations.service";

export function useRecommendations(clientId) {
  const [recs, setRecs] = useState([]);
  const [advisorAdvice, setAdvisorAdvice] = useState(null);
  const [advisorAnalysis, setAdvisorAnalysis] = useState(null);
  const [prerequisites, setPrerequisites] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!clientId) {
      setRecs([]);
      setAdvisorAdvice(null);
      setAdvisorAnalysis(null);
      setPrerequisites(null);
      return;
    }
    setLoading(true);
    try {
      const res = await recommendationsService.listByClient(clientId);
      if (Array.isArray(res)) {
        setRecs(res);
        setPrerequisites(null);
      } else if (res && typeof res === "object") {
        setRecs(res.recommendations || []);
        setAdvisorAdvice(res.advisorAdvice || null);
        setAdvisorAnalysis(res.advisorAnalysis || null);
        setPrerequisites(res.prerequisites || null);
      }
    } catch {
      setRecs([]);
      setPrerequisites(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [clientId]);

  const markActioned = async (recId) => {
    const updated = await recommendationsService.markActioned(recId);
    setRecs((prev) => prev.map((r) => (r.id === recId ? updated : r)));
  };

  return {
    recs,
    advisorAdvice,
    advisorAnalysis,
    prerequisites,
    loading,
    markActioned,
    reload: fetchRecommendations,
  };
}
