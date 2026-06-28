"use client";
import { useState, useEffect } from "react";
import { Modal, Input, Textarea, Select, Button, Toggle } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { notesService } from "@/services/notes.service";

const TYPES = [
  { value: "private", label: "Private Note" },
  { value: "meeting", label: "Meeting Note" },
];

export default function NoteEditorModal({ open, onClose, onSaved, note, clients = [] }) {
  const { success, error: notifyError } = useNotifications();
  const [values, setValues] = useState({ title: "", body: "", type: "private", clientId: "", pinned: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(
        note
          ? { title: note.title, body: note.body, type: note.type, clientId: note.clientId || "", pinned: note.pinned }
          : { title: "", body: "", type: "private", clientId: "", pinned: false }
      );
      setErrors({});
    }
  }, [open, note]);

  async function save() {
    const next = {};
    if (!values.title.trim()) next.title = "Title is required";
    if (!values.body.trim()) next.body = "Note content is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (note) await notesService.update(note.id, values);
      else await notesService.create(values);
      success(note ? "Note updated" : "Note created");
      onSaved?.();
      onClose();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? "Edit Note" : "New Note"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving}>{note ? "Save" : "Create"}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Title" name="title" value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} error={errors.title} required />
        <Textarea label="Note" name="body" rows={6} value={values.body} onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))} error={errors.body} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Type" options={TYPES} value={values.type} onChange={(e) => setValues((v) => ({ ...v, type: e.target.value }))} />
          <Select label="Linked client (optional)" placeholder="None" options={clients.map((c) => ({ value: c.id, label: c.name }))} value={values.clientId} onChange={(e) => setValues((v) => ({ ...v, clientId: e.target.value }))} />
        </div>
        <Toggle label="Pin this note" description="Pinned notes stay at the top" checked={values.pinned} onChange={(v) => setValues((val) => ({ ...val, pinned: v }))} />
      </div>
    </Modal>
  );
}
