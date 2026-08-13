"use client";
import { useState, useEffect } from "react";
import { recommendationsService } from "@/services/recommendations.service";

export function useRecommendations(clientId) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) { setRecs([]); return; }
    let active = true;
    setLoading(true);
    recommendationsService.listByClient(clientId).then((res) => {
      if (active) { setRecs(res); setLoading(false); }
    });
    return () => { active = false; };
  }, [clientId]);

  const markActioned = async (recId) => {
    const updated = await recommendationsService.markActioned(recId);
    setRecs((prev) => prev.map((r) => (r.id === recId ? updated : r)));
  };

  return { recs, loading, markActioned };
}
