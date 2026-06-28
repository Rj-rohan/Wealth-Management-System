"use client";
import { useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { Modal, Input, Select, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { clientsService } from "@/services/clients.service";
import { documentsService } from "@/services/documents.service";
import { DOCUMENT_CATEGORIES } from "../constants";

export default function UploadDocumentModal({ open, onClose, onUploaded }) {
  const { success, error: notifyError } = useNotifications();
  const [clients, setClients] = useState([]);
  const [values, setValues] = useState({ name: "", category: "kyc", clientId: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) clientsService.list({ pageSize: 100 }).then((r) => setClients(r.items));
  }, [open]);

  async function save() {
    const next = {};
    if (!values.name.trim()) next.name = "Document name is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const doc = await documentsService.upload(values);
      success("Document uploaded");
      onUploaded?.(doc);
      onClose();
      setValues({ name: "", category: "kyc", clientId: "" });
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
      title="Upload Document"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button icon={UploadCloud} onClick={save} loading={saving}>Upload</Button>
        </>
      }
    >
      <div
        className="flex flex-col items-center justify-center rounded-xl py-8 mb-4 border-dashed"
        style={{ border: "1.5px dashed var(--border-strong)", background: "var(--surface-raised)" }}
      >
        <UploadCloud size={28} style={{ color: "var(--primary)" }} />
        <p className="text-sm mt-2" style={{ color: "var(--muted-strong)" }}>Drag & drop a file here</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>or fill in the details below (demo upload)</p>
      </div>

      <div className="space-y-3">
        <Input label="Document name" name="name" placeholder="e.g. Tax Return 2025" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} error={errors.name} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Category" options={DOCUMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} value={values.category} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))} />
          <Select label="Client (optional)" placeholder="Unassigned" options={clients.map((c) => ({ value: c.id, label: c.name }))} value={values.clientId} onChange={(e) => setValues((v) => ({ ...v, clientId: e.target.value }))} />
        </div>
      </div>
    </Modal>
  );
}
