"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { Skeleton, EmptyState, Pagination, Button } from "@/components/ui";
import { useClients } from "../hooks/useClients";
import ClientFilters from "./ClientFilters";
import ClientStatsBar from "./ClientStatsBar";
import ClientCard from "./ClientCard";
import ClientTable from "./ClientTable";
import AddClientModal from "./AddClientModal";

export default function ClientsWorkspace() {
  const { query, update, data, loading, refresh } = useClients();
  const [view, setView] = useState("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [statsKey, setStatsKey] = useState(0);

  function handleCreated() {
    refresh();
    setStatsKey((k) => k + 1);
  }

  const hasResults = data.items.length > 0;

  return (
    <div className="space-y-5">
      <ClientStatsBar refreshKey={statsKey} />

      <ClientFilters query={query} onChange={update} view={view} onViewChange={setView} onAdd={() => setAddOpen(true)} />

      {loading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={210} rounded={16} />
            ))}
          </div>
        ) : (
          <Skeleton height={360} rounded={16} />
        )
      ) : !hasResults ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Try adjusting your filters, or add your first client to get started."
          action={<Button onClick={() => setAddOpen(true)}>Add Client</Button>}
        />
      ) : view === "grid" ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {data.items.map((c) => (
              <ClientCard key={c.id} client={c} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <ClientTable clients={data.items} />
      )}

      {!loading && hasResults && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={query.pageSize}
          onChange={(p) => update({ page: p })}
        />
      )}

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
