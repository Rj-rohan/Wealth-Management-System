"use client";
import { useState } from "react";
import { Modal, Input, Select, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { clientsService } from "@/services/clients.service";
import { isEmail, isRequired } from "@/utils/validation";

const STATUS = [
  { value: "prospect", label: "Prospect" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
];
const RISK = [
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
];

export default function AddClientModal({ open, onClose, onCreated }) {
  const { success, error: notifyError } = useNotifications();
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "", occupation: "", status: "prospect", riskProfile: "moderate" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function save() {
    const next = {};
    if (!isRequired(values.firstName)) next.firstName = "First name is required";
    if (!isRequired(values.lastName)) next.lastName = "Last name is required";
    if (!isEmail(values.email)) next.email = "Valid email required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const client = await clientsService.create(values);
      success(`${client.name} added to your client list`);
      onCreated?.(client);
      onClose();
      setValues({ firstName: "", lastName: "", email: "", phone: "", occupation: "", status: "prospect", riskProfile: "moderate" });
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
      title="Add New Client"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving}>Add Client</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="First Name" name="firstName" value={values.firstName} onChange={(e) => update("firstName", e.target.value)} error={errors.firstName} required />
        <Input label="Last Name" name="lastName" value={values.lastName} onChange={(e) => update("lastName", e.target.value)} error={errors.lastName} required />
        <Input label="Email" name="email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} error={errors.email} required />
        <Input label="Phone" name="phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
        <Input label="Occupation" name="occupation" value={values.occupation} onChange={(e) => update("occupation", e.target.value)} className="sm:col-span-2" />
        <Select label="Status" options={STATUS} value={values.status} onChange={(e) => update("status", e.target.value)} />
        <Select label="Risk Profile" options={RISK} value={values.riskProfile} onChange={(e) => update("riskProfile", e.target.value)} />
      </div>
    </Modal>
  );
}
