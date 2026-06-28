"use client";
import { useState, useEffect, useCallback } from "react";
import { clientsService } from "@/services/clients.service";

export function useClient(id) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await clientsService.getById(id);
    if (!data) setNotFound(true);
    setClient(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { client, setClient, loading, notFound, reload: load };
}
