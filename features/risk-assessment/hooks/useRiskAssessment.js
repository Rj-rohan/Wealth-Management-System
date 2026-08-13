"use client";
import { useState, useEffect } from "react";
import { riskService } from "@/services/risk.service";

export function useRiskAssessment(clientId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) { setProfile(null); return; }
    let active = true;
    setLoading(true);
    riskService.getProfile(clientId).then((res) => {
      if (active) { setProfile(res); setLoading(false); }
    });
    return () => { active = false; };
  }, [clientId]);

  return { profile, loading };
}
