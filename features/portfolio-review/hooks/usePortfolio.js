"use client";
import { useState, useEffect } from "react";
import { portfolioService } from "@/services/portfolio.service";

export function usePortfolioData(clientId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) { setData(null); return; }
    let active = true;
    setLoading(true);
    portfolioService.getFullPortfolio(clientId).then((res) => {
      if (active) { setData(res); setLoading(false); }
    });
    return () => { active = false; };
  }, [clientId]);

  return { data, loading };
}
