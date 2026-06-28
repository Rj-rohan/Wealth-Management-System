"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, PinOff, Pencil, Trash2, StickyNote } from "lucide-react";
import { SearchBox, SegmentedControl, Button, Badge, Skeleton, EmptyState, ConfirmDialog } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { notesService } from "@/services/notes.service";
import { clientsService } from "@/services/clients.service";
import { formatDate } from "@/utils/format";
import NoteEditorModal from "./NoteEditorModal";

export default function NotesWorkspace() {
  const { success, error: notifyError } = useNotifications();
  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await notesService.list({ search, type });
    setNotes(list);
    setLoading(false);
  }, [search, type]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    clientsService.list({ pageSize: 100 }).then((r) => setClients(r.items));
  }, []);

  async function togglePin(id) {
    await notesService.togglePin(id);
    load();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await notesService.remove(deleteId);
      success("Note deleted");
      setDeleteId(null);
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(note) {
    setEditing(note);
    setEditorOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Search notes…" />
        </div>
        <SegmentedControl
          size="sm"
          options={[
            { value: "all", label: "All" },
            { value: "private", label: "Private" },
            { value: "meeting", label: "Meeting" },
          ]}
          value={type}
          onChange={setType}
        />
        <Button icon={Plus} onClick={() => { setEditing(null); setEditorOpen(true); }}>New Note</Button>
      </div>

      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={140} rounded={16} />)}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Capture private and meeting notes here." action={<Button onClick={() => { setEditing(null); setEditorOpen(true); }}>New Note</Button>} />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
          <AnimatePresence>
            {notes.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="break-inside-avoid mb-3 rounded-2xl p-4"
                style={{ background: "var(--surface)", border: `1px solid ${n.pinned ? "rgba(245,158,11,0.35)" : "var(--border)"}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{n.title}</p>
                  <Badge tone={n.type === "meeting" ? "info" : "neutral"}>{n.type}</Badge>
                </div>
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--muted-strong)" }}>{n.body}</p>
                {n.clientName && <p className="text-xs mt-2" style={{ color: "var(--primary)" }}>↳ {n.clientName}</p>}
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>{formatDate(n.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePin(n.id)} className="p-1.5 rounded-lg" style={{ color: n.pinned ? "var(--warning)" : "var(--muted)" }} aria-label="Pin">
                      {n.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(n)} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(n.id)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }} aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <NoteEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} onSaved={load} note={editing} clients={clients} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete note"
        message="This note will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
