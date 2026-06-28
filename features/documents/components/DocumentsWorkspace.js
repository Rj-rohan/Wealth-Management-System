"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { SearchBox, Button, Skeleton, EmptyState, ConfirmDialog } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { documentsService } from "@/services/documents.service";
import { DOCUMENT_CATEGORIES, categoryMeta } from "../constants";
import { formatDate } from "@/utils/format";
import UploadDocumentModal from "./UploadDocumentModal";

export default function DocumentsWorkspace() {
  const { success, error: notifyError } = useNotifications();
  const [docs, setDocs] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, c] = await Promise.all([documentsService.list({ search, category }), documentsService.categoryCounts()]);
    setDocs(list);
    setCounts(c);
    setLoading(false);
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await documentsService.remove(deleteId);
      success("Document deleted");
      setDeleteId(null);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-5">
      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory("all")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors"
          style={{ background: category === "all" ? "var(--primary-dim)" : "var(--surface-raised)", border: `1px solid ${category === "all" ? "var(--primary)" : "var(--border)"}`, color: category === "all" ? "var(--primary)" : "var(--muted-strong)" }}
        >
          All <span className="text-xs opacity-70">{total}</span>
        </button>
        {DOCUMENT_CATEGORIES.map((c) => {
          const active = category === c.value;
          const Icon = c.icon;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors"
              style={{ background: active ? "var(--primary-dim)" : "var(--surface-raised)", border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, color: active ? "var(--primary)" : "var(--muted-strong)" }}
            >
              <Icon size={14} style={{ color: c.color }} /> {c.label} <span className="text-xs opacity-70">{counts[c.value] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Search documents or clients…" />
        </div>
        <Button icon={Upload} onClick={() => setUploadOpen(true)}>Upload</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={92} rounded={16} />)}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No documents found" description="Upload a document to get started." action={<Button onClick={() => setUploadOpen(true)}>Upload</Button>} />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {docs.map((d) => {
              const meta = categoryMeta(d.category);
              const Icon = meta.icon;
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "var(--surface-hover)", color: meta.color }}>
                      <Icon size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{d.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{d.clientName}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{(d.sizeKb / 1024).toFixed(1)} MB · {formatDate(d.uploadedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <button className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Download"><Download size={15} /></button>
                    <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }} aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={load} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete document"
        message="This document will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
