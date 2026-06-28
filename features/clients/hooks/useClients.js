"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { clientsService } from "@/services/clients.service";

const DEFAULT_QUERY = {
  search: "",
  status: "all",
  risk: "all",
  sortBy: "name",
  sortDir: "asc",
  page: 1,
  pageSize: 9,
};

export function useClients(initial = {}) {
  const [query, setQuery] = useState({ ...DEFAULT_QUERY, ...initial });
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const fetchData = useCallback(async (q) => {
    const id = ++reqId.current;
    setLoading(true);
    const result = await clientsService.list(q);
    if (id === reqId.current) {
      setData(result);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(query);
  }, [query, fetchData]);

  const update = useCallback((patch) => {
    setQuery((q) => {
      // Any filter change resets pagination to page 1.
      const resetsPage = Object.keys(patch).some((k) => k !== "page");
      return { ...q, ...patch, ...(resetsPage ? { page: 1 } : {}) };
    });
  }, []);

  return { query, update, data, loading, refresh: () => fetchData(query) };
}
