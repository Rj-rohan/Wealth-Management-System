"use client";
import { useState } from "react";
import { StickyNote, Pin, Plus } from "lucide-react";
import { Card, CardHeader, Button, Textarea, Input, Badge, EmptyState } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { notesService } from "@/services/notes.service";
import { formatDate } from "@/utils/format";

export default function ClientNotes({ client, onChanged }) {
  const { success, error: notifyError } = useNotifications();
  const [notes, setNotes] = useState(client.notes || []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setSaving(true);
    try {
      const note = await notesService.create({ ...draft, clientId: client.id, clientName: client.name, type: "private" });
      setNotes((n) => [note, ...n]);
      setDraft({ title: "", body: "" });
      setAdding(false);
      success("Note added");
      onChanged?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Advisor Notes"
        subtitle="Private notes about this client"
        icon={StickyNote}
        action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding((a) => !a)}>Add</Button>}
      />

      {adding && (
        <div className="space-y-2 mb-4 rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
          <Input name="title" placeholder="Note title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <Textarea name="body" rows={3} placeholder="Write your note…" value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={add} loading={saving}>Save note</Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Capture observations and follow-ups here." />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                  {n.pinned && <Pin size={12} style={{ color: "var(--warning)" }} />}
                  {n.title}
                </p>
                <Badge tone={n.type === "meeting" ? "info" : "neutral"}>{n.type}</Badge>
              </div>
              <p className="text-xs" style={{ color: "var(--muted-strong)" }}>{n.body}</p>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>{formatDate(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
