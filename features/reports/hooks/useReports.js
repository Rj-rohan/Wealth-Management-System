"use client";
import { useState, useEffect } from "react";
import { reportsService } from "@/services/reports.service";

export function useReports() {
  const [reportTypes, setReportTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsService.getAvailableReports().then((res) => { setReportTypes(res); setLoading(false); });
  }, []);

  return { reportTypes, loading };
}

export function useReportData(clientId, reportType) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId || !reportType) { setData(null); return; }
    let active = true;
    setLoading(true);
    reportsService.getReportData(clientId, reportType).then((res) => {
      if (active) { setData(res); setLoading(false); }
    });
    return () => { active = false; };
  }, [clientId, reportType]);

  return { data, loading };
}
