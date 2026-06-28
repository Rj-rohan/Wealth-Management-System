"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, Button, Modal, EmptyState, ConfirmDialog } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { profileService } from "../services/profileService";
import FieldRenderer from "./FieldRenderer";

/**
 * Generic CRUD section for multi-entry profile collections
 * (qualifications, certifications, licenses).
 */
export default function EntryListSection({
  title,
  subtitle,
  icon,
  collection,
  fields,
  entries = [],
  onUpdated,
  renderSummary,
  emptyText = "No entries added yet.",
}) {
  const { success, error: notifyError } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function openAdd() {
    setEditing(null);
    setValues({});
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(entry) {
    setEditing(entry);
    setValues(entry);
    setErrors({});
    setModalOpen(true);
  }

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function validate() {
    const next = {};
    fields.forEach((f) => {
      if (f.required && !String(values[f.name] ?? "").trim()) next[f.name] = `${f.label} is required`;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {};
      fields.forEach((f) => (payload[f.name] = values[f.name] ?? ""));
      const aggregate = editing
        ? await profileService.updateEntry(collection, { id: editing.id, ...payload })
        : await profileService.addEntry(collection, payload);
      onUpdated?.(aggregate);
      success(editing ? "Entry updated" : "Entry added");
      setModalOpen(false);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const aggregate = await profileService.deleteEntry(collection, deleteId);
      onUpdated?.(aggregate);
      success("Entry removed");
      setDeleteId(null);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={
          <Button size="sm" variant="secondary" icon={Plus} onClick={openAdd}>
            Add
          </Button>
        }
      />

      {entries.length === 0 ? (
        <EmptyState icon={icon} title="Nothing here yet" description={emptyText} action={<Button size="sm" icon={Plus} onClick={openAdd}>Add entry</Button>} />
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-xl p-3.5"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <div className="min-w-0">{renderSummary(entry)}</div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteId(entry.id)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${title}` : `Add ${title}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Save changes" : "Add"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field.name} className={field.full ? "sm:col-span-2" : ""}>
              <FieldRenderer field={field} value={values[field.name]} error={errors[field.name]} onChange={update} />
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete entry"
        message="This entry will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
      />
    </Card>
  );
}
