"use client";
import { useState, useEffect, useCallback } from "react";
import { settingsService } from "../services/settingsService";

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.get();
      setSettings(data.settings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, setSettings, loading, reload: load };
}
